"use client"

import { AuthProvider } from "@/contexts/AuthContext"
import { ToastProvider } from "@/contexts/ToastContext"

/**
 * @typedef {Object} ProvidersProps
 * @property {React.ReactNode} children
 */

/** @param {ProvidersProps} param0 */
export function Providers({ children }) {
  return (
    <AuthProvider>
      <ToastProvider>{children}</ToastProvider>
    </AuthProvider>
  )
}
