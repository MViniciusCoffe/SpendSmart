"use client"

import { Card } from "@/components/ui"
import { Badge } from "@/components/ui"
import {
  getStatusVariant,
  getStatusLabel,
  getStatusColor,
  getStatusDescription
} from "../utils/statusConfig"
import { LatencyIcon, ServicesListIcon, serviceIconMap } from "../utils/icons"
import styles from "./ServiceList.module.css"
import sharedStyles from "./StatusShared.module.css"

export function ServiceList({ services }) {
  if (!services || services.length === 0) {
    return (
      <section
        className={`${sharedStyles.section} ${styles.servicesSection}`}
        aria-labelledby="services-heading"
      >
        <h2 id="services-heading" className={sharedStyles.sectionTitle}>
          <span className={`${sharedStyles.sectionIcon} ${styles.servicesIcon}`} aria-hidden="true">
            <ServicesListIcon width={20} height={20} />
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
    <section
      className={`${sharedStyles.section} ${styles.servicesSection}`}
      aria-labelledby="services-heading"
    >
      <h2 id="services-heading" className={sharedStyles.sectionTitle}>
        <span className={`${sharedStyles.sectionIcon} ${styles.servicesIcon}`} aria-hidden="true">
          <ServicesListIcon width={20} height={20} />
        </span>
        Services
      </h2>
      <div className={styles.grid} role="list" aria-label="Services">
        {services.map(service => {
          const ServiceIcon = serviceIconMap[service.id]
          const statusColor = getStatusColor(service.status)
          return (
            <article
              key={service.id}
              className={styles.serviceCard}
              role="listitem"
              data-status={service.status}
              style={{ "--status-color": statusColor }}
            >
              <div className={styles.serviceMain}>
                <div className={styles.serviceInfo}>
                  {ServiceIcon && (
                    <span className={styles.serviceIcon} aria-hidden="true">
                      <ServiceIcon width={18} height={18} />
                    </span>
                  )}
                  <div className={styles.serviceText}>
                    <h3 className={styles.serviceName}>{service.name}</h3>
                    <p className={styles.serviceDescription}>
                      {service.description || getStatusDescription(service.status)}
                    </p>
                  </div>
                </div>
                <Badge variant={getStatusVariant(service.status)} className={styles.serviceBadge}>
                  {getStatusLabel(service.status)}
                </Badge>
              </div>
              {service.latency !== undefined && service.latency !== null && (
                <div className={styles.serviceMeta}>
                  <span className={styles.latency}>
                    <span className={styles.latencyIcon} aria-hidden="true">
                      <LatencyIcon width={14} height={14} />
                    </span>
                    <span className={styles.latencyValue}>{service.latency}</span>
                    <span className={styles.latencyUnit}>ms</span>
                  </span>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
