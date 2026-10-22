"use client"

import { StatusCard } from "./StatusCard"
import styles from "./ServiceGrid.module.css"

function getStatusVariant(status) {
  if (status === "operational") return "normal"
  if (status === "degraded") return "warning"
  return "critical"
}

function getStatusLabel(status) {
  return status === "operational" ? "Operational" : status
}

export function ServiceGrid({ services }) {
  if (!services || services.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No services to display</p>
      </div>
    )
  }

  return (
    <section className={styles.section} aria-labelledby="services-heading">
      <h2 id="services-heading" className={styles.sectionTitle}>
        Services
      </h2>
      <div className={styles.grid} role="list" aria-label="Services">
        {services.map(service => (
          <article key={service.id} className={styles.cardWrapper} role="listitem">
            <StatusCard
              title={service.name}
              value={getStatusLabel(service.status)}
              status={getStatusVariant(service.status)}
              icon={service.icon}
              trend={service.latencyTrend}
              trendValue={service.latencyChange}
            />
          </article>
        ))}
      </div>
    </section>
  )
}
