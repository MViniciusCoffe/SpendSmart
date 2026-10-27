jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
    auth: { getSession: jest.fn() }
  }
}))

import { supabase } from "@/lib/supabase"
import { categoryService } from "@/services/categoryService"
import { criarBuilder, comSessao } from "../helpers/supabase"
import { clearSessionCache } from "@/services/utils/baseService"

// Regressão: soft delete não aciona ON DELETE RESTRICT e deixava transações sem categoria
describe("Regressão: excluir categoria em uso", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    clearSessionCache()
    supabase.auth.getSession.mockResolvedValue(comSessao)
  })

  it("não marca deleted_at quando há transações ativas", async () => {
    const txBuilder = criarBuilder({ count: 3, error: null })
    const categoryBuilder = criarBuilder({ error: null })
    supabase.from.mockImplementation(table =>
      table === "transactions" ? txBuilder : categoryBuilder
    )

    await expect(categoryService.deleteCategory(1)).rejects.toThrow("3 transações usam ela")
    expect(categoryBuilder.update).not.toHaveBeenCalled()
  })
})
