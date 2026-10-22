jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: jest.fn()
    }
  }
}))

import { supabase } from "@/lib/supabase"
import {
  obterSessao,
  clearSessionCache,
  traduzirErroSupabase,
  handleSupabaseError,
  withSession,
  withErrorHandling
} from "@/services/utils/baseService"

jest.mock("@/services/utils/logger", () => ({
  logger: {
    error: jest.fn()
  }
}))

describe("baseService", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    clearSessionCache()
  })

  describe("obterSessao", () => {
    it("retorna sessao valida", async () => {
      const mockSession = { user: { id: "u1" }, access_token: "token123" }
      supabase.auth.getSession.mockResolvedValue({ data: { session: mockSession }, error: null })

      const session = await obterSessao()
      expect(session).toEqual(mockSession)
    })

    it("lanca erro quando nao ha sessao", async () => {
      supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })

      await expect(obterSessao()).rejects.toThrow("Usuário não autenticado.")
    })

    it("lanca erro quando getSession falha", async () => {
      supabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: "Auth error" }
      })

      await expect(obterSessao()).rejects.toThrow("Usuário não autenticado.")
    })

    it("usa cache quando forceRefresh e false", async () => {
      const mockSession = { user: { id: "u1" }, access_token: "token123" }
      supabase.auth.getSession.mockResolvedValue({ data: { session: mockSession }, error: null })

      const session1 = await obterSessao(false)
      const session2 = await obterSessao(false)

      expect(supabase.auth.getSession).toHaveBeenCalledTimes(1)
      expect(session2).toEqual(session1)
    })

    it("ignora cache quando forceRefresh true", async () => {
      const mockSession1 = { user: { id: "u1" }, access_token: "token1" }
      const mockSession2 = { user: { id: "u2" }, access_token: "token2" }
      supabase.auth.getSession
        .mockResolvedValueOnce({ data: { session: mockSession1 }, error: null })
        .mockResolvedValueOnce({ data: { session: mockSession2 }, error: null })

      const session1 = await obterSessao(false)
      const session2 = await obterSessao(true)

      expect(supabase.auth.getSession).toHaveBeenCalledTimes(2)
      expect(session2).not.toEqual(session1)
    })
  })

  describe("clearSessionCache", () => {
    it("limpa o cache", async () => {
      const mockSession = { user: { id: "u1" }, access_token: "token123" }
      supabase.auth.getSession.mockResolvedValue({ data: { session: mockSession }, error: null })

      await obterSessao()
      clearSessionCache()

      supabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: "u2" }, access_token: "new" } },
        error: null
      })
      const session = await obterSessao()

      expect(session.user.id).toBe("u2")
    })
  })

  describe("traduzirErroSupabase", () => {
    it("traduz codigo 23503 para fk", () => {
      const error = { code: "23503", message: "FK violation" }
      const mensagens = { fk: "Erro de FK", generica: "Erro genérico" }

      expect(() => traduzirErroSupabase(error, mensagens)).toThrow("Erro de FK")
    })

    it("traduz codigo 23505 para unicidade", () => {
      const error = { code: "23505", message: "Unique violation" }
      const mensagens = { unicidade: "Já existe", generica: "Erro genérico" }

      expect(() => traduzirErroSupabase(error, mensagens)).toThrow("Já existe")
    })

    it("usa mensagem generica para codigo desconhecido", () => {
      const error = { code: "99999", message: "Unknown" }
      const mensagens = { generica: "Erro genérico" }

      expect(() => traduzirErroSupabase(error, mensagens)).toThrow("Erro genérico")
    })
  })

  describe("handleSupabaseError", () => {
    it("loga erro e traduz", () => {
      const error = { code: "23505", message: "duplicate" }
      const mensagens = { unicidade: "Já existe" }
      const contexto = "createCategory"

      expect(() => handleSupabaseError(error, mensagens, contexto)).toThrow("Já existe")
    })
  })

  describe("withSession", () => {
    it("passa sessao para funcao", async () => {
      const mockSession = { user: { id: "u1" }, access_token: "token123" }
      supabase.auth.getSession.mockResolvedValue({ data: { session: mockSession }, error: null })

      const result = await withSession(async session => {
        return session.user.id
      })

      expect(result).toBe("u1")
    })

    it("propaga erro da funcao", async () => {
      const mockSession = { user: { id: "u1" }, access_token: "token123" }
      supabase.auth.getSession.mockResolvedValue({ data: { session: mockSession }, error: null })

      await expect(
        withSession(async () => {
          throw new Error("erro interno")
        })
      ).rejects.toThrow("erro interno")
    })
  })

  describe("withErrorHandling", () => {
    it("retorna resultado da operacao", async () => {
      const result = await withErrorHandling(async () => "sucesso", "test", { generica: "erro" })
      expect(result).toBe("sucesso")
    })

    it("trata erro do Supabase com codigo", async () => {
      const error = { code: "23505", message: "duplicate" }

      await expect(
        withErrorHandling(
          async () => {
            throw error
          },
          "test",
          { unicidade: "Já existe", generica: "Erro" }
        )
      ).rejects.toThrow("Já existe")
    })

    it("re-lanca erro sem codigo", async () => {
      const error = new Error("erro generico")

      await expect(
        withErrorHandling(
          async () => {
            throw error
          },
          "test",
          { generica: "Erro genérico" }
        )
      ).rejects.toThrow("erro generico")
    })
  })

  describe("clearSessionCache", () => {
    it("limpa cache", async () => {
      const mockSession = { user: { id: "u1" }, access_token: "token123" }
      supabase.auth.getSession.mockResolvedValue({ data: { session: mockSession }, error: null })

      await obterSessao()
      clearSessionCache()

      supabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: "u2" }, access_token: "new" } },
        error: null
      })
      const session = await obterSessao()

      expect(session.user.id).toBe("u2")
    })
  })
})
