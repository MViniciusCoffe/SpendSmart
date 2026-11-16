jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
    auth: { getSession: jest.fn() }
  }
}))

import { supabase } from "@/lib/supabase"
import { categoryService } from "@/services/categoryService"
import { criarBuilder, linhaCategoria } from "../helpers/supabase"

// Regressão da issue #76: o baseService guardava a sessão em memória por 5 minutos e nada limpava
// esse cache. Depois de sair e entrar com outro usuário na mesma aba, os services continuavam
// filtrando pelo user_id anterior: listas vazias e escritas recusadas pelo RLS (403), reproduzido
// no teste instrumental da P3 em 2026-11-07. O fluxo no navegador está em
// tests/e2e/st-04-troca-usuario.spec.js.
//
// Os dois usuários rodam no mesmo módulo carregado, sem jest.resetModules(): é a mesma situação
// da aba do navegador, onde o JavaScript não recarrega entre o logout e o login.

const sessaoDe = id => ({ data: { session: { user: { id } } }, error: null })

beforeEach(() => {
  jest.clearAllMocks()
})

describe("Regressão #76 — troca de usuário na mesma aba", () => {
  it("a leitura depois da troca filtra pelo usuário novo", async () => {
    const builder = criarBuilder({ data: [linhaCategoria()], error: null })
    supabase.from.mockReturnValue(builder)

    supabase.auth.getSession.mockResolvedValue(sessaoDe("usuario-a"))
    await categoryService.getCategories()

    supabase.auth.getSession.mockResolvedValue(sessaoDe("usuario-b"))
    await categoryService.getCategories()

    expect(builder.eq).toHaveBeenLastCalledWith("user_id", "usuario-b")
  })

  it("a escrita depois da troca grava no nome do usuário novo", async () => {
    supabase.from.mockReturnValue(criarBuilder({ data: [linhaCategoria()], error: null }))
    supabase.auth.getSession.mockResolvedValue(sessaoDe("usuario-a"))
    await categoryService.getCategories()

    const insercao = criarBuilder({ data: linhaCategoria({ name: "Mercado" }), error: null })
    supabase.from.mockReturnValue(insercao)
    supabase.auth.getSession.mockResolvedValue(sessaoDe("usuario-b"))
    await categoryService.createCategory({ name: "Mercado", type: "expense" })

    expect(insercao.insert).toHaveBeenCalledWith([
      expect.objectContaining({ user_id: "usuario-b", name: "Mercado" })
    ])
  })

  it("depois do logout o service recusa em vez de usar a sessão anterior", async () => {
    supabase.from.mockReturnValue(criarBuilder({ data: [], error: null }))
    supabase.auth.getSession.mockResolvedValue(sessaoDe("usuario-a"))
    await categoryService.getCategories()

    supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })

    await expect(categoryService.getCategories()).rejects.toThrow("Usuário não autenticado.")
  })
})
