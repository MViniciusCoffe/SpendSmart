"use client"

import { Card } from "@/components/ui"
import { Badge } from "@/components/ui"
import Link from "next/link"
import {
  getStatusVariant,
  getStatusLabel,
  getStatusColor,
  metricIconMap
} from "../utils/statusConfig"
import styles from "./SystemMetrics.module.css"

import {
  APIIcon,
  DatabaseIcon,
  UptimeIcon,
  ServicesIcon,
  MetricsIcon,
  HomeIcon
} from "../utils/icons"

const metricConfig = [
  { key: "apiLatency", label: "API Latency (p95)", unit: "ms", valueKey: "p95", icon: APIIcon },
  {
    key: "dbLatency",
    label: "Database Latency (p95)",
    unit: "ms",
    valueKey: "p95",
    icon: DatabaseIcon
  },
  {
    key: "uptime",
    label: "Uptime (30d)",
    unit: "%",
    valueKey: "uptime",
    isPercentage: true,
    icon: UptimeIcon
  },
  {
    key: "services",
    label: "Services Operational",
    unit: "",
    valueKey: "servicesUp",
    totalKey: "servicesTotal",
    icon: ServicesIcon
  }
]

const statusColorMap = {
  normal: "var(--color-success)",
  warning: "var(--color-warning)",
  degraded: "var(--color-warning)",
  error: "var(--color-error)",
  critical: "var(--color-error)"
}

export function SystemMetrics({ metrics }) {
  if (!metrics) {
    return <SystemMetricsSkeleton />
  }

  return (
    <section className={styles.section} aria-labelledby="metrics-heading">
      <div className={styles.sectionHeader}>
        <div className={styles.titleGroup}>
          <h2 id="metrics-heading" className={styles.sectionTitle}>
            <span className={styles.sectionIcon} aria-hidden="true">
              <MetricsIcon width={24} height={24} />
            </span>
            System Metrics
          </h2>
          <p className={styles.sectionSubtitle}>
            Real-time performance indicators across all infrastructure
          </p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.lastCheck}>
            Last updated:{" "}
            {metrics.lastCheck ? new Date(metrics.lastCheck).toLocaleTimeString() : "—"}
          </div>
          <Link href="/" className={styles.homeLink} aria-label="Back to dashboard">
            <HomeIcon width={18} height={18} />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>
      <div className={styles.grid} role="list" aria-label="System metrics">
        {metricConfig.map((config, index) => (
          <article
            key={config.key}
            className={styles.metricCard}
            role="listitem"
            style={{ "--card-index": index }}
          >
            <Card variant="default" className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.metricTitleWrapper}>
                  <span
                    className={styles.metricIcon}
                    style={{ color: getStatusColor(config.key) }}
                    aria-hidden="true"
                  >
                    <config.icon width={20} height={20} />
                  </span>
                  <h3 className={styles.metricTitle}>{config.label}</h3>
                </div>
                {config.key !== "services" &&
                  config.key !== "uptime" &&
                  metrics[config.key]?.status && (
                    <Badge
                      variant={getStatusVariant(metrics[config.key].status)}
                      className={styles.metricBadge}
                    >
                      {getStatusLabel(metrics[config.key].status)}
                    </Badge>
                  )}
              </div>
              <div className={styles.metricValueWrapper}>
                <div className={styles.metricMain}>
                  <span className={styles.metricValue}>
                    {config.key === "services"
                      ? `${metrics.servicesUp}/${metrics.servicesTotal}`
                      : config.isPercentage
                        ? metrics[config.key]?.toFixed(2)
                        : metrics[config.key]?.[config.valueKey] || 0}
                    <span className={styles.metricUnit}>{config.unit}</span>
                  </span>
                  {config.key === "apiLatency" && metrics.apiLatency?.avg && (
                    <span className={styles.metricAvg}>avg {metrics.apiLatency.avg}ms</span>
                  )}
                  {config.key === "uptime" && (
                    <span className={styles.metricSubLabel}>99.97% target</span>
                  )}
                  {config.key === "services" && (
                    <span className={styles.metricSubLabel}>
                      {metrics.servicesUp} of {metrics.servicesTotal} healthy
                    </span>
                  )}
                </div>
                <div
                  className={styles.metricTrend}
                  style={{
                    borderLeftColor: statusColorMap[metrics[config.key]?.status] || "transparent"
                  }}
                >
                  {getTrendIndicator(config.key, metrics)}
                </div>
              </div>
            </Card>
          </article>
        ))}
      </div>
    </section>
  )
}

function getTrendIndicator(key, metrics) {
  if (key === "apiLatency" && metrics.apiLatency) {
    return metrics.apiLatency.status === "normal" ? (
      <span className={styles.trendPositive}>▼ Improving</span>
    ) : (
      <span className={styles.trendNegative}>▲ Degraded</span>
    )
  }
  if (key === "dbLatency" && metrics.dbLatency) {
    return metrics.dbLatency.status === "normal" ? (
      <span className={styles.trendPositive}>▼ Stable</span>
    ) : (
      <span className={styles.trendNegative}>▲ Higher</span>
    )
  }
  if (key === "uptime") {
    return <span className={styles.trendPositive}>● Excellent</span>
  }
  if (key === "services") {
    const up = metrics.servicesUp || 0
    const total = metrics.servicesTotal || 0
    return up === total ? (
      <span className={styles.trendPositive}>● All healthy</span>
    ) : (
      <span className={styles.trendNegative}>⚠ {total - up} issues</span>
    )
  }
  return null
}

function SystemMetricsSkeleton() {
  return (
    <section className={styles.section} aria-labelledby="metrics-heading">
      <div className={styles.sectionHeader}>
        <div className={styles.titleGroup}>
          <h2 id="metrics-heading" className={styles.sectionTitle}>
            <span className={styles.sectionIcon} aria-hidden="true">
              <MetricsIcon width={24} height={24} />
            </span>
            System Metrics
          </h2>
          <p className={styles.sectionSubtitle}>
            Real-time performance indicators across all infrastructure
          </p>
        </div>
      </div>
      <div className={styles.grid} role="list" aria-label="System metrics loading">
        {[1, 2, 3, 4].map(i => (
          <article key={i} className={styles.skeletonCard} role="listitem">
            <div className={styles.skeletonCardInner}>
              <div className={styles.skeletonRow}>
                <div className="skeleton-icon" />
                <div className="skeleton-title" />
              </div>
              <div className="skeleton-value" />
              <div className="skeleton-trend" />
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
