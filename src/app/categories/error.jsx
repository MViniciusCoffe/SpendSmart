"use client"

import { RouteError } from "@/components/feedback/RouteError/RouteError"

export default function Error({ error, reset }) {
  return (
    <RouteError
      error={error}
      reset={reset}
      title="Não foi possível carregar as categorias"
      description="Não conseguimos carregar suas categorias. Tente novamente."
    />
  )
}
