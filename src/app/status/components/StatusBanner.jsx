"use client"

import { Badge } from "@/components/ui"
import {
  getStatusVariant,
  getStatusLabel,
  getStatusColor,
  getStatusGlow,
  statusIconMap
} from "../utils/statusConfig"
import styles from "./StatusBanner.module.css"

const statusConfig = {
  operational: {
    label: "All Systems Operational",
    description: "All systems are running normally",
    variant: "success",
    pulseColor: "var(--color-success)",
    glowColor: "rgba(0, 212, 170, 0.4)"
  },
  degraded: {
    label: "Degraded Performance",
    description: "Some systems are experiencing issues",
    variant: "warning",
    pulseColor: "var(--color-warning)",
    glowColor: "rgba(255, 179, 0, 0.4)"
  },
  critical: {
    label: "Major Outage",
    description: "Critical systems are down",
    variant: "error",
    pulseColor: "var(--color-error)",
    glowColor: "rgba(255, 71, 87, 0.4)"
  },
  error: {
    label: "Status Unavailable",
    description: "Unable to fetch system status",
    variant: "default",
    pulseColor: "var(--color-text-muted)",
    glowColor: "rgba(148, 163, 184, 0.4)"
  }
}

export function StatusBanner({ status = "operational", timestamp }) {
  const config = statusConfig[status] || statusConfig.operational
  const lastUpdated = timestamp ? new Date(timestamp).toLocaleString() : "Just now"
  const StatusIcon = statusIconMap[status] || statusIconMap.operational

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
              <StatusIcon width={24} height={24} />
              <span className={styles.pulseRing} />
              <span className={styles.glowRing} />
            </div>
            <div className={styles.textGroup}>
              <h2 className={styles.statusLabel}>{config.label}</h2>
              <p className={styles.statusDescription}>{config.description}</p>
            </div>
          </div>
          <div className={styles.statusMeta}>
            <Badge variant={config.variant} className={styles.statusBadge}>
              {getStatusLabel(status)}
            </Badge>
            <time className={styles.lastUpdated} dateTime={timestamp}>
              <ClockIcon width={14} height={14} />
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

function ClockIcon({ width = 14, height = 14, ...props }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
