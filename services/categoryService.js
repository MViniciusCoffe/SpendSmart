import { supabase } from "../infra/supabase"
import { obterSessao, traduzirErroSupabase } from "./utils"

const categoryTypeMap = cat => ({
  id: cat.id,
  name: cat.name,
  type: cat.type,
  description: cat.description,
  color: cat.color,
  deleted_at: cat.deleted_at
})

export const categoryService = {
  async getCategories() {
    const session = await obterSessao()

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", session.user.id)
      .is("deleted_at", null)
      .order("name", { ascending: true })

    if (error) {
      console.error("[Supabase Get Categories Error]", error.message)
      throw new Error("Não foi possível carregar suas categorias.")
    }

    return data.map(categoryTypeMap)
  },

  async createCategory({ name, type, description, color }) {
    const session = await obterSessao()

    const { data, error } = await supabase
      .from("categories")
      .insert([
        {
          name,
          type,
          description,
          color,
          user_id: session.user.id
        }
      ])
      .select()
      .single()

    if (error) {
      console.error("[Supabase Create Category Error]", error.code, error.message)
      traduzirErroSupabase(error, {
        unicidade: "Categoria já existe. Escolha outro nome.",
        generica: "Não foi possível criar a categoria."
      })
    }
    return categoryTypeMap(data)
  },

  async updateCategory({ id, name, type, description, color }) {
    const session = await obterSessao()

    const { data, error } = await supabase
      .from("categories")
      .update({
        name,
        type,
        description,
        color
      })
      .eq("id", id)
      .eq("user_id", session.user.id)
      .select()
      .single()

    if (error) {
      console.error("[Supabase updateCategory Error]:", error.code, error.message)
      traduzirErroSupabase(error, {
        unicidade: "Já existe outra categoria com este nome.",
        generica: "Não foi possível atualizar a categoria."
      })
    }
    return categoryTypeMap(data)
  },

  async deleteCategory(id) {
    const session = await obterSessao()

    const { error } = await supabase
      .from("categories")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", session.user.id)
      .is("deleted_at", null)

    if (error) {
      console.error("[Supabase deleteCategory Error]:", error.code, error.message)
      traduzirErroSupabase(error, {
        fk: "Não é possível deletar esta categoria pois existem transações usando ela.",
        generica: "Não foi possível deletar a categoria."
      })
    }
    return true
  }
}
