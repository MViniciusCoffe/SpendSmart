import styles from "./loading.module.css"

export default function Loading() {
  return <StatusPageSkeleton />
}

export function StatusPageSkeleton() {
  return (
    <div className={styles.container} aria-busy="true" aria-label="Loading system status">
      <header className={styles.masthead}>
        <div className={styles.mastheadCopy}>
          <div className={styles.skeletonEyebrow} />
          <div className={styles.skeletonTitle} />
          <div className={styles.skeletonSubtitle} />
        </div>
        <div className={styles.skeletonDashboardLink} />
      </header>

      <section className={styles.statusBanner}>
        <div className={styles.statusMain}>
          <div className={styles.statusIcon} />
          <div className={styles.statusCopy}>
            <div className={styles.skeletonKicker} />
            <div className={styles.skeletonStatusTitle} />
            <div className={styles.skeletonStatusDescription} />
          </div>
        </div>
        <div className={styles.statusMeta}>
          <div className={styles.skeletonStatusBadge} />
          <div className={styles.skeletonTimestamp} />
        </div>
        <div className={styles.statusLine} />
      </section>

      <section className={styles.metricsSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle} />
          <div className={styles.sectionActions}>
            <div className={styles.skeletonAction} />
            <div className={styles.skeletonActionWide} />
          </div>
        </div>
        <div className={styles.metricsGrid}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={styles.metricSkeleton}>
              <div className={styles.metricTop}>
                <div className={styles.skeletonMetricIcon} />
                <div className={styles.skeletonMetricTitle} />
                <div className={styles.skeletonMetricBadge} />
              </div>
              <div className={styles.skeletonMetricValue} />
              <div className={styles.skeletonMetricTrend} />
            </div>
          ))}
        </div>
      </section>

      <div className={styles.lowerGrid}>
        <section className={styles.lowerSection}>
          <div className={styles.lowerSectionHeader}>
            <div className={styles.sectionTitle} />
          </div>
          <div className={styles.servicesList}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className={styles.serviceSkeleton}>
                <div className={styles.serviceInfo}>
                  <div className={styles.skeletonServiceIcon} />
                  <div className={styles.serviceText}>
                    <div className={styles.skeletonServiceTitle} />
                    <div className={styles.skeletonServiceDescription} />
                  </div>
                </div>
                <div className={styles.serviceMeta}>
                  <div className={styles.skeletonServiceBadge} />
                  <div className={styles.skeletonLatency} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.lowerSection}>
          <div className={styles.lowerSectionHeader}>
            <div className={styles.sectionTitle} />
          </div>
          <div className={styles.incidentSkeleton}>
            <div className={styles.skeletonEmptyIcon} />
            <div className={styles.skeletonIncidentTitle} />
            <div className={styles.skeletonIncidentDescription} />
            <div className={styles.skeletonIncidentBadge} />
          </div>
        </section>
      </div>
    </div>
  )
}
