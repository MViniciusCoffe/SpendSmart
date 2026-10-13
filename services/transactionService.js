import { supabase } from "../infra/supabase"
import { validarTitulo, validarValor } from "./utils"
import { withSession, withErrorHandling, handleSupabaseError } from "./baseService"

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
    return withSession(async session => {
      return withErrorHandling(
        async () => {
          const { data, error } = await supabase
            .from("transactions")
            .select("*")
            .eq("user_id", session.user.id)
            .is("deleted_at", null)
            .order("occurred_on", { ascending: false })
          if (error) throw error
          return data.map(transactionTypeMap)
        },
        "getTransactions",
        { generica: "Não foi possível carregar suas transações." }
      )
    })
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
    return withSession(async session => {
      validarTitulo(title)
      const amountNum = validarValor(amount)

      return withErrorHandling(
        async () => {
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
          if (error) throw error
          return transactionTypeMap(newTransaction)
        },
        "createTransaction",
        {
          fk: "Categoria não encontrada.",
          generica: "Não foi possível criar a transação."
        }
      )
    })
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
    return withSession(async session => {
      validarTitulo(title)
      const amountNum = validarValor(amount)

      return withErrorHandling(
        async () => {
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
          if (error) throw error
          return transactionTypeMap(updatedTransaction)
        },
        "updateTransaction",
        {
          fk: "Categoria não encontrada.",
          generica: "Não foi possível atualizar a transação."
        }
      )
    })
  },

  async deleteTransaction(id) {
    return withSession(async session => {
      return withErrorHandling(
        async () => {
          const { error } = await supabase
            .from("transactions")
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", id)
            .eq("user_id", session.user.id)
            .is("deleted_at", null)
          if (error) throw error
          return true
        },
        "deleteTransaction",
        { generica: "Não foi possível deletar a transação." }
      )
    })
  }
}
