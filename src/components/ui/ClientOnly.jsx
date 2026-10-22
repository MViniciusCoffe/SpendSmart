"use client"

import { useEffect, useState } from "react"

export function ClientOnly({ children, fallback = null }) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return fallback
  }

  return children
}
