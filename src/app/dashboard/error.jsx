"use client"

import { RouteError } from "@/components/feedback/RouteError/RouteError"

export default function Error({ error, reset }) {
  return (
    <RouteError
      error={error}
      reset={reset}
      title="Não foi possível carregar o dashboard"
      description="Não conseguimos carregar seu dashboard financeiro. Tente novamente."
    />
  )
}
