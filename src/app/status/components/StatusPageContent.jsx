"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { StatusBanner } from "./StatusBanner"
import { ServiceList } from "./ServiceList"
import { IncidentTimeline } from "./IncidentTimeline"
import { SystemMetrics } from "./SystemMetrics"
import { PageContainer, PageHeader } from "@/components/layout"
import { Button } from "@/components/ui"
import { StatusPageSkeleton } from "../loading"
import styles from "./StatusPageContent.module.css"

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
        if (!response.ok) throw new Error("Falha ao buscar o status")
        const json = await response.json()
        setData(json)
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
          title="Status do Sistema"
          description="Não foi possível carregar o status do sistema"
          action={
            <Button variant="primary" onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          }
        />
        <div className={styles.errorState}>
          <p className={styles.errorMessage}>Falha ao carregar o status do sistema: {error}</p>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        </div>
      </PageContainer>
    )
  }

  if (!data) {
    return <StatusPageSkeleton />
  }

  return (
    <PageContainer className={styles.page} maxWidth="full" padding="md">
      <header className={styles.masthead}>
        <div className={styles.mastheadCopy}>
          <span className={styles.eyebrow}>SPENDSMART / OPERATIONS</span>
          <h1>Status do sistema</h1>
          <p>Telemetria ao vivo dos sistemas que mantêm seu espaço financeiro funcionando.</p>
        </div>
        <Link href="/" className={styles.dashboardLink} aria-label="Voltar ao dashboard">
          <span>Voltar ao dashboard</span>
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

      <div className={styles.content}>
        <StatusBanner status={data.status} timestamp={data.timestamp} />
        <SystemMetrics metrics={data.metrics} />
        <div className={styles.lowerGrid}>
          <ServiceList services={data.services} />
          <IncidentTimeline incidents={data.incidents} />
        </div>
      </div>
    </PageContainer>
  )
}
