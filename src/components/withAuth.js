"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authService } from "../services/authServices.js"

const withAuth = WrappedComponent => {
  const AuthenticatedPage = props => {
    const router = useRouter()
    const [isAuthorized, setIsAuthorized] = useState(false)

    useEffect(() => {
      const checkAuth = async () => {
        try {
          const session = await authService.getSession()

          if (!session) {
            // Replace instead of push so protected pages don't pollute the history
            router.replace("/login")
          } else {
            setIsAuthorized(true)
          }
        } catch (error) {
          router.replace("/login")
        }
      }

      checkAuth()
    }, [router])

    if (!isAuthorized) {
      return null // TODO: loading component
    }

    return <WrappedComponent {...props} />
  }

  // Display name for easier debugging
  const componentName = WrappedComponent.displayName || WrappedComponent.name || "Component"
  AuthenticatedPage.displayName = `withAuth(${componentName})`

  return AuthenticatedPage
}

export default withAuth
