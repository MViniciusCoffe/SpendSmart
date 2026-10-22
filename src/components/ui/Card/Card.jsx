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

export function CardHeader({ children, className = "", ...props }) {
  return (
    <div className={`${styles.header} ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = "", ...props }) {
  return <h3 className={`${styles.title} ${className}`}>{children}</h3>
}

export function CardDescription({ children, className = "", ...props }) {
  return <p className={`${styles.description} ${className}`}>{children}</p>
}

export function CardContent({ children, className = "", ...props }) {
  return (
    <div className={`${styles.content} ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className = "", ...props }) {
  return (
    <div className={`${styles.footer} ${className}`} {...props}>
      {children}
    </div>
  )
}
