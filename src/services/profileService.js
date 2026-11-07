import { supabase } from "@/lib/supabase"
import { handleSupabaseError } from "@/services/utils/baseService"
import validators from "@/services/utils/validators"

// Códigos do Supabase Auth ao trocar a senha (verificados no Supabase local, HTTP 422). O navegador
// não conhece a senha atual (o Supabase guarda só o hash), então "senha igual à atual" só pode ser
// detectada pela resposta do servidor (issue #11).
const MENSAGENS_SENHA = {
  same_password: "A nova senha deve ser diferente da atual.",
  weak_password: "Senha deve ter no mínimo 6 caracteres"
}

export const profileService = {
  async getProfile() {
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession()
    if (sessionError || !session) throw new Error("Usuário não autenticado.")

    const { data, error } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", session.user.id)
      .maybeSingle()

    if (error) {
      handleSupabaseError(
        error,
        { generica: "Não foi possível carregar os dados do perfil." },
        "getProfile"
      )
    }

    return data
  },

  async updateProfile({ full_name, password, birth_date, phone }) {
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession()
    if (sessionError || !session) throw new Error("Usuário não autenticado.")

    const userId = session.user.id

    if (password) {
      // Senha curta é recusada aqui, sem ida ao servidor
      validators.senha(password)

      const { error: authError } = await supabase.auth.updateUser({ password })
      if (authError) {
        throw new Error(MENSAGENS_SENHA[authError.code] ?? "Não foi possível atualizar a senha.")
      }
    }

    const profileUpdates = {}
    if (full_name) profileUpdates.full_name = full_name
    if (birth_date) profileUpdates.birth_date = birth_date
    if (phone) profileUpdates.phone = phone

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update(profileUpdates)
        .eq("id", userId)

      if (profileError) {
        handleSupabaseError(
          profileError,
          {
            generica: "Não foi possível atualizar os dados do perfil."
          },
          "updateProfile"
        )
      }
    }

    return true
  }
}
