import { createClient } from "@supabase/supabase-js"

/**
 * Cliente admin do Supabase (service_role, ignora RLS). Único lugar que lê a
 * SUPABASE_SERVICE_ROLE_KEY; a pasta _lib é privada no App Router (não vira rota).
 *
 * É criado na requisição, não no carregamento do módulo: com createClient no topo do arquivo, o
 * `next build` importava as rotas e falhava com "supabaseKey is required" em qualquer ambiente sem a
 * chave (Preview, 2026-11-04). Sem a chave, devolve null e cada rota decide a resposta.
 *
 * @param {import('@supabase/supabase-js').SupabaseClientOptions<"public">} [options]
 * @returns {import('@supabase/supabase-js').SupabaseClient | null}
 */
export function getSupabaseAdmin(options = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null

  return createClient(url, key, { ...options, auth: { persistSession: false, ...options.auth } })
}

/** Resposta das rotas privilegiadas quando o servidor está sem a chave de serviço. */
export function adminUnavailableResponse() {
  return Response.json({ message: "Serviço temporariamente indisponível." }, { status: 503 })
}
