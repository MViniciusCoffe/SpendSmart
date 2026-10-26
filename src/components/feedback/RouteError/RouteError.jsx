"use client"

import { Button } from "@/components/ui"
import styles from "./RouteError.module.css"

export function RouteError({ error, reset, title, description }) {
  return (
    <main className={styles.container} role="alert">
      <div className={styles.icon} aria-hidden="true">
        !
      </div>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.description}>{description}</p>
      {process.env.NODE_ENV === "development" && error?.message && (
        <pre className={styles.details}>{error.message}</pre>
      )}
      <Button variant="primary" onClick={reset}>
        Try again
      </Button>
    </main>
  )
}
