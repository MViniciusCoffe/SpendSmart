jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
    auth: { getSession: jest.fn() }
  }
}))

import { supabase } from "@/lib/supabase"
import { categoryService } from "@/services/categoryService"
import { criarBuilder, linhaCategoria, comSessao } from "../helpers/supabase"
import { clearSessionCache } from "@/services/utils/baseService"

// Regressão: transações de categoria excluída apareciam sem categoria ("—")
// porque a única listagem disponível escondia as categorias deletadas (US-009, CA-009.05)
describe("Regressão: nome de categoria excluída nas transações", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    clearSessionCache()
    supabase.auth.getSession.mockResolvedValue(comSessao)
  })

  it("getCategories({ includeDeleted: true }) devolve a categoria deletada", async () => {
    supabase.from.mockReturnValue(
      criarBuilder({
        data: [linhaCategoria({ id: 7, name: "Mercado", deleted_at: "2026-10-01T00:00:00Z" })],
        error: null
      })
    )

    const categorias = await categoryService.getCategories({ includeDeleted: true })

    expect(categorias).toEqual([
      expect.objectContaining({ id: 7, name: "Mercado", deleted_at: "2026-10-01T00:00:00Z" })
    ])
  })

  it("excluir categoria com transações continua permitido (soft delete)", async () => {
    const builder = criarBuilder({ error: null })
    supabase.from.mockReturnValue(builder)

    await expect(categoryService.deleteCategory(7)).resolves.toBe(true)
    expect(builder.update).toHaveBeenCalledWith({ deleted_at: expect.any(String) })
  })
})

describe("formatCategoryName", () => {
  const { formatCategoryName } = require("../../src/lib/utils/format")

  it("marca categoria deletada", () => {
    expect(formatCategoryName({ name: "Mercado", deleted_at: "2026-10-01" })).toBe(
      "Mercado (deletada)"
    )
  })

  it("mantém o nome de categoria ativa e trata ausência", () => {
    expect(formatCategoryName({ name: "Mercado", deleted_at: null })).toBe("Mercado")
    expect(formatCategoryName(undefined)).toBe("")
  })
})
