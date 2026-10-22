"use client"

import styles from "./PageContainer.module.css"

export function PageContainer({
  children,
  className = "",
  maxWidth = "xl",
  padding = "md",
  ...props
}) {
  const classNames = [
    styles.container,
    styles[`maxWidth-${maxWidth}`],
    styles[`padding-${padding}`],
    className
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <main className={classNames} role="main" {...props}>
      {children}
    </main>
  )
}

export function PageHeader({ title, description, action, className = "", ...props }) {
  const headerContent = (
    <>
      <div>
        <h1 className={styles.title}>{title}</h1>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {action && <div className={styles.actions}>{action}</div>}
    </>
  )

  return (
    <header className={styles.pageHeader} {...props}>
      <div className={styles.headerContent}>{headerContent}</div>
    </header>
  )
}
