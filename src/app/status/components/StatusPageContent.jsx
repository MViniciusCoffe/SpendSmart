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
import styles from "./StatusPageContent.module.css"

export function StatusPageContent() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    async function fetchStatus() {
      try {
        // Pass search params to API for fail simulation
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
    <PageContainer className={`${styles.page} status-page`} maxWidth="full" padding="md">
      <header className={styles.masthead}>
        <div className={styles.mastheadCopy}>
          <span className={styles.eyebrow}>SPENDSMART / OPERATIONS</span>
          <h1>System status</h1>
          <p>Live telemetry for the systems keeping your financial workspace moving.</p>
        </div>
        <Link href="/" className={styles.dashboardLink} aria-label="Back to dashboard">
          <span>Back to dashboard</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
          </svg>
        </Link>
      </header>

      {data ? (
        <div className={styles.content}>
          <StatusBanner status={data.status} timestamp={data.timestamp} />
          <SystemMetrics metrics={data.metrics} />
          <div className={styles.lowerGrid}>
            <ServiceList services={data.services} />
            <IncidentTimeline incidents={data.incidents} />
          </div>
        </div>
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
