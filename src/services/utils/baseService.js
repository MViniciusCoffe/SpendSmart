import { supabase } from "@/lib/supabase"
import { logger } from "./logger"

let _sessionCache = null
let _cacheExpiry = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 min

export const obterSessao = async forceRefresh => {
  const now = Date.now()
  if (!forceRefresh && _sessionCache && now < _cacheExpiry) {
    return _sessionCache
  }

  const {
    data: { session },
    error
  } = await supabase.auth.getSession()
  if (error || !session) throw new Error("Usuário não autenticado.")

  _sessionCache = session
  _cacheExpiry = now + CACHE_TTL
  return session
}

export const clearSessionCache = () => {
  _sessionCache = null
  _cacheExpiry = 0
}

export const traduzirErroSupabase = (error, mensagens) => {
  if (error.code === "23503") throw new Error(mensagens.fk)
  if (error.code === "23505") throw new Error(mensagens.unicidade)
  throw new Error(mensagens.generica)
}

export const handleSupabaseError = (error, mensagens, contexto) => {
  logger.error(contexto, error)
  throw traduzirErroSupabase(error, mensagens)
}

export const withSession = async fn => {
  const session = await obterSessao()
  return fn(session)
}

export const withErrorHandling = async (operation, contexto, mensagens) => {
  try {
    return await operation()
  } catch (error) {
    if (error.code) {
      handleSupabaseError(error, mensagens, contexto)
    }
    // Erro sem código (validacao, mock, network) -> re-lanca original
    throw error
  }
}
