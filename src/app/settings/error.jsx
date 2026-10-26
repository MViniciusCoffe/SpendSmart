"use client"

import { RouteError } from "@/components/feedback/RouteError/RouteError"

export default function Error({ error, reset }) {
  return (
    <RouteError
      error={error}
      reset={reset}
      title="Unable to load settings"
      description="We couldn't load your account settings. Please try again."
    />
  )
}
