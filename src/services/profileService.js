import { supabase } from "@/lib/supabase"
import { withSession, withErrorHandling } from "@/services/utils/baseService"
import { PROFILE_COLUMNS, profileTypeMap } from "@/services/utils/mappers"
import validators from "@/services/utils/validators"

// Códigos do Supabase Auth ao trocar a senha (verificados no Supabase local, HTTP 422). O navegador
// não conhece a senha atual (o Supabase guarda só o hash), então "senha igual à atual" só pode ser
// detectada pela resposta do servidor (issue #11).
const MENSAGENS_SENHA = {
  same_password: "A nova senha deve ser diferente da atual.",
  weak_password: "Senha deve ter no mínimo 6 caracteres"
}

export const profileService = {
  // Devolve null quando não há perfil ativo (conta sem perfil ou perfil excluído)
  async getProfile() {
    return withSession(async session => {
      return withErrorHandling(
        async () => {
          const { data, error } = await supabase
            .from("profiles")
            .select(PROFILE_COLUMNS)
            .eq("id", session.user.id)
            .is("deleted_at", null)
            .maybeSingle()
          if (error) throw error
          return data ? profileTypeMap(data) : null
        },
        "getProfile",
        { generica: "Não foi possível carregar os dados do perfil." }
      )
    })
  },

  async updateProfile({ full_name, password, birth_date, phone }) {
    return withSession(async session => {
      return withErrorHandling(
        async () => {
          if (password) {
            // Senha curta é recusada aqui, sem ida ao servidor
            validators.senha(password)

            const { error: authError } = await supabase.auth.updateUser({ password })
            if (authError) {
              throw new Error(
                MENSAGENS_SENHA[authError.code] ?? "Não foi possível atualizar a senha."
              )
            }
          }

          const profileUpdates = {}
          if (full_name) profileUpdates.full_name = full_name
          if (birth_date) profileUpdates.birth_date = birth_date
          if (phone) profileUpdates.phone = phone

          if (Object.keys(profileUpdates).length > 0) {
            const { error } = await supabase
              .from("profiles")
              .update(profileUpdates)
              .eq("id", session.user.id)
              .is("deleted_at", null)
            if (error) throw error
          }

          return true
        },
        "updateProfile",
        { generica: "Não foi possível atualizar os dados do perfil." }
      )
    })
  },

  // Exclusão física de propósito (LGPD, #3). A função do banco apaga só a linha de auth.uid() em
  // auth.users e as FKs ON DELETE CASCADE levam perfil, categorias e transações (#75). Não recebe
  // id: quem é excluído sai do token da sessão, nunca de um parâmetro.
  async deleteAccount() {
    return withSession(async () => {
      return withErrorHandling(
        async () => {
          const { error } = await supabase.rpc("delete_own_account")
          if (error) throw error
          return true
        },
        "deleteAccount",
        { generica: "Não foi possível excluir a conta." }
      )
    })
  }
}
