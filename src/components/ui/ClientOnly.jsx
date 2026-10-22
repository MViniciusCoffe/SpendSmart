"use client"

import { useEffect, useState } from "react"

export function ClientOnly({ children, fallback = null }) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true)
  }, [])

  if (!isClient) {
    return fallback
  }

  return children
}
