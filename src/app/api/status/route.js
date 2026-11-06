import { NextResponse } from "next/server"
import { getSimulatedFailures } from "../../status/utils/failParam"
import { getSupabaseAdmin } from "../_lib/supabaseAdmin"
import {
  serviceMetadata,
  getOverallStatus,
  calculateUptime,
  calculateLatencies
} from "../../status/utils/statusConfig"

/**
 * System Status API Endpoint
 * Performs real health checks on all services
 * Supports ?fail=database,auth to simulate failures for testing
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

// Serviços que dependem do cliente admin aparecem como "critical" quando a chave falta: sem ela não
// há como verificar, e o build não pode depender dela (ver ../_lib/supabaseAdmin.js)
async function checkDatabase(admin) {
  if (!admin) return service("database", "critical")
  const start = Date.now()
  try {
    const { error } = await withDeadline(admin.from("profiles").select("id").limit(1))
    return service("database", error ? "critical" : "operational", Date.now() - start)
  } catch {
    return service("database", "critical", Date.now() - start)
  }
}

async function checkAuth(admin) {
  if (!admin) return service("auth", "critical")
  const start = Date.now()
  try {
    const { error } = await withDeadline(admin.auth.admin.listUsers({ perPage: 1 }))
    return service("auth", error ? "degraded" : "operational", Date.now() - start)
  } catch {
    return service("auth", "critical", Date.now() - start)
  }
}

async function checkRealtime(admin) {
  if (!admin) return service("realtime", "critical")
  const start = Date.now()
  try {
    const channel = admin.channel("health-check", { config: { broadcast: { self: false } } })
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Realtime timeout")), CHECK_TIMEOUT_MS)
      channel.subscribe(status => {
        if (status === "SUBSCRIBED") {
          clearTimeout(timeout)
          admin.removeChannel(channel)
          resolve()
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          clearTimeout(timeout)
          reject(new Error(`Realtime: ${status}`))
        }
      })
    })
    return service("realtime", "operational", Date.now() - start)
  } catch {
    return service("realtime", "degraded", Date.now() - start)
  }
}

async function checkStorage(admin) {
  if (!admin) return service("storage", "critical")
  const start = Date.now()
  try {
    const { error } = await withDeadline(admin.storage.listBuckets())
    return service("storage", error ? "degraded" : "operational", Date.now() - start)
  } catch {
    return service("storage", "critical", Date.now() - start)
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

// ?fail=database,auth simula falhas (testes da página de status); cada serviço aceita dois nomes
const FAIL_ALIASES = {
  database: ["database", "db"],
  auth: ["auth", "authentication"],
  realtime: ["realtime", "realtime-engine"],
  storage: ["storage", "file-storage"],
  api: ["api", "api-gateway"],
  cdn: ["cdn", "edge"]
}

export const dynamic = "force-dynamic"
export const revalidate = 60

export async function GET(request) {
  try {
    const admin = getSupabaseAdmin({ global: { fetch: fetchWithTimeout } })
    const failures = getSimulatedFailures(request)
    const simulated = id => FAIL_ALIASES[id].some(alias => failures.has(alias))
    const run = (id, check) => (simulated(id) ? service(id, "critical") : check())

    const services = await Promise.all([
      run("database", () => checkDatabase(admin)),
      run("auth", () => checkAuth(admin)),
      run("realtime", () => checkRealtime(admin)),
      run("storage", () => checkStorage(admin)),
      run("api", () => checkAPI(request)),
      run("cdn", () => checkCDN())
    ])

    const { avg: avgLatency, p95: p95Latency, p99: p99Latency } = calculateLatencies(services)

    const operationalCount = services.filter(s => s.status === "operational").length
    const uptime = calculateUptime(services)

    const overallStatus = getOverallStatus(services)

    let incidents = []
    try {
      if (!admin) throw new Error("sem cliente admin")
      const { data: incidentData } = await withDeadline(
        admin
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
