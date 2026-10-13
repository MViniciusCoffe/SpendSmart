import { supabase } from "../infra/supabase"
import { handleSupabaseError } from "./utils/baseService"

export const profileService = {
  async updateProfile({ full_name, password, birth_date, phone }) {
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession()
    if (sessionError || !session) throw new Error("Usuário não autenticado.")

    const userId = session.user.id

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
