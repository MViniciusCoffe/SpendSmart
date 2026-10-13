import { supabase } from "../infra/supabase"

export const obterSessao = async () => {
  const {
    data: { session }
  } = await supabase.auth.getSession()
  if (!session) throw new Error("Usuário não autenticado.")
  return session
}

export const traduzirErroSupabase = (error, mensagens) => {
  if (error.code === "23503") throw new Error(mensagens.fk)
  if (error.code === "23505") throw new Error(mensagens.unicidade)
  throw new Error(mensagens.generica)
}

export const logError = (contexto, error) => {
  console.error(`[${contexto}]`, error.code, error.message)
}

export const handleSupabaseError = (error, mensagens, contexto) => {
  logError(contexto, error)
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
    // Erro sem código (ex: mock, network) -> usa mensagem genérica
    throw new Error(mensagens.generica)
  }
}
