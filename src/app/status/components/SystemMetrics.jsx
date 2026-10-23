"use client"

import { Card } from "@/components/ui"
import { Badge } from "@/components/ui"
import styles from "./SystemMetrics.module.css"

const metricConfig = [
  { key: "apiLatency", label: "API Latency (p95)", unit: "ms", valueKey: "p95", icon: "api" },
  { key: "dbLatency", label: "Database Latency (p95)", unit: "ms", valueKey: "p95", icon: "db" },
  {
    key: "uptime",
    label: "Uptime (30d)",
    unit: "%",
    valueKey: "uptime",
    isPercentage: true,
    icon: "uptime"
  },
  {
    key: "services",
    label: "Services Operational",
    unit: "",
    valueKey: "servicesUp",
    totalKey: "servicesTotal",
    icon: "services"
  }
]

const iconMap = {
  api: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="2" />
      <path d="M16 20H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2Z" />
      <path d="M12 4v4M12 16v4M8 12h8" />
    </svg>
  ),
  db: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.7 3.5 3 9 3s9-1.3 9-3V5" />
      <path d="M3 12c0 1.7 3.5 3 9 3s9-1.3 9-3" />
    </svg>
  ),
  uptime: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  services: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  )
}

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
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </span>
            System Metrics
          </h2>
          <p className={styles.sectionSubtitle}>
            Real-time performance indicators across all infrastructure
          </p>
        </div>
        <div className={styles.lastCheck}>
          Last updated: {metrics.lastCheck ? new Date(metrics.lastCheck).toLocaleTimeString() : "—"}
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
                    style={{ color: getMetricIconColor(config.key) }}
                    aria-hidden="true"
                  >
                    {iconMap[config.icon]}
                  </span>
                  <h3 className={styles.metricTitle}>{config.label}</h3>
                </div>
                {config.key !== "services" &&
                  config.key !== "uptime" &&
                  metrics[config.key]?.status && (
                    <Badge
                      variant={
                        metrics[config.key].status === "normal"
                          ? "success"
                          : metrics[config.key].status === "warning"
                            ? "warning"
                            : "error"
                      }
                      className={styles.metricBadge}
                    >
                      {metrics[config.key].status.charAt(0).toUpperCase() +
                        metrics[config.key].status.slice(1)}
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

function getMetricIconColor(key) {
  switch (key) {
    case "apiLatency":
      return "var(--color-mercury)"
    case "dbLatency":
      return "var(--color-info)"
    case "uptime":
      return "var(--color-success)"
    case "services":
      return "var(--color-mercury-dim)"
    default:
      return "var(--color-text-muted)"
  }
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
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
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
