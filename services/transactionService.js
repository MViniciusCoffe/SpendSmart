import { supabase } from "../infra/supabase"
import {
  traduzirTipoReverso,
  obterSessao,
  traduzirTipo,
  traduzirErroSupabase,
  validarTitulo,
  validarValor
} from "./utils"

const transactionTypeMap = tx => ({
  id: tx.id,
  titulo: tx.title,
  valor: tx.amount,
  tipo: traduzirTipoReverso(tx.type),
  categoria_id: tx.category_id,
  data_ocorrencia: tx.occurred_on,
  descricao: tx.description,
  metodo_pagamento: tx.payment_method
})

export const transactionService = {
  async getTransactions() {
    const session = await obterSessao()

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", session.user.id)
      .order("occurred_on", { ascending: false })

    if (error) {
      console.error("[Supabase Get Transactions Error]", error.message)
      throw new Error("Não foi possível carregar suas transações.")
    }

    return data.map(transactionTypeMap)
  },

  async createTransaction({
    titulo,
    valor,
    tipo,
    categoria_id,
    data_ocorrencia,
    descricao,
    metodo_pagamento
  }) {
    const session = await obterSessao()
    validarTitulo(titulo)
    const valorNum = validarValor(valor)

    const { data: newTransaction, error } = await supabase
      .from("transactions")
      .insert([
        {
          title: titulo,
          amount: valorNum,
          type: traduzirTipo(tipo),
          category_id: categoria_id,
          occurred_on: data_ocorrencia,
          description: descricao,
          payment_method: metodo_pagamento,
          user_id: session.user.id
        }
      ])
      .select()
      .single()

    if (error) {
      traduzirErroSupabase(error, {
        fk: "Categoria não encontrada.",
        generica: "Não foi possível criar a transação."
      })
    }
    console.error("[Supabase Create Transaction Error]", error?.code, error?.message)
    return transactionTypeMap(newTransaction)
  },

  async updateTransaction({
    id,
    titulo,
    valor,
    tipo,
    categoria_id,
    data_ocorrencia,
    descricao,
    metodo_pagamento
  }) {
    const session = await obterSessao()
    validarTitulo(titulo)
    const valorNum = validarValor(valor)

    const { data: updatedTransaction, error } = await supabase
      .from("transactions")
      .update({
        title: titulo,
        amount: valorNum,
        type: traduzirTipo(tipo),
        category_id: categoria_id,
        occurred_on: data_ocorrencia,
        description: descricao,
        payment_method: metodo_pagamento
      })
      .eq("id", id)
      .eq("user_id", session.user.id)
      .select()
      .single()

    if (error) {
      traduzirErroSupabase(error, {
        fk: "Categoria não encontrada.",
        generica: "Não foi possível atualizar a transação."
      })
    }
    console.error("[Supabase Update Transaction Error]", error?.code, error?.message)
    return transactionTypeMap(updatedTransaction)
  },

  async deleteTransaction(id) {
    const session = await obterSessao()

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id)

    if (error) {
      traduzirErroSupabase(error, { generica: "Não foi possível deletar a transação." })
    }
    console.error("[Supabase Delete Transaction Error]", error?.code, error?.message)
    return true
  }
}
