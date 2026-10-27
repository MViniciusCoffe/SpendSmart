"use client"

import { Button } from "@/components/ui"
import styles from "./error.module.css"

export default function Error({ error, reset }) {
  return (
    <div className={styles.container} role="alert">
      <div className={styles.errorIcon} aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <h1 className={styles.title}>Não foi possível carregar o status</h1>
      <p className={styles.description}>
        Não conseguimos carregar a página de status do sistema. Pode ser um problema temporário.
      </p>

      {process.env.NODE_ENV === "development" && error?.message && (
        <pre className={styles.errorDetails}>{error.message}</pre>
      )}

      <div className={styles.actions}>
        <Button variant="primary" fullWidth onClick={() => reset()}>
          Tentar novamente
        </Button>
        <Button variant="secondary" fullWidth onClick={() => window.location.reload()}>
          Recarregar página
        </Button>
      </div>

      <p className={styles.helpText}>
        Se o problema persistir, entre em contato com o suporte ou consulte nossa página de status
        em{" "}
        <a href="/status" target="_blank" rel="noopener noreferrer">
          status.spendsmart.app
        </a>
      </p>
    </div>
  )
}
