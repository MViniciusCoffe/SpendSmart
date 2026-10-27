"use client"

import { RouteError } from "@/components/feedback/RouteError/RouteError"

export default function Error({ error, reset }) {
  return (
    <RouteError
      error={error}
      reset={reset}
      title="Não foi possível carregar as configurações"
      description="Não conseguimos carregar as configurações da sua conta. Tente novamente."
    />
  )
}
