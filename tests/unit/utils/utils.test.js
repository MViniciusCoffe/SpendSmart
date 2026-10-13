jest.mock("../../../infra/supabase", () => ({
  supabase: {
    auth: {
      getSession: jest.fn()
    }
  }
}))

import { supabase } from "../../../infra/supabase"
import validators from "../../../services/utils/validators"
import {
  obterSessao,
  traduzirErroSupabase,
  clearSessionCache
} from "../../../services/utils/baseService"

describe("utils", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    clearSessionCache()
  })

  describe("validarTitulo", () => {
    it("retorna titulo valido com trim", () => {
      expect(validators.titulo("  Teste  ")).toBe("Teste")
    })

    it("lança erro para string vazia", () => {
      expect(() => validators.titulo("")).toThrow("Título é obrigatório")
    })

    it("lança erro para apenas espacos", () => {
      expect(() => validators.titulo("   ")).toThrow("Título é obrigatório")
    })

    it("lança erro para valor nao string", () => {
      expect(() => validators.titulo(123)).toThrow("Título é obrigatório")
    })

    it("lança erro para null", () => {
      expect(() => validators.titulo(null)).toThrow("Título é obrigatório")
    })

    it("lança erro para undefined", () => {
      expect(() => validators.titulo(undefined)).toThrow("Título é obrigatório")
    })
  })

  describe("validarValor", () => {
    it("retorna numero valido", () => {
      expect(validators.valor(100)).toBe(100)
      expect(validators.valor("100")).toBe(100)
      expect(validators.valor(100.5)).toBe(100.5)
    })

    it("lança TypeError para NaN", () => {
      expect(() => validators.valor("abc")).toThrow(TypeError)
      expect(() => validators.valor("abc")).toThrow("Valor inválido: deve ser um número válido")
    })

    it("lança TypeError para Infinity", () => {
      expect(() => validators.valor(Infinity)).toThrow(TypeError)
    })

    it("lança TypeError para -Infinity", () => {
      expect(() => validators.valor(-Infinity)).toThrow(TypeError)
    })

    it("lança TypeError para string vazia", () => {
      expect(() => validators.valor("")).toThrow("Valor deve ser maior que zero")
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
  })
})
