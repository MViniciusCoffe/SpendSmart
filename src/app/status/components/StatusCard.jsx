"use client"

import styles from "./StatusCard.module.css"

export function StatusCard({
  title,
  value,
  unit = "",
  trend,
  trendValue,
  status = "normal",
  icon,
  className = ""
}) {
  return (
    <div className={`${styles.card} ${styles[status]} ${className}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        {status !== "normal" && (
          <span className={`${styles.badge} ${styles[status]}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        )}
      </div>
      <div className={styles.valueWrapper}>
        <span className={styles.value}>
          {value}
          {unit && <span className={styles.unit}>{unit}</span>}
        </span>
        {trend !== undefined && trendValue !== undefined && (
          <span className={`${styles.trend} ${styles[trend]}`}>
            <span className={styles.trendIcon}>
              {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
            </span>
            <span className={styles.trendValue}>
              {trendValue > 0 ? "+" : ""}
              {trendValue}%
            </span>
          </span>
        )}
      </div>
    </div>
  )
}
