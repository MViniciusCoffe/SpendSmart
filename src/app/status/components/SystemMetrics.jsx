"use client"

import { StatusCard } from "./StatusCard"
import styles from "./SystemMetrics.module.css"

export function SystemMetrics({ metrics }) {
  if (!metrics) {
    return <SystemMetricsSkeleton />
  }

  return (
    <section className={styles.section} aria-labelledby="metrics-heading">
      <h2 id="metrics-heading" className={styles.sectionTitle}>
        System Metrics
      </h2>
      <div className={styles.grid} role="list" aria-label="System metrics">
        <StatusCard
          title="API Latency (p95)"
          value={metrics.apiLatency?.p95 || 0}
          unit="ms"
          trend={metrics.apiLatency?.trend}
          trendValue={metrics.apiLatency?.change}
          status={metrics.apiLatency?.status}
        />
        <StatusCard
          title="Database Latency (p95)"
          value={metrics.dbLatency?.p95 || 0}
          unit="ms"
          trend={metrics.dbLatency?.trend}
          trendValue={metrics.dbLatency?.change}
          status={metrics.dbLatency?.status}
        />
        <StatusCard
          title="Error Rate"
          value={metrics.errorRate || 0}
          unit="%"
          trend={metrics.errorRateTrend}
          trendValue={metrics.errorRateChange}
          status={metrics.errorRateStatus}
        />
        <StatusCard
          title="Uptime (30d)"
          value={metrics.uptime || 100}
          unit="%"
          trend={metrics.uptimeTrend}
          trendValue={metrics.uptimeChange}
          status="normal"
        />
        <StatusCard
          title="Active Users"
          value={metrics.activeUsers || 0}
          unit=""
          trend={metrics.activeUsersTrend}
          trendValue={metrics.activeUsersChange}
          status="normal"
        />
        <StatusCard
          title="Transactions (24h)"
          value={metrics.transactions24h || 0}
          unit=""
          trend={metrics.transactionsTrend}
          trendValue={metrics.transactionsChange}
          status="normal"
        />
      </div>
    </section>
  )
}

function SystemMetricsSkeleton() {
  return (
    <section className={styles.section} aria-labelledby="metrics-heading">
      <h2 id="metrics-heading" className={styles.sectionTitle}>
        System Metrics
      </h2>
      <div className={styles.grid} role="list" aria-label="System metrics loading">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className={styles.skeletonCard}>
            <div className="skeleton-title" />
            <div className="skeleton-value" />
            <div className="skeleton-trend" />
          </div>
        ))}
      </div>
    </section>
  )
}
