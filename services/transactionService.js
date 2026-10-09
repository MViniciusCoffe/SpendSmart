import { supabase } from "../infra/supabase"

const transactionTypeMap = tx => ({
  id: tx.id,
  titulo: tx.title,
  valor: tx.amount,
  tipo: tx.type === "income" ? "receita" : "despesa",
  categoria_id: tx.category_id,
  data_ocorrencia: tx.occurred_on,
  descricao: tx.description,
  metodo_pagamento: tx.payment_method
})

export const transactionService = {
  async getTransactions() {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
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
    const {
      data: { session }
    } = await supabase.auth.getSession()
    if (!session) throw new Error("Usuário não autenticado.")

    if (!titulo || titulo.trim() === "") {
      throw new Error("Título é obrigatório")
    }

    const valorNum = Number(valor)
    if (!Number.isFinite(valorNum)) {
      throw new TypeError("Valor inválido: deve ser um número válido")
    }

    const { data: newTransaction, error } = await supabase
      .from("transactions")
      .insert([
        {
          title: titulo,
          amount: valorNum,
          type: tipo === "receita" ? "income" : "expense",
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
      console.error("[Supabase Create Transaction Error]", error.code, error.message)
      if (error.code === "23503") throw new Error("Categoria não encontrada.")
      throw new Error("Não foi possível criar a transação.")
    }
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
    if (!titulo || titulo.trim() === "") {
      throw new Error("Título é obrigatório")
    }

    const valorNum = Number(valor)
    if (!Number.isFinite(valorNum)) {
      throw new TypeError("Valor inválido: deve ser um número válido")
    }

    const { data: updatedTransaction, error } = await supabase
      .from("transactions")
      .update({
        title: titulo,
        amount: valorNum,
        type: tipo === "receita" ? "income" : "expense",
        category_id: categoria_id,
        occurred_on: data_ocorrencia,
        description: descricao,
        payment_method: metodo_pagamento
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[Supabase Update Transaction Error]", error.code, error.message)
      if (error.code === "23503") throw new Error("Categoria não encontrada.")
      throw new Error("Não foi possível atualizar a transação.")
    }
    return transactionTypeMap(updatedTransaction)
  },

  async deleteTransaction(id) {
    const { error } = await supabase.from("transactions").delete().eq("id", id)

    if (error) {
      console.error("[Supabase Delete Transaction Error]", error.code, error.message)
      throw new Error("Não foi possível deletar a transação.")
    }
    return true
  }
}
