import { supabase } from "../../infra/supabase"

export const validarTitulo = titulo => {
  if (!titulo || titulo.trim() === "") throw new Error("Título é obrigatório")
}

export const validarValor = valor => {
  const valorNum = Number(valor)
  if (!Number.isFinite(valorNum)) throw new TypeError("Valor inválido: deve ser um número válido")
  return valorNum
}

export const traduzirErroSupabase = (error, mensagens) => {
  if (error.code === "23503") throw new Error(mensagens.fk)
  if (error.code === "23505") throw new Error(mensagens.unicidade)
  throw new Error(mensagens.generica)
}

export const obterSessao = async () => {
  const {
    data: { session }
  } = await supabase.auth.getSession()
  if (!session) throw new Error("Usuário não autenticado.")
  return session
}
