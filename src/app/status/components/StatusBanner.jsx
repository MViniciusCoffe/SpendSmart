"use client"

import { Badge } from "@/components/ui"
import styles from "./StatusBanner.module.css"

const statusConfig = {
  operational: {
    label: "All Systems Operational",
    description: "All systems are running normally",
    variant: "success",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    pulseColor: "var(--color-success)",
    glowColor: "rgba(0, 212, 170, 0.4)"
  },
  degraded: {
    label: "Degraded Performance",
    description: "Some systems are experiencing issues",
    variant: "warning",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    pulseColor: "var(--color-warning)",
    glowColor: "rgba(255, 179, 0, 0.4)"
  },
  critical: {
    label: "Major Outage",
    description: "Critical systems are down",
    variant: "error",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    pulseColor: "var(--color-error)",
    glowColor: "rgba(255, 71, 87, 0.4)"
  },
  error: {
    label: "Status Unavailable",
    description: "Unable to fetch system status",
    variant: "default",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    pulseColor: "var(--color-text-muted)",
    glowColor: "rgba(148, 163, 184, 0.4)"
  }
}

export function StatusBanner({ status = "operational", timestamp }) {
  const config = statusConfig[status] || statusConfig.operational
  const lastUpdated = timestamp ? new Date(timestamp).toLocaleString() : "Just now"

  return (
    <section className={styles.banner} aria-live="polite" role="status">
      <div className={styles.container}>
        <div className={styles.statusRow}>
          <div className={styles.statusMain}>
            <div
              className={`${styles.icon} ${styles[config.variant]}`}
              style={{ "--pulse-color": config.pulseColor, "--glow-color": config.glowColor }}
              aria-hidden="true"
            >
              {config.icon}
              <span className={styles.pulseRing} />
              <span className={styles.glowRing} />
            </div>
            <div className={styles.textGroup}>
              <span className={styles.statusKicker}>CURRENT SIGNAL</span>
              <h2 className={styles.statusLabel}>{config.label}</h2>
              <p className={styles.statusDescription}>{config.description}</p>
            </div>
          </div>
          <div className={styles.statusMeta}>
            <Badge variant={config.variant} className={styles.statusBadge}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
            <time className={styles.lastUpdated} dateTime={timestamp}>
              <svg
                width="14"
                height="14"
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
              Last updated: {lastUpdated}
            </time>
          </div>
        </div>
        <div className={styles.centerLine} aria-hidden="true">
          <div
            className={styles.centerLineFill}
            style={{ "--progress-color": config.pulseColor }}
          />
        </div>
      </div>
    </section>
  )
}
