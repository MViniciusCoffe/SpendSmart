"use client"

import { Suspense, useState, useEffect } from "react"
import { StatusCard } from "./StatusCard"
import { ServiceGrid } from "./ServiceGrid"
import { IncidentTimeline } from "./IncidentTimeline"
import { SystemMetrics } from "./SystemMetrics"
import { LoadingSpinner, LoadingSkeleton } from "../../../components/feedback"
import { PageContainer, PageHeader } from "../../../components/layout"

export function StatusPageContent() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchStatus() {
      try {
        const response = await fetch("/api/status", {
          headers: { "Cache-Control": "no-cache" }
        })
        if (!response.ok) throw new Error("Failed to fetch status")
        const data = await response.json()
        setData(data)
      } catch (err) {
        setError(err.message)
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 30000) // Poll every 30s
    return () => clearInterval(interval)
  }, [])

  if (error) {
    return (
      <PageContainer>
        <PageHeader
          title="System Status"
          description="Unable to load system status"
          action={
            <button onClick={() => window.location.reload()} className="retry-button">
              Retry
            </button>
          }
        />
        <div className="error-state">
          <p>Failed to load system status: {error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="System Status"
        description="Real-time monitoring of SpendSmart infrastructure"
        badge={
          data?.status && (
            <span className={`status-badge ${data.status.toLowerCase()}`}>{data.status}</span>
          )
        }
      />

      {data ? (
        <>
          <SystemMetrics metrics={data.metrics} />
          <ServiceGrid services={data.services} />
          <IncidentTimeline incidents={data.incidents} />
        </>
      ) : (
        <Suspense fallback={<SystemMetricsSkeleton />}>
          <SystemMetrics metrics={null} />
        </Suspense>
      )}
    </PageContainer>
  )
}

function SystemMetricsSkeleton() {
  return (
    <div className="metrics-skeleton">
      <LoadingSkeleton variant="card" count={4} />
    </div>
  )
}
