"use client"

import { Badge } from "@/components/ui"
import {
  getStatusVariant,
  getStatusLabel,
  getStatusColor,
  getStatusGlow,
  getStatusMessage,
  getStatusTitle
} from "../utils/statusConfig"
import { ClockIcon, statusIconMap } from "../utils/icons"
import styles from "./StatusBanner.module.css"

export function StatusBanner({ status = "operational", timestamp }) {
  const normalizedStatus = statusIconMap[status] ? status : "operational"
  const config = {
    label: getStatusTitle(normalizedStatus),
    description: getStatusMessage(normalizedStatus),
    variant: getStatusVariant(normalizedStatus),
    pulseColor: getStatusColor(normalizedStatus),
    glowColor: getStatusGlow(normalizedStatus)
  }
  const lastUpdated = timestamp ? new Date(timestamp).toLocaleString() : "Just now"
  const StatusIcon = statusIconMap[normalizedStatus]

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
              <span className={styles.statusKicker}>CURRENT SIGNAL</span>
              <h2 className={styles.statusLabel}>{config.label}</h2>
              <p className={styles.statusDescription}>{config.description}</p>
            </div>
          </div>
          <div className={styles.statusMeta}>
            <Badge variant={config.variant} className={styles.statusBadge}>
              {getStatusLabel(normalizedStatus)}
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
