import { supabase } from "../infra/supabase"
import { withSession, withErrorHandling, handleSupabaseError } from "./baseService"
import { categoryTypeMap } from "./mappers"

export const categoryService = {
  async getCategories() {
    return withSession(async session => {
      return withErrorHandling(
        async () => {
          const { data, error } = await supabase
            .from("categories")
            .select("id,name,type,description,color,deleted_at")
            .eq("user_id", session.user.id)
            .is("deleted_at", null)
            .order("name", { ascending: true })
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
          const { data, error } = await supabase
            .from("categories")
            .insert([{ name, type, description, color, user_id: session.user.id }])
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

  async updateCategory({ id, name, type, description, color }) {
    return withSession(async session => {
      return withErrorHandling(
        async () => {
          const { data, error } = await supabase
            .from("categories")
            .update({ name, type, description, color })
            .eq("id", id)
            .eq("user_id", session.user.id)
            .select()
            .single()
          if (error) throw error
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
  }
}
