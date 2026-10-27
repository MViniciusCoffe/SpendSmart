"use client"

import styles from "./LoadingSpinner.module.css"

export function LoadingSpinner({ size = "md", className = "", ariaLabel = "Carregando" } = {}) {
  return (
    <div
      className={`${styles.spinner} ${styles[size]} ${className}`}
      role="status"
      aria-label={ariaLabel}
      aria-live="polite"
    >
      <svg className={styles.svg} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle
          className={styles.circle}
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
      <span className={styles.label} aria-hidden="true">
        Carregando...
      </span>
    </div>
  )
}
