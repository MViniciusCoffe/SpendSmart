import { supabase } from "../infra/supabase"

const categoryTypeMap = cat => ({
  id: cat.id,
  nome: cat.name,
  tipo: cat.type === "income" ? "receita" : "despesa",
  descricao: cat.description,
  cor: cat.color
})

export const categoryService = {
  async getCategories() {
    const {
      data: { session }
    } = await supabase.auth.getSession()
    if (!session) throw new Error("Usuário não autenticado.")

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", session.user.id)
      .order("name", { ascending: true })

    if (error) {
      console.error("[Supabase Get Categories Error]", error.message)
      throw new Error("Não foi possível carregar suas categorias.")
    }

    return data.map(categoryTypeMap)
  },

  async createCategory({ nome, tipo, descricao, cor }) {
    const {
      data: { session }
    } = await supabase.auth.getSession()
    if (!session) throw new Error("Usuário não autenticado.")

    const { data, error } = await supabase
      .from("categories")
      .insert([
        {
          name: nome,
          type: tipo === "receita" ? "income" : "expense",
          description: descricao,
          color: cor,
          user_id: session.user.id
        }
      ])
      .select()
      .single()

    if (error) {
      console.error("[Supabase Create Category Error]", error.code, error.message)
      if (error.code === "23505") throw new Error("Categoria já existe. Escolha outro nome.")
      throw new Error("Não foi possível criar a categoria.")
    }
    return categoryTypeMap(data)
  },

  async updateCategory({ id, nome, tipo, descricao, cor }) {
    const { data, error } = await supabase
      .from("categories")
      .update({
        name: nome,
        type: tipo === "receita" ? "income" : "expense",
        description: descricao,
        color: cor
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[Supabase updateCategory Error]:", error.code, error.message)
      if (error.code === "23505") throw new Error("Já existe outra categoria com este nome.")
      throw new Error("Não foi possível atualizar a categoria.")
    }
    return categoryTypeMap(data)
  },

  async deleteCategory(id) {
    const { error } = await supabase.from("categories").delete().eq("id", id)

    if (error) {
      console.error("[Supabase deleteCategory Error]:", error.code, error.message)
      if (error.code === "23503")
        throw new Error("Não é possível deletar esta categoria pois existem transações usando ela.")
      throw new Error("Não foi possível deletar a categoria.")
    }
    return true
  }
}
