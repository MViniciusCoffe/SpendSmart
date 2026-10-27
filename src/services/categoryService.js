import { supabase } from "@/lib/supabase"
import { withSession, withErrorHandling } from "@/services/utils/baseService"
import { categoryTypeMap } from "@/services/utils/mappers"
import validators from "@/services/utils/validators"

export const categoryService = {
  // includeDeleted keeps soft-deleted categories so old transactions can still show their name
  async getCategories({ includeDeleted = false } = {}) {
    return withSession(async session => {
      return withErrorHandling(
        async () => {
          let query = supabase
            .from("categories")
            .select("id,name,type,description,color,deleted_at")
            .eq("user_id", session.user.id)
          if (!includeDeleted) query = query.is("deleted_at", null)
          const { data, error } = await query.order("name", { ascending: true })
          if (error) throw error
          return data.map(categoryTypeMap)
        },
        "getCategories",
        { generica: "Não foi possível carregar suas categorias." }
      )
    })
  },

  async createCategory({ name, type, description, color }) {
    return withSession(async session => {
      return withErrorHandling(
        async () => {
          const validName = validators.nome(name)
          const validType = validators.tipo(type)
          const validDescription = validators.descricao(description)
          const validColor = validators.cor(color)

          const { data, error } = await supabase
            .from("categories")
            .insert([
              {
                name: validName,
                type: validType,
                description: validDescription,
                color: validColor,
                user_id: session.user.id
              }
            ])
            .select()
            .single()
          if (error) throw error
          return categoryTypeMap(data)
        },
        "createCategory",
        {
          unicidade: "Categoria já existe. Escolha outro nome.",
          generica: "Não foi possível criar a categoria."
        }
      )
    })
  },

  async countTransactions(categoryId) {
    return withSession(async session => {
      return withErrorHandling(
        async () => {
          const { count, error } = await supabase
            .from("transactions")
            .select("id", { count: "exact", head: true })
            .eq("category_id", categoryId)
            .eq("user_id", session.user.id)
            .is("deleted_at", null)
          if (error) throw error
          return count ?? 0
        },
        "countTransactions",
        { generica: "Não foi possível verificar as transações da categoria." }
      )
    })
  },

  // updateTransactionsType keeps the category's transactions on the same type
  async updateCategory({ id, name, type, description, color, updateTransactionsType = false }) {
    return withSession(async session => {
      return withErrorHandling(
        async () => {
          const validName = validators.nome(name)
          const validType = validators.tipo(type)
          const validDescription = validators.descricao(description)
          const validColor = validators.cor(color)

          const { data, error } = await supabase
            .from("categories")
            .update({
              name: validName,
              type: validType,
              description: validDescription,
              color: validColor
            })
            .eq("id", id)
            .eq("user_id", session.user.id)
            .select()
            .single()
          if (error) throw error

          if (updateTransactionsType) {
            const { error: txError } = await supabase
              .from("transactions")
              .update({ type: validType })
              .eq("category_id", id)
              .eq("user_id", session.user.id)
              .is("deleted_at", null)
            if (txError) throw txError
          }

          return categoryTypeMap(data)
        },
        "updateCategory",
        {
          unicidade: "Já existe outra categoria com este nome.",
          generica: "Não foi possível atualizar a categoria."
        }
      )
    })
  },

  async deleteCategory(id) {
    return withSession(async session => {
      return withErrorHandling(
        async () => {
          const { error } = await supabase
            .from("categories")
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", id)
            .eq("user_id", session.user.id)
            .is("deleted_at", null)
          if (error) throw error
          return true
        },
        "deleteCategory",
        {
          fk: "Não é possível deletar esta categoria pois existem transações usando ela.",
          generica: "Não foi possível deletar a categoria."
        }
      )
    })
  },

  async restoreCategory(id) {
    return withSession(async session => {
      return withErrorHandling(
        async () => {
          const { data, error } = await supabase
            .from("categories")
            .update({ deleted_at: null })
            .eq("id", id)
            .eq("user_id", session.user.id)
            .select("id,name,type,description,color,deleted_at")
            .single()
          if (error) throw error
          return categoryTypeMap(data)
        },
        "restoreCategory",
        {
          unicidade: "Já existe uma categoria ativa com este nome e tipo.",
          generica: "Não foi possível restaurar a categoria."
        }
      )
    })
  }
}
