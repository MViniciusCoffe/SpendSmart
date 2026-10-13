import { supabase } from "../infra/supabase"
import { obterSessao, traduzirErroSupabase, validarTitulo, validarValor } from "./utils"

const transactionTypeMap = tx => ({
  id: tx.id,
  title: tx.title,
  amount: tx.amount,
  type: tx.type,
  category_id: tx.category_id,
  occurred_on: tx.occurred_on,
  description: tx.description,
  payment_method: tx.payment_method,
  deleted_at: tx.deleted_at
})

export const transactionService = {
  async getTransactions() {
    const session = await obterSessao()

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", session.user.id)
      .is("deleted_at", null)
      .order("occurred_on", { ascending: false })

    if (error) {
      console.error("[Supabase Get Transactions Error]", error.message)
      throw new Error("Não foi possível carregar suas transações.")
    }

    return data.map(transactionTypeMap)
  },

  async createTransaction({
    title,
    amount,
    type,
    category_id,
    occurred_on,
    description,
    payment_method
  }) {
    const session = await obterSessao()
    validarTitulo(title)
    const amountNum = validarValor(amount)

    const { data: newTransaction, error } = await supabase
      .from("transactions")
      .insert([
        {
          title,
          amount: amountNum,
          type,
          category_id,
          occurred_on,
          description,
          payment_method,
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
    title,
    amount,
    type,
    category_id,
    occurred_on,
    description,
    payment_method
  }) {
    const session = await obterSessao()
    validarTitulo(title)
    const amountNum = validarValor(amount)

    const { data: updatedTransaction, error } = await supabase
      .from("transactions")
      .update({
        title,
        amount: amountNum,
        type,
        category_id,
        occurred_on,
        description,
        payment_method
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
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", session.user.id)
      .is("deleted_at", null)

    if (error) {
      traduzirErroSupabase(error, { generica: "Não foi possível deletar a transação." })
    }
    console.error("[Supabase Delete Transaction Error]", error?.code, error?.message)
    return true
  }
}
