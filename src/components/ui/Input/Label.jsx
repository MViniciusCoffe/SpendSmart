"use client"

import styles from "./Input.module.css"

export function Label({ children, htmlFor, required = false, className = "", ...props }) {
  return (
    <label htmlFor={htmlFor} className={`${styles.label} ${className}`} {...props}>
      {children}
      {required && (
        <span className={styles.required} aria-hidden="true">
          *
        </span>
      )}
    </label>
  )
}
