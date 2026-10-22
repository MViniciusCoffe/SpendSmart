import { NextResponse } from "next/server"

/**
 * System Status API Endpoint
 * Returns real-time health status of all services
 * Supports caching with Cache-Control headers
 */

export const dynamic = "force-dynamic"
export const revalidate = 60

export async function GET() {
  try {
    // In production, these would come from actual health checks
    // For now, we simulate realistic data

    const services = [
      {
        id: "api",
        name: "API Gateway",
        status: "operational",
        latency: 45,
        latencyTrend: "down",
        latencyChange: 12,
        uptime: 99.99
      },
      {
        id: "database",
        name: "PostgreSQL Database",
        status: "operational",
        latency: 12,
        latencyTrend: "up",
        latencyChange: 3,
        uptime: 99.95
      },
      {
        id: "auth",
        name: "Authentication (Supabase)",
        status: "operational",
        latency: 38,
        latencyTrend: "down",
        latencyChange: 8,
        uptime: 99.98
      },
      {
        id: "realtime",
        name: "Realtime Engine",
        status: "operational",
        latency: 22,
        latencyTrend: "neutral",
        latencyChange: 0,
        uptime: 99.9
      },
      {
        id: "storage",
        name: "File Storage",
        status: "operational",
        latency: 67,
        latencyTrend: "up",
        latencyChange: 15,
        uptime: 99.85
      },
      {
        id: "email",
        name: "Email Service",
        status: "degraded",
        latency: 245,
        latencyTrend: "up",
        latencyChange: 23,
        uptime: 99.5
      },
      {
        id: "analytics",
        name: "Analytics Pipeline",
        status: "operational",
        latency: 234,
        latencyTrend: "down",
        latencyChange: 31,
        uptime: 99.75
      },
      {
        id: "cdn",
        name: "CDN / Edge",
        status: "operational",
        latency: 8,
        latencyTrend: "neutral",
        latencyChange: 0,
        uptime: 99.99
      }
    ]

    const metrics = {
      apiLatency: {
        p95: 67,
        p99: 142,
        trend: "down",
        change: 12,
        status: "normal"
      },
      dbLatency: {
        p95: 18,
        p99: 45,
        trend: "up",
        change: 3,
        status: "normal"
      },
      errorRate: 0.02,
      errorRateTrend: "down",
      errorRateChange: 15,
      errorRateStatus: "normal",
      uptime: 99.97,
      uptimeTrend: "up",
      uptimeChange: 0.02,
      activeUsers: 1247,
      activeUsersTrend: "up",
      activeUsersChange: 23,
      transactions24h: 15847,
      transactionsTrend: "up",
      transactionsChange: 18
    }

    // Determine overall status
    const statuses = services.map(s => s.status)
    const overallStatus = statuses.includes("critical")
      ? "critical"
      : statuses.includes("degraded")
        ? "degraded"
        : "operational"

    const incidents = [
      {
        id: "inc-2024-001",
        title: "Email delivery delays",
        description:
          "Third-party email provider experiencing delays. Messages may be delayed by up to 15 minutes.",
        severity: "degraded",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        affectedServices: ["Email Service", "Notification System"]
      },
      {
        id: "inc-2024-002",
        title: "Database connection pool exhaustion",
        description:
          "Connection pool temporarily exhausted during peak load. Automatically resolved after scaling.",
        severity: "partial",
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        affectedServices: ["PostgreSQL Database", "API Gateway"]
      }
    ]

    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services,
      metrics,
      incidents,
      page: {
        name: "SpendSmart Status",
        url: "https://status.spendsmart.app"
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
