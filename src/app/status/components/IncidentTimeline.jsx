"use client"

import styles from "./IncidentTimeline.module.css"

export function IncidentTimeline({ incidents }) {
  if (!incidents || incidents.length === 0) {
    return (
      <section className={styles.section} aria-labelledby="incidents-heading">
        <h2 id="incidents-heading" className={styles.sectionTitle}>
          Recent Incidents
        </h2>
        <div className={styles.empty}>
          <svg
            className={styles.emptyIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0112 5.25c-3.426 0-6.222 2.79-6.827 6.246"
            />
          </svg>
          <p>No recent incidents</p>
          <span>All systems operational</span>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.section} aria-labelledby="incidents-heading">
      <h2 id="incidents-heading" className={styles.sectionTitle}>
        Recent Incidents
      </h2>
      <div className={styles.timeline} role="list" aria-label="Incident timeline">
        {incidents.map((incident, index) => (
          <article key={incident.id} className={styles.item} role="listitem">
            <div className={styles.marker}>
              <span className={`${styles.dot} ${styles[incident.severity]}`} aria-hidden="true" />
              {index < incidents.length - 1 && <span className={styles.line} aria-hidden="true" />}
            </div>
            <div className={styles.content}>
              <div className={styles.header}>
                <h3 className={styles.title}>{incident.title}</h3>
                <span className={`${styles.severity} ${styles[incident.severity]}`}>
                  {incident.severity}
                </span>
              </div>
              <time className={styles.timestamp} dateTime={incident.timestamp}>
                {new Date(incident.timestamp).toLocaleString()}
              </time>
              <p className={styles.description}>{incident.description}</p>
              {incident.affectedServices && incident.affectedServices.length > 0 && (
                <div className={styles.affected}>
                  <span className={styles.affectedLabel}>Affected:</span>
                  <ul className={styles.affectedList}>
                    {incident.affectedServices.map(svc => (
                      <li key={svc} className={styles.affectedItem}>
                        {svc}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
