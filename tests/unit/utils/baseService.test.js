jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: jest.fn()
    }
  }
}))

import { supabase } from "@/lib/supabase"
import { logger } from "@/services/utils/logger"
import {
  obterSessao,
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

    // Sem cache (issue #76): cada chamada pergunta ao cliente, que já sabe quem está logado agora
    it("lê a sessão a cada chamada e devolve o usuário atual", async () => {
      supabase.auth.getSession
        .mockResolvedValueOnce({ data: { session: { user: { id: "u1" } } }, error: null })
        .mockResolvedValueOnce({ data: { session: { user: { id: "u2" } } }, error: null })

      const primeira = await obterSessao()
      const segunda = await obterSessao()

      expect(supabase.auth.getSession).toHaveBeenCalledTimes(2)
      expect(primeira.user.id).toBe("u1")
      expect(segunda.user.id).toBe("u2")
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
      expect(logger.error).toHaveBeenCalledWith("createCategory", error)
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

    // Falha de rede: o postgrest-js devolve PostgrestError com code "" (issue sem número,
    // encontrada por leitura de código em 2026-11-15)
    it("traduz falha de rede, que chega com codigo vazio", async () => {
      const error = { code: "", message: "FetchError: Failed to fetch" }

      await expect(
        withErrorHandling(
          async () => {
            throw error
          },
          "listar",
          { generica: "Não foi possível carregar." }
        )
      ).rejects.toThrow("Não foi possível carregar.")
      expect(logger.error).toHaveBeenCalledWith("listar", error)
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
})
