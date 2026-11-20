import { NextResponse } from "next/server"
import { getSimulatedFailures } from "../../status/utils/failParam"
import {
  serviceMetadata,
  getOverallStatus,
  calculateUptime,
  calculateLatencies
} from "../../status/utils/statusConfig"
import {
  CHECK_TIMEOUT_MS,
  withDeadline,
  supabaseConfig,
  getPublicClient,
  checkDatabase,
  checkAuth
} from "@/lib/health/checks"

/**
 * System Status API Endpoint
 * Performs real health checks on all services
 * Supports ?fail=database,auth to simulate failures for testing (fora de Produção)
 *
 * Só usa a chave pública: as checagens de banco e Auth vêm de src/lib/health/checks.js, as mesmas
 * do /health. Realtime e Storage não são checados: o app não usa.
 */

// Nome e descrição de cada serviço vêm de serviceMetadata (o mesmo texto que a página usa)
function service(id, status, latency = 0) {
  const { name, description } = serviceMetadata[id]
  return { id, name, description, status, latency }
}

const asService = async (id, check) => {
  const { status, latency } = await check
  return service(id, status, latency)
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
      run("database", () => asService("database", checkDatabase(client))),
      run("auth", () => asService("auth", checkAuth(config))),
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
