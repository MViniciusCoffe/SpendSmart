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
export function StatusBadge({ status, className = "", ...props }) {
  const variants = {
    operational: "success",
    degraded: "warning",
    partial: "warning",
    critical: "error",
    maintenance: "info",
    pending: "warning",
    unknown: "default"
  }

  const variant = variants[status] || "default"
  const label = status?.charAt(0).toUpperCase() + status?.slice(1) || "Desconhecido"

  return (
    <Badge variant={variant} size="sm" className={className}>
      {label}
    </Badge>
  )
}

export function CountBadge({ count, max = 99, className = "", ...props }) {
  const displayCount = count > max ? `${max}+` : count

  return (
    <span className={`${styles.badge} ${styles.count} ${className}`} {...props}>
      {displayCount}
    </span>
  )
}
