"use client"

import styles from "./LoadingSpinner.module.css"

export function LoadingSpinner({ size = "md", className = "", ariaLabel = "Loading" } = {}) {
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
        Loading...
      </span>
    </div>
  )
}

export function LoadingOverlay({ children, isLoading, className = "" } = {}) {
  return (
    <div className={`${styles.overlay} ${className}`}>
      {children}
      {isLoading && (
        <div
          className={styles.overlayContent}
          role="status"
          aria-live="polite"
          aria-label="Loading"
        >
          <div className={styles.spinner} />
          <span className={styles.overlayLabel}>Loading...</span>
        </div>
      )}
    </div>
  )
}

export function LoadingSkeleton({ variant = "text", width = "100%", height, className = "" } = {}) {
  const baseStyles = {
    background:
      "linear-gradient(90deg, var(--color-bg-tertiary) 25%, var(--color-border) 50%, var(--color-bg-tertiary) 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.5s infinite",
    borderRadius: "var(--radius-sm)"
  }

  const variants = {
    text: {
      height: "16px",
      width: width,
      borderRadius: "var(--radius-sm)"
    },
    card: {
      height: "200px",
      width: "100%",
      borderRadius: "var(--radius-card)"
    },
    avatar: {
      height: "48px",
      width: "48px",
      borderRadius: "50%"
    },
    button: {
      height: "40px",
      width: "120px",
      borderRadius: "var(--radius-button)"
    },
    card: {
      height: "200px",
      width: "100%",
      borderRadius: "var(--radius-card)"
    }
  }

  const style = {
    ...baseStyles,
    ...variants[variant],
    width,
    height: height || variants[variant]?.height,
    borderRadius: variants[variant]?.borderRadius || "var(--radius-sm)"
  }

  return <div className={`${styles.skeleton} ${className}`} style={style} aria-hidden="true" />
}
