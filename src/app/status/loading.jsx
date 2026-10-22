/**
 * Status Page Loading UI
 * Shown immediately during navigation and while data loads
 */

import styles from "./loading.module.css"

export default function Loading() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerSkeleton}>
          <div className={styles.skeletonTitle} />
          <div className={styles.skeletonSubtitle} />
        </div>
        <div className={styles.skeletonBadge} />
      </div>

      <div className={styles.metricsSection}>
        <div className={styles.sectionSkeleton}>
          <div className={styles.skeletonSectionTitle} />
          <div className={styles.metricsGrid}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className={styles.metricSkeleton}>
                <div className="skeleton-title" />
                <div className="skeleton-value" />
                <div className="skeleton-trend" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.servicesSection}>
        <div className={styles.sectionSkeleton}>
          <div className={styles.skeletonSectionTitle} />
          <div className={styles.servicesGrid}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => (
              <div key={i} className="service-skeleton">
                <div className="skeleton-title" />
                <div className="skeleton-value" />
                <div className="skeleton-badge" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.incidentsSection}>
        <div className={styles.sectionSkeleton}>
          <div className={styles.skeletonSectionTitle} />
          <div className={styles.incidentsList}>
            {[1, 2, 3].map(i => (
              <div key={i} className="incident-skeleton">
                <div className="skeleton-marker">
                  <div className="skeleton-dot" />
                  <div className="skeleton-line" />
                </div>
                <div className="skeleton-content">
                  <div className="skeleton-header">
                    <div className="skeleton-title" />
                    <div className="skeleton-badge" />
                  </div>
                  <div className="skeleton-timestamp" />
                  <div className="skeleton-description" />
                  <div className="skeleton-affected" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
