"use client"

import { Card } from "@/components/ui"
import { Badge } from "@/components/ui"
import { Divider } from "@/components/ui"
import styles from "./IncidentTimeline.module.css"

const severityConfig = {
  critical: {
    variant: "error",
    label: "Major Outage",
    dotColor: "var(--color-error)",
    bg: "rgba(255, 71, 87, 0.1)",
    border: "rgba(255, 71, 87, 0.2)"
  },
  major: {
    variant: "warning",
    label: "Partial Outage",
    dotColor: "var(--color-warning)",
    bg: "rgba(255, 179, 0, 0.1)",
    border: "rgba(255, 179, 0, 0.2)"
  },
  minor: {
    variant: "info",
    label: "Minor Issue",
    dotColor: "var(--color-info)",
    bg: "rgba(0, 180, 255, 0.1)",
    border: "rgba(0, 180, 255, 0.2)"
  },
  degraded: {
    variant: "warning",
    label: "Degraded",
    dotColor: "var(--color-warning)",
    bg: "rgba(255, 179, 0, 0.1)",
    border: "rgba(255, 179, 0, 0.2)"
  },
  maintenance: {
    variant: "default",
    label: "Maintenance",
    dotColor: "var(--color-text-muted)",
    bg: "var(--color-bg-tertiary)",
    border: "var(--color-border)"
  },
  resolved: {
    variant: "success",
    label: "Resolved",
    dotColor: "var(--color-success)",
    bg: "rgba(0, 212, 170, 0.1)",
    border: "rgba(0, 212, 170, 0.2)"
  }
}

export function IncidentTimeline({ incidents }) {
  if (!incidents || incidents.length === 0) {
    return (
      <section className={styles.section} aria-labelledby="incidents-heading">
        <h2 id="incidents-heading" className={styles.sectionTitle}>
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
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </span>
          Incident History
        </h2>
        <Card variant="default" className={styles.emptyCard}>
          <div className={styles.emptyContent}>
            <div className={styles.emptyIconWrapper}>
              <svg
                className={styles.emptyIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0112 5.25c-3.426 0-6.222 2.79-6.827 6.246"
                />
              </svg>
            </div>
            <h3 className={styles.emptyTitle}>No incidents reported</h3>
            <p className={styles.emptyDescription}>All systems have been operating normally</p>
            <div className={styles.emptySubtext}>
              <span className={styles.emptyCheck} aria-hidden="true">
                ✓
              </span>
              <span>No incidents in the last 90 days</span>
            </div>
          </div>
        </Card>
      </section>
    )
  }

  return (
    <section className={styles.section} aria-labelledby="incidents-heading">
      <h2 id="incidents-heading" className={styles.sectionTitle}>
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
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </span>
        Incident History
      </h2>
      <div className={styles.timeline} role="list" aria-label="Incident timeline">
        {incidents.map((incident, index) => {
          const config = severityConfig[incident.severity] || severityConfig.minor
          const isResolved = incident.resolved || incident.severity === "resolved"

          return (
            <article
              key={incident.id}
              className={styles.item}
              role="listitem"
              style={{
                "--incident-color": config.dotColor,
                "--incident-bg": config.bg,
                "--incident-border": config.border
              }}
            >
              <div className={styles.markerColumn}>
                <span
                  className={`${styles.dot} ${isResolved ? styles.resolved : ""}`}
                  style={{
                    backgroundColor: config.dotColor,
                    borderColor: config.dotColor,
                    boxShadow: `0 0 0 3px var(--color-bg-primary), 0 0 0 5px ${config.dotColor}33`
                  }}
                  aria-hidden="true"
                />
                {index < incidents.length - 1 && (
                  <span
                    className={styles.line}
                    style={{ background: "var(--color-border)" }}
                    aria-hidden="true"
                  />
                )}
              </div>
              <Card variant="bordered" className={styles.incidentCard}>
                <div className={styles.incidentContent}>
                  <div className={styles.header}>
                    <h3 className={styles.title}>{incident.title}</h3>
                    <div className={styles.headerMeta}>
                      <Badge variant={config.variant} className={styles.severityBadge}>
                        {config.label}
                      </Badge>
                      <time className={styles.timestamp} dateTime={incident.timestamp}>
                        {formatDate(incident.timestamp)}
                      </time>
                    </div>
                  </div>
                  <p className={styles.description}>{incident.description}</p>
                  {incident.affectedServices && incident.affectedServices.length > 0 && (
                    <div className={styles.affected}>
                      <span className={styles.affectedLabel}>Affected</span>
                      <ul className={styles.affectedList}>
                        {incident.affectedServices.map(svc => (
                          <li key={svc} className={styles.affectedItem}>
                            {svc}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {incident.resolvedAt && (
                    <div className={styles.resolved}>
                      <span className={styles.resolvedLabel}>Resolved</span>
                      <time className={styles.resolvedTime} dateTime={incident.resolvedAt}>
                        {formatDate(incident.resolvedAt)}
                      </time>
                      <span className={styles.resolvedDuration}>
                        ({getDuration(incident.timestamp, incident.resolvedAt)})
                      </span>
                    </div>
                  )}
                </div>
                {index < incidents.length - 1 && <Divider className={styles.divider} />}
              </Card>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function formatDate(isoString) {
  const date = new Date(isoString)
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short"
  })
}

function getDuration(start, end) {
  const diffMs = new Date(end) - new Date(start)
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`
  if (diffHours > 0) return `${diffHours}h ${diffMins % 60}m`
  return `${diffMins}m`
}
