"use client"

import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { AuthContext, AuthProvider } from "@/contexts/AuthContext"
import { ToastContext, ToastProvider } from "@/contexts/ToastContext"

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
