"use client"

import { createContext, useContext, useState, useCallback, useMemo } from "react"
import { ToastContainer } from "@/components/feedback/Toast/Toast"

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, options = {}) => {
    const id = Date.now() + Math.random()
    const newToast = {
      id,
      message,
      type: options.type || "info",
      duration: options.duration ?? 4000,
      action: options.action
    }

    setToasts(prev => [...prev, newToast])

    if (newToast.duration !== 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, newToast.duration)
    }

    return id
  }, [])

  const dismiss = useCallback(id => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // Shortcuts must keep the same identity across renders: pages use them as effect
  // dependencies, and a new function on every toast made failed loads retry in a loop
  const shortcuts = useMemo(
    () => ({
      success: (msg, opts) => toast(msg, { ...opts, type: "success" }),
      error: (msg, opts) => toast(msg, { ...opts, type: "error" }),
      warning: (msg, opts) => toast(msg, { ...opts, type: "warning" }),
      info: (msg, opts) => toast(msg, { ...opts, type: "info" })
    }),
    [toast]
  )

  const value = useMemo(
    () => ({
      toasts,
      toast,
      dismiss,
      ...shortcuts
    }),
    [toasts, toast, dismiss, shortcuts]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}
