"use client"

import styles from "./Spinner.module.css"

export function Spinner({ size = "md", className = "", ariaLabel = "Loading", ...props }) {
  return (
    <svg
      className={`${styles.spinner} ${styles[size]} ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label={ariaLabel}
      aria-live="polite"
      {...props}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="31.4 31.4"
        style={{ animation: "spin 1s linear infinite" }}
      />
    </svg>
  )
}
