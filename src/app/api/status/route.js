import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getSimulatedFailures } from "../../status/utils/failParam"
import {
  serviceMetadata,
  getOverallStatus,
  calculateUptime,
  calculateLatencies,
  getSeverityConfig
} from "../../status/utils/statusConfig"

/**
 * System Status API Endpoint
 * Performs real health checks on all services
 * Supports ?fail=database,auth to simulate failures for testing
 */

// Create admin client for health checks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })

async function checkDatabase(request) {
  const failures = getSimulatedFailures(request)
  if (failures.has("database") || failures.has("db")) {
    return {
      id: "database",
      name: "PostgreSQL Database",
      status: "critical",
      latency: 0,
      description: "Primary database (Supabase Postgres)"
    }
  }
  const start = Date.now()
  try {
    const { error } = await supabaseAdmin.from("profiles").select("id").limit(1)
    const latency = Date.now() - start
    return {
      id: "database",
      name: "PostgreSQL Database",
      status: error ? "critical" : "operational",
      latency,
      description: "Primary database (Supabase Postgres)"
    }
  } catch (e) {
    return {
      id: "database",
      name: "PostgreSQL Database",
      status: "critical",
      latency: Date.now() - start,
      description: "Primary database (Supabase Postgres)"
    }
  }
}

async function checkAuth(request) {
  const failures = getSimulatedFailures(request)
  if (failures.has("auth") || failures.has("authentication")) {
    return {
      id: "auth",
      name: "Authentication",
      status: "critical",
      latency: 0,
      description: "Supabase Auth (GoTrue)"
    }
  }
  const start = Date.now()
  try {
    const { error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1 })
    const latency = Date.now() - start
    return {
      id: "auth",
      name: "Authentication",
      status: error ? "degraded" : "operational",
      latency,
      description: "Supabase Auth (GoTrue)"
    }
  } catch (e) {
    return {
      id: "auth",
      name: "Authentication",
      status: "critical",
      latency: Date.now() - start,
      description: "Supabase Auth (GoTrue)"
    }
  }
}

async function checkRealtime(request) {
  const failures = getSimulatedFailures(request)
  if (failures.has("realtime") || failures.has("realtime-engine")) {
    return {
      id: "realtime",
      name: "Realtime Engine",
      status: "critical",
      latency: 0,
      description: "Supabase Realtime (Postgres Changes)"
    }
  }
  const start = Date.now()
  try {
    const channel = supabaseAdmin.channel("health-check", {
      config: { broadcast: { self: false } }
    })
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Realtime timeout")), 5000)
      channel.subscribe(status => {
        if (status === "SUBSCRIBED") {
          clearTimeout(timeout)
          supabaseAdmin.removeChannel(channel)
          resolve()
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          clearTimeout(timeout)
          reject(new Error(`Realtime: ${status}`))
        }
      })
    })
    const latency = Date.now() - start
    return {
      id: "realtime",
      name: "Realtime Engine",
      status: "operational",
      latency,
      description: "Supabase Realtime (Postgres Changes)"
    }
  } catch (e) {
    return {
      id: "realtime",
      name: "Realtime Engine",
      status: "degraded",
      latency: Date.now() - start,
      description: "Supabase Realtime (Postgres Changes)"
    }
  }
}

async function checkStorage(request) {
  const failures = getSimulatedFailures(request)
  if (failures.has("storage") || failures.has("file-storage")) {
    return {
      id: "storage",
      name: "File Storage",
      status: "critical",
      latency: 0,
      description: "Supabase Storage (S3-compatible)"
    }
  }
  const start = Date.now()
  try {
    const { error } = await supabaseAdmin.storage.listBuckets()
    const latency = Date.now() - start
    return {
      id: "storage",
      name: "File Storage",
      status: error ? "degraded" : "operational",
      latency,
      description: "Supabase Storage (S3-compatible)"
    }
  } catch (e) {
    return {
      id: "storage",
      name: "File Storage",
      status: "critical",
      latency: Date.now() - start,
      description: "Supabase Storage (S3-compatible)"
    }
  }
}

async function checkAPI(request) {
  const failures = getSimulatedFailures(request)
  if (failures.has("api") || failures.has("api-gateway")) {
    return {
      id: "api",
      name: "API Gateway",
      status: "critical",
      latency: 0,
      description: "Next.js API Routes"
    }
  }
  const start = Date.now()
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "")
    const response = await fetch(`${baseUrl}/api/health`, {
      signal: AbortSignal.timeout(5000),
      cache: "no-store"
    })
    const latency = Date.now() - start
    return {
      id: "api",
      name: "API Gateway",
      status: response.ok ? "operational" : "degraded",
      latency,
      description: "Next.js API Routes"
    }
  } catch (e) {
    return {
      id: "api",
      name: "API Gateway",
      status: process.env.NODE_ENV === "development" ? "operational" : "degraded",
      latency: Date.now() - start,
      description: "Next.js API Routes"
    }
  }
}

async function checkCDN(request) {
  const failures = getSimulatedFailures(request)
  if (failures.has("cdn") || failures.has("edge")) {
    return {
      id: "cdn",
      name: "CDN / Edge Network",
      status: "critical",
      latency: 0,
      description: "Vercel Edge Network"
    }
  }
  const start = Date.now()
  try {
    const response = await fetch("https://vercel.com", {
      method: "HEAD",
      signal: AbortSignal.timeout(3000),
      cache: "no-store"
    })
    const latency = Date.now() - start
    return {
      id: "cdn",
      name: "CDN / Edge Network",
      status: response.ok ? "operational" : "degraded",
      latency,
      description: "Vercel Edge Network"
    }
  } catch (e) {
    return {
      id: "cdn",
      name: "CDN / Edge Network",
      status: "operational",
      latency: Date.now() - start,
      description: "Vercel Edge Network"
    }
  }
}

export const dynamic = "force-dynamic"
export const revalidate = 60

export async function GET(request) {
  try {
    const [database, auth, realtime, storage, api, cdn] = await Promise.allSettled([
      checkDatabase(request),
      checkAuth(request),
      checkRealtime(request),
      checkStorage(request),
      checkAPI(request),
      checkCDN(request)
    ])

    const services = [
      database.status === "fulfilled" ? database.value : { ...database.reason, status: "critical" },
      auth.status === "fulfilled" ? auth.value : { ...auth.reason, status: "critical" },
      realtime.status === "fulfilled" ? realtime.value : { ...realtime.reason, status: "degraded" },
      storage.status === "fulfilled" ? storage.value : { ...storage.reason, status: "degraded" },
      api.status === "fulfilled" ? api.value : { ...api.reason, status: "degraded" },
      cdn.status === "fulfilled" ? cdn.value : { ...cdn.reason, status: "operational" }
    ]

    const { avg: avgLatency, p95: p95Latency, p99: p99Latency } = calculateLatencies(services)

    const operationalCount = services.filter(s => s.status === "operational").length
    const uptime = calculateUptime(services)

    const overallStatus = getOverallStatus(services)

    let incidents = []
    try {
      const { data: incidentData } = await supabaseAdmin
        .from("incidents")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10)
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

    if (incidents.length === 0) {
      incidents = []
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
        url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000/status"
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
