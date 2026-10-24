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
                <div className={styles.skeletonMetricTitle} />
                <div className={styles.skeletonMetricValue} />
                <div className={styles.skeletonMetricTrend} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.servicesSection}>
        <div className={styles.sectionSkeleton}>
          <div className={styles.skeletonSectionTitle} />
          <div className={styles.servicesGrid}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className={styles.serviceSkeleton}>
                <div className={styles.skeletonServiceTitle} />
                <div className={styles.skeletonServiceValue} />
                <div className={styles.skeletonServiceBadge} />
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
              <div key={i} className={styles.incidentSkeleton}>
                <div className={styles.skeletonMarker}>
                  <div className={styles.skeletonDot} />
                  <div className={styles.skeletonLine} />
                </div>
                <div className={styles.skeletonContent}>
                  <div className={styles.skeletonHeader}>
                    <div className={styles.skeletonIncidentTitle} />
                    <div className={styles.skeletonIncidentBadge} />
                  </div>
                  <div className={styles.skeletonTimestamp} />
                  <div className={styles.skeletonDescription} />
                  <div className={styles.skeletonAffected} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
