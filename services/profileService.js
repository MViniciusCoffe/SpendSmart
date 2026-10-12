import { supabase } from "../infra/supabase"

export const profileService = {
  async updateProfile({ full_name, password, birth_date, phone }) {
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession()
    if (sessionError || !session) throw new Error("Usuário não autenticado.")

    const userId = session.user.id

    // 1. Atualizar a Senha (Isso vai para o Supabase Auth)
    if (password) {
      const { error: authError } = await supabase.auth.updateUser({
        password
      })
      if (authError)
        throw new Error(
          "Não foi possível atualizar a senha. A senha deve ter no mínimo 6 caracteres."
        )
    }

    const profileUpdates = {}
    if (full_name) profileUpdates.full_name = full_name
    if (birth_date) profileUpdates.birth_date = birth_date
    if (phone) profileUpdates.phone = phone

    // Só faz a requisição pro banco se o usuário digitou algum dado de perfil
    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update(profileUpdates)
        .eq("id", userId)

      if (profileError) {
        console.error("[Supabase Update Profile Error]", profileError)
        throw new Error("Não foi possível atualizar os dados do perfil.")
      }
    }

    return true
  },

  async deleteAccount() {
    // 1. Pega a sessão atual
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession()
    if (sessionError || !session) throw new Error("Usuário não autenticado.")

    // 2. Faz o fetch para a nossa rota interna (O serviço lida com a rede, não a tela)
    const response = await fetch("/api/deleteAccount", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Não foi possível excluir a conta.")
    }

    return true
  }
}
