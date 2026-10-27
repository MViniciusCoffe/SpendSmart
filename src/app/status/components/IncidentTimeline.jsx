"use client"

import { Card } from "@/components/ui"
import { Badge } from "@/components/ui"
import { Divider } from "@/components/ui"
import { getSeverityConfig } from "../utils/statusConfig"
import { IncidentIcon, SuccessEmptyIcon } from "../utils/icons"
import styles from "./IncidentTimeline.module.css"

export function IncidentTimeline({ incidents }) {
  if (!incidents || incidents.length === 0) {
    return (
      <section className={styles.incidentsSection} aria-labelledby="incidents-heading">
        <h2 id="incidents-heading" className={styles.sectionTitle}>
          <span className={styles.incidentsIcon} aria-hidden="true">
            <IncidentIcon width={24} height={24} />
          </span>
          Histórico de Incidentes
        </h2>
        <Card variant="default" className={styles.emptyCard}>
          <div className={styles.emptyContent}>
            <div className={styles.emptyIconWrapper}>
              <SuccessEmptyIcon className={styles.emptyIcon} />
            </div>
            <h3 className={styles.emptyTitle}>Nenhum incidente registrado</h3>
            <p className={styles.emptyDescription}>Todos os sistemas estão operando normalmente</p>
            <div className={styles.emptySubtext}>
              <span className={styles.emptyCheck} aria-hidden="true">
                ✓
              </span>
              <span>Nenhum incidente nos últimos 90 dias</span>
            </div>
          </div>
        </Card>
      </section>
    )
  }

  return (
    <section className={styles.incidentsSection} aria-labelledby="incidents-heading">
      <h2 id="incidents-heading" className={styles.sectionTitle}>
        <span className={styles.incidentsIcon} aria-hidden="true">
          <IncidentIcon width={24} height={24} />
        </span>
        Histórico de Incidentes
      </h2>
      <div className={styles.timeline} role="list" aria-label="Linha do tempo de incidentes">
        {incidents.map((incident, index) => {
          const config = getSeverityConfig(incident.severity)
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
                  <span className={`${styles.line} ${styles.timeline_line}`} aria-hidden="true" />
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
