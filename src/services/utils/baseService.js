import { supabase } from "@/lib/supabase"
import { logger } from "./logger"

// Lida a cada chamada, sem cache: o getSession() lê o armazenamento do próprio cliente (só vai à
// rede para renovar um token vencido), então já devolve o usuário atual depois de um logout, de um
// login de outro usuário na mesma aba ou de uma troca feita em outra aba. Um cache aqui
// reaproveitava o user_id anterior por 5 minutos (issue #76).
export const obterSessao = async () => {
  const {
    data: { session },
    error
  } = await supabase.auth.getSession()
  if (error || !session) throw new Error("Usuário não autenticado.")
  return session
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
    // A presença da propriedade decide, não o valor: uma falha de rede chega do postgrest-js como
    // PostgrestError com code "" e mensagem "FetchError: ..." em inglês, e um `if (error.code)`
    // deixava esse texto cru chegar à tela. Erro de validação é um Error sem code e continua
    // subindo original, porque a mensagem dele já é a que o usuário deve ler.
    if (error.code !== undefined) {
      handleSupabaseError(error, mensagens, contexto)
    }
    throw error
  }
}
