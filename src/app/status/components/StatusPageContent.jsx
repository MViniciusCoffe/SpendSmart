"use client"

import { Suspense, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { StatusBanner } from "./StatusBanner"
import { ServiceList } from "./ServiceList"
import { IncidentTimeline } from "./IncidentTimeline"
import { SystemMetrics } from "./SystemMetrics"
import { LoadingSpinner, LoadingSkeleton } from "@/components/feedback"
import { PageContainer, PageHeader } from "@/components/layout"

export function StatusPageContent() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    async function fetchStatus() {
      try {
        const queryString = searchParams.toString()
        const url = `/api/status${queryString ? `?${queryString}` : ""}`

        const response = await fetch(url, {
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
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [searchParams])

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
    <PageContainer className="status-page" maxWidth="full" padding="md">
      <PageHeader
        title="System Status"
        description="Real-time monitoring of SpendSmart infrastructure"
        action={
          <Link href="/" className="dashboardLink" aria-label="Back to dashboard">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>Dashboard</span>
          </Link>
        }
      />

      {data ? (
        <>
          <StatusBanner status={data.status} timestamp={data.timestamp} />
          <SystemMetrics metrics={data.metrics} />
          <ServiceList services={data.services} />
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
