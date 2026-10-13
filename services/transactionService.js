import { supabase } from "../infra/supabase"
import { withSession, withErrorHandling, handleSupabaseError } from "./utils/baseService"
import { transactionTypeMap } from "./utils/mappers"
import validators from "./utils/validators"

export const transactionService = {
  async getTransactions() {
    return withSession(async session => {
      return withErrorHandling(
        async () => {
          const { data, error } = await supabase
            .from("transactions")
            .select(
              "id,title,amount,type,category_id,occurred_on,description,payment_method,deleted_at"
            )
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
      return withErrorHandling(
        async () => {
          const validTitle = validators.titulo(title)
          const validAmount = validators.valor(amount)
          const validType = validators.tipo(type)
          const validCategoryId = validators.categoriaId(category_id)
          const validDate = validators.data(occurred_on)
          const validDescription = validators.descricao(description)
          const validPaymentMethod = validators.formaPagamento(payment_method)

          const { data: newTransaction, error } = await supabase
            .from("transactions")
            .insert([
              {
                title: validTitle,
                amount: validAmount,
                type: validType,
                category_id: validCategoryId,
                occurred_on: validDate,
                description: validDescription,
                payment_method: validPaymentMethod,
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
      return withErrorHandling(
        async () => {
          const validTitle = validators.titulo(title)
          const validAmount = validators.valor(amount)
          const validType = validators.tipo(type)
          const validCategoryId = validators.categoriaId(category_id)
          const validDate = validators.data(occurred_on)
          const validDescription = validators.descricao(description)
          const validPaymentMethod = validators.formaPagamento(payment_method)

          const { data: updatedTransaction, error } = await supabase
            .from("transactions")
            .update({
              title: validTitle,
              amount: validAmount,
              type: validType,
              category_id: validCategoryId,
              occurred_on: validDate,
              description: validDescription,
              payment_method: validPaymentMethod
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
