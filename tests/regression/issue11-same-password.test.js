jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
    auth: { getSession: jest.fn(), updateUser: jest.fn() }
  }
}))

import { supabase } from "@/lib/supabase"
import { profileService } from "@/services/profileService"
import { comSessao } from "@/tests/helpers/supabase"

// Regressão da issue #11: trocar para a mesma senha devolvia "A senha deve ter no mínimo 6
// caracteres", porque todo erro do updateUser virava essa mensagem. O Supabase Auth responde 422 com
// code "same_password" (conferido no Supabase local em 2026-11-06).

beforeEach(() => {
  jest.clearAllMocks()
  supabase.auth.getSession.mockResolvedValue(comSessao)
})

describe("Regressão #11 — senha igual à atual", () => {
  it("avisa que a nova senha precisa ser diferente, sem falar em tamanho", async () => {
    supabase.auth.updateUser.mockResolvedValue({
      error: {
        name: "AuthApiError",
        code: "same_password",
        status: 422,
        message: "New password should be different from the old password."
      }
    })

    const erro = await profileService.updateProfile({ password: "senha123" }).catch(e => e)

    expect(erro.message).toBe("A nova senha deve ser diferente da atual.")
    expect(erro.message).not.toMatch(/6 caracteres/)
  })
})
