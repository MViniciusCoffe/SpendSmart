"use client"

import styles from "./EmptyState.module.css"

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
  illustration = true
} = {}) {
  return (
    <div className={`${styles.container} ${className}`}>
      {illustration && (
        <div className={styles.illustration} aria-hidden="true">
          {icon || (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="w-16 h-16"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
        </div>
      )}

      <div className={styles.content}>
        <h2 className={styles.title}>{title}</h2>
        {description && <p className={styles.description}>{description}</p>}

        {action && <div className={styles.action}>{action}</div>}
      </div>
    </div>
  )
}
