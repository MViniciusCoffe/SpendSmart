"use client"

import styles from "./Divider.module.css"

export function Divider({ label, vertical = false, className = "", ...props }) {
  if (vertical) {
    return (
      <div className={`${styles.root} ${styles.vertical} ${className}`} role="separator" {...props}>
        <div className={styles.line} />
      </div>
    )
  }

  return (
    <div className={`${styles.root} ${className}`} role="separator" {...props}>
      <hr className={styles.line} aria-hidden="true" />
      {label && <span className={styles.label}>{label}</span>}
      <hr className={styles.line} aria-hidden="true" />
    </div>
  )
}
