import Link from "next/link"
import { siteConfig } from "@/lib/config/siteConfig"
import styles from "./AuthShell.module.css"

// Centered card shared by the login and register pages
export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <main className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />
      <section className={styles.card} aria-labelledby="auth-title">
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">
            S
          </span>
          {siteConfig.name}
        </Link>
        <header className={styles.header}>
          <h1 id="auth-title" className={styles.title}>
            {title}
          </h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </header>
        {children}
        {footer && <footer className={styles.footer}>{footer}</footer>}
      </section>
    </main>
  )
}

export function AuthError({ children }) {
  if (!children) return null
  return (
    <div className={styles.error} role="alert">
      {children}
    </div>
  )
}

export function AuthField({ children, hint }) {
  return (
    <div className={styles.field}>
      {children}
      {hint && <span className={styles.hint}>{hint}</span>}
    </div>
  )
}

export function AuthForm({ onSubmit, children }) {
  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      {children}
    </form>
  )
}

export function AuthRow({ children }) {
  return <div className={styles.row}>{children}</div>
}
