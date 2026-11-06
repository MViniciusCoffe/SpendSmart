import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getSimulatedFailures } from "../../status/utils/failParam"
import {
  serviceMetadata,
  getOverallStatus,
  calculateUptime,
  calculateLatencies
} from "../../status/utils/statusConfig"

/**
 * System Status API Endpoint
 * Performs real health checks on all services
 * Supports ?fail=database,auth to simulate failures for testing (fora de Produção)
 *
 * Só usa a chave pública. A rota é aberta, sem login: com o cliente admin (service_role, ignora RLS),
 * qualquer descuido futuro (logar um resultado, devolver um erro) viraria vazamento. O banco é
 * checado pela RPC health_check() (20261106150417_add_health_check.sql), que não lê linha nenhuma, e
 * o Auth pelo endpoint público /auth/v1/health. Realtime e Storage não são checados: o app não usa.
 */

// Each check gives up after this long, so an unreachable project shows up as "critical"
// instead of hanging until the serverless function times out (504). A per-request timeout
// alone is not enough: supabase-js retries failed requests, multiplying the wait.
const CHECK_TIMEOUT_MS = 3000

const fetchWithTimeout = (url, options = {}) =>
  fetch(url, { ...options, signal: options.signal ?? AbortSignal.timeout(CHECK_TIMEOUT_MS) })

function withDeadline(promise, ms = CHECK_TIMEOUT_MS) {
  let timer
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
  })
  return Promise.race([promise, deadline]).finally(() => clearTimeout(timer))
}

// Nome e descrição de cada serviço vêm de serviceMetadata (o mesmo texto que a página usa)
function service(id, status, latency = 0) {
  const { name, description } = serviceMetadata[id]
  return { id, name, description, status, latency }
}

function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  return url && key ? { url, key } : null
}

function getPublicClient(config) {
  if (!config) return null
  return createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: fetchWithTimeout }
  })
}

async function checkDatabase(client) {
  if (!client) return service("database", "critical")
  const start = Date.now()
  try {
    const { data, error } = await withDeadline(client.rpc("health_check"))
    return service(
      "database",
      !error && data === true ? "operational" : "critical",
      Date.now() - start
    )
  } catch {
    return service("database", "critical", Date.now() - start)
  }
}

async function checkAuth(config) {
  if (!config) return service("auth", "critical")
  const start = Date.now()
  try {
    const response = await fetchWithTimeout(`${config.url}/auth/v1/health`, {
      headers: { apikey: config.key },
      cache: "no-store"
    })
    return service("auth", response.ok ? "operational" : "degraded", Date.now() - start)
  } catch {
    return service("auth", "critical", Date.now() - start)
  }
}

// URL absoluta a partir da própria requisição. Antes era `${NEXT_PUBLIC_APP_URL}/api/health`, variável
// que não existe em nenhum ambiente: o fetch recebia uma URL relativa, lançava no servidor, e o catch
// marcava "degraded" em produção e "operational" em desenvolvimento, escondendo a falha.
async function checkAPI(request) {
  const start = Date.now()
  try {
    const response = await fetch(new URL("/api/health", request.url), {
      signal: AbortSignal.timeout(5000),
      cache: "no-store"
    })
    return service("api", response.ok ? "operational" : "degraded", Date.now() - start)
  } catch {
    return service("api", "degraded", Date.now() - start)
  }
}

async function checkCDN() {
  const start = Date.now()
  try {
    const response = await fetch("https://vercel.com", {
      method: "HEAD",
      signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
      cache: "no-store"
    })
    return service("cdn", response.ok ? "operational" : "degraded", Date.now() - start)
  } catch {
    // Antes devolvia "operational" mesmo sem resposta
    return service("cdn", "degraded", Date.now() - start)
  }
}

// ?fail=database,auth simula falhas (testes da página de status); cada serviço aceita dois nomes.
// Desligado em Produção (VERCEL_ENV): ferramenta de teste não fica aberta ao público. O Preview e o
// local continuam aceitando, para os testes de sistema.
const FAIL_ALIASES = {
  database: ["database", "db"],
  auth: ["auth", "authentication"],
  api: ["api", "api-gateway"],
  cdn: ["cdn", "edge"]
}

const failSimulationEnabled = () => process.env.VERCEL_ENV !== "production"

export const dynamic = "force-dynamic"

export async function GET(request) {
  try {
    const config = supabaseConfig()
    const client = getPublicClient(config)
    const failures = failSimulationEnabled() ? getSimulatedFailures(request) : new Set()
    const simulated = id => FAIL_ALIASES[id].some(alias => failures.has(alias))
    const run = (id, check) => (simulated(id) ? service(id, "critical") : check())

    const services = await Promise.all([
      run("database", () => checkDatabase(client)),
      run("auth", () => checkAuth(config)),
      run("api", () => checkAPI(request)),
      run("cdn", () => checkCDN())
    ])

    const { avg: avgLatency, p95: p95Latency, p99: p99Latency } = calculateLatencies(services)

    const operationalCount = services.filter(s => s.status === "operational").length
    const uptime = calculateUptime(services)

    const overallStatus = getOverallStatus(services)

    // A tabela incidents ainda não existe (página inspirada na de status do GitHub). Quando for
    // criada, a migration precisa de GRANT SELECT ao anon e política de leitura pública: o histórico
    // de incidentes é público, e esta rota só usa a chave pública.
    let incidents = []
    try {
      if (!client) throw new Error("sem cliente Supabase")
      const { data: incidentData } = await withDeadline(
        client
          .from("incidents")
          .select("id,title,description,severity,created_at,affected_services,resolved,resolved_at")
          .order("created_at", { ascending: false })
          .limit(10)
      )
      if (incidentData) {
        incidents = incidentData.map(i => ({
          id: i.id,
          title: i.title,
          description: i.description,
          severity: i.severity,
          timestamp: i.created_at,
          affectedServices: i.affected_services || [],
          resolved: i.resolved,
          resolvedAt: i.resolved_at
        }))
      }
    } catch (e) {
      // Incidents table doesn't exist yet - that's fine
    }

    const metrics = {
      apiLatency: {
        p95: p95Latency,
        p99: p99Latency,
        avg: avgLatency,
        status: avgLatency > 500 ? "degraded" : avgLatency > 200 ? "warning" : "normal"
      },
      dbLatency: {
        p95: services.find(s => s.id === "database")?.latency || 0,
        status: (services.find(s => s.id === "database")?.latency || 0) > 100 ? "warning" : "normal"
      },
      uptime: Math.round(uptime * 100) / 100,
      servicesUp: operationalCount,
      servicesTotal: services.length,
      lastCheck: new Date().toISOString()
    }

    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: services.map(s => ({
        id: s.id,
        name: s.name,
        status: s.status,
        latency: s.latency,
        description: s.description
      })),
      metrics,
      incidents,
      page: {
        name: "SpendSmart Status",
        url: new URL("/status", request.url).href
      }
    }

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        "X-Content-Type-Options": "nosniff"
      }
    })
  } catch (error) {
    console.error("Status API error:", error)
    return NextResponse.json(
      {
        status: "error",
        error: "Failed to fetch system status",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
