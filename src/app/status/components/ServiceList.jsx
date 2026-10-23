"use client"

import { Card } from "@/components/ui"
import { Badge } from "@/components/ui"
import styles from "./ServiceList.module.css"

const statusVariantMap = {
  operational: "success",
  degraded: "warning",
  critical: "error"
}

const statusLabelMap = {
  operational: "Operational",
  degraded: "Degraded",
  critical: "Critical"
}

const statusDescriptions = {
  operational: "All systems operational",
  degraded: "Performance degraded",
  critical: "Major outage"
}

export function ServiceList({ services }) {
  if (!services || services.length === 0) {
    return (
      <section className={styles.section} aria-labelledby="services-heading">
        <h2 id="services-heading" className={styles.sectionTitle}>
          <span className={styles.sectionIcon} aria-hidden="true">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="6" rx="2" />
              <rect x="3" y="14" width="18" height="6" rx="2" />
              <path d="M7 7h.01M7 17h.01" />
            </svg>
          </span>
          Services
        </h2>
        <Card variant="default" className={styles.emptyCard}>
          <p className={styles.emptyText}>No services to display</p>
        </Card>
      </section>
    )
  }

  return (
    <section className={styles.section} aria-labelledby="services-heading">
      <h2 id="services-heading" className={styles.sectionTitle}>
        <span className={styles.sectionIcon} aria-hidden="true">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="6" rx="2" />
            <rect x="3" y="14" width="18" height="6" rx="2" />
            <path d="M7 7h.01M7 17h.01" />
          </svg>
        </span>
        Services
      </h2>
      <div className={styles.grid} role="list" aria-label="Services">
        {services.map((service, index) => (
          <article
            key={service.id}
            className={styles.serviceCard}
            role="listitem"
            data-status={service.status}
            style={{ "--status-color": getStatusColor(service.status) }}
          >
            <div className={styles.serviceMain}>
              <div className={styles.serviceInfo}>
                <h3 className={styles.serviceName}>{service.name}</h3>
                <p className={styles.serviceDescription}>{service.description}</p>
              </div>
              <Badge
                variant={statusVariantMap[service.status] || "default"}
                className={styles.serviceBadge}
              >
                {statusLabelMap[service.status] || service.status}
              </Badge>
            </div>
            {service.latency !== undefined && service.latency !== null && (
              <div className={styles.serviceMeta}>
                <span className={styles.latency}>
                  <span className={styles.latencyIcon} aria-hidden="true">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                  </span>
                  <span className="latencyValue">{service.latency}</span>
                  <span className="latencyUnit">ms</span>
                </span>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

function getStatusColor(status) {
  switch (status) {
    case "operational":
      return "var(--color-success)"
    case "degraded":
      return "var(--color-warning)"
    case "critical":
      return "var(--color-error)"
    default:
      return "var(--color-border)"
  }
}
