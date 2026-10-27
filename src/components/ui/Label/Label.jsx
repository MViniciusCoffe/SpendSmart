"use client"

import styles from "./Label.module.css"

export function Label({ htmlFor, children, required, className = "", ...props }) {
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
