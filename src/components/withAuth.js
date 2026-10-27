"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { LoadingSpinner } from "@/components/feedback"
import styles from "./withAuth.module.css"

// Session comes from AuthContext, the single source of truth shared with the header
const withAuth = WrappedComponent => {
  const AuthenticatedPage = props => {
    const router = useRouter()
    const { user, loading } = useAuth()

    useEffect(() => {
      // Replace instead of push so protected pages don't pollute the history
      if (!loading && !user) router.replace("/login")
    }, [loading, user, router])

    if (loading || !user) {
      return (
        <div className={styles.loading}>
          <LoadingSpinner size="lg" ariaLabel="Verificando sessão" />
        </div>
      )
    }

    return <WrappedComponent {...props} />
  }

  // Display name for easier debugging
  const componentName = WrappedComponent.displayName || WrappedComponent.name || "Component"
  AuthenticatedPage.displayName = `withAuth(${componentName})`

  return AuthenticatedPage
}

export default withAuth
