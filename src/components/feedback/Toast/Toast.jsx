"use client"

import { useState, useEffect } from "react"
import styles from "./Toast.module.css"

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = ({ message, type = "info", duration = 4000, action }) => {
    const id = Date.now() + Math.random()
    const newToast = { id, message, type, duration, action }
    setToasts(prev => [...prev, { ...newToast, id }])

    if (duration !== 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, duration)
    }

    return id
  }

  const dismiss = id => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <>
      {children}
      <div className="toast-container" role="region" aria-label="Notificações" aria-live="polite">
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </>
  )
}

function Toast({ toast, onDismiss }) {
  const icons = {
    success: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="w-5 h-5"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="w-5 h-5"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    warning: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="w-5 h-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
    info: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="w-5 h-5"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12" y2="8" />
      </svg>
    )
  }

  const colors = {
    success: "bg-[var(--color-success)] text-white",
    error: "bg-[var(--color-error)] text-white",
    warning: "bg-[var(--color-warning)] text-[var(--color-bg-primary)]",
    info: "bg-[var(--color-info)] text-white"
  }

  return (
    <div
      className={`toast ${colors[toast.type] || colors.info} flex items-center gap-3 p-4 rounded-[var(--radius-card)] shadow-[var(--shadow-lg)] min-w-[300px] max-w-md animate-slideInRight`}
      role="alert"
      aria-live="polite"
    >
      <span className="flex-shrink-0" aria-hidden="true">
        {icons[toast.type] || icons.info}
      </span>
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      {toast.action && (
        <button
          onClick={toast.action.onClick}
          className="flex-shrink-0 px-3 py-1 text-sm font-medium bg-white/20 hover:bg-white/30 rounded transition-colors"
        >
          {toast.action.label}
        </button>
      )}
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 p-1 text-current opacity-50 hover:opacity-100 transition-opacity"
        aria-label="Dispensar"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="w-5 h-5"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}

export function useToast() {
  // This would be connected to context in a real implementation
  return {
    toast: () => {},
    dismiss: () => {}
  }
}

export function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null

  return (
    <div
      className="toast-container fixed bottom-4 right-4 z-[var(--z-toast)] flex flex-col gap-2 w-80 max-w-md"
      role="region"
      aria-label="Notificações"
      aria-live="polite"
    >
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}
