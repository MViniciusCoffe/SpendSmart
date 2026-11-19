import { createClient } from "@supabase/supabase-js"

/**
 * Checagens de saúde do Supabase, usadas pelo /api/status (página de status) e pelo /health
 * (prontidão, alvo do smoke test pós-deploy). Ficam num módulo só para as duas rotas não
 * divergirem sobre o que é "banco no ar" ou "Auth no ar".
 *
 * Só usa a chave pública: as duas rotas são abertas, sem login, e com o cliente admin (service_role,
 * ignora RLS) qualquer descuido futuro (logar um resultado, devolver um erro) viraria vazamento. O
 * banco é checado pela RPC health_check() (20261106150417_add_health_check.sql), que não lê linha
 * nenhuma, e o Auth pelo endpoint público /auth/v1/health.
 *
 * Cada checagem devolve { status, latency }, com status "operational", "degraded" ou "critical"
 * (o vocabulário da página de status); quem chama decide como apresentar.
 */

// Each check gives up after this long, so an unreachable project shows up as "critical"
// instead of hanging until the serverless function times out (504). A per-request timeout
// alone is not enough: supabase-js retries failed requests, multiplying the wait.
export const CHECK_TIMEOUT_MS = 3000

export const fetchWithTimeout = (url, options = {}) =>
  fetch(url, { ...options, signal: options.signal ?? AbortSignal.timeout(CHECK_TIMEOUT_MS) })

export function withDeadline(promise, ms = CHECK_TIMEOUT_MS) {
  let timer
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
  })
  return Promise.race([promise, deadline]).finally(() => clearTimeout(timer))
}

export function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  return url && key ? { url, key } : null
}

export function getPublicClient(config) {
  if (!config) return null
  return createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: fetchWithTimeout }
  })
}

export async function checkDatabase(client) {
  if (!client) return { status: "critical", latency: 0 }
  const start = Date.now()
  try {
    const { data, error } = await withDeadline(client.rpc("health_check"))
    const status = !error && data === true ? "operational" : "critical"
    return { status, latency: Date.now() - start }
  } catch {
    return { status: "critical", latency: Date.now() - start }
  }
}

export async function checkAuth(config) {
  if (!config) return { status: "critical", latency: 0 }
  const start = Date.now()
  try {
    const response = await fetchWithTimeout(`${config.url}/auth/v1/health`, {
      headers: { apikey: config.key },
      cache: "no-store"
    })
    return { status: response.ok ? "operational" : "degraded", latency: Date.now() - start }
  } catch {
    return { status: "critical", latency: Date.now() - start }
  }
}
