"use client"

import styles from "./Badge.module.css"

export function Badge({
  children,
  variant = "default",
  size = "md",
  dot = false,
  className = "",
  ...props
}) {
  const classNames = [
    styles.badge,
    styles[variant],
    styles[size],
    dot && styles.dot,
    props.className
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <span className={classNames} {...props}>
      {dot && <span className={styles.dot} aria-hidden="true" />}
      {children}
    </span>
  )
}

// Convenience variants
