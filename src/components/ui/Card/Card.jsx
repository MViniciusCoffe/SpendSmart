"use client"

import styles from "./Card.module.css"

export function Card({
  children,
  variant = "default",
  padding = "md",
  hover = false,
  className = "",
  onClick,
  ...props
}) {
  const classNames = [
    styles.card,
    styles[variant],
    styles[`padding-${padding}`],
    hover && styles.hover,
    className
  ]
    .filter(Boolean)
    .join(" ")

  const Component = onClick ? "button" : "div"

  return (
    <Component
      className={`${styles.card} ${styles[variant]} ${styles[`padding-${padding}`]} ${hover && styles.hover} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </Component>
  )
}
