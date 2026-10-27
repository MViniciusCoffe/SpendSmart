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

// Regressão: mudar o tipo da categoria deixava as transações com o tipo antigo
describe("Regressão: tipo da categoria x tipo das transações", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    clearSessionCache()
    supabase.auth.getSession.mockResolvedValue(comSessao)
  })

  it("propaga o novo tipo para as transações quando confirmado", async () => {
    const categoryBuilder = criarBuilder({ data: linhaCategoria({ type: "income" }), error: null })
    const txBuilder = criarBuilder({ error: null })
    supabase.from.mockImplementation(table =>
      table === "transactions" ? txBuilder : categoryBuilder
    )

    await categoryService.updateCategory({
      id: 1,
      name: "Salário",
      type: "income",
      updateTransactionsType: true
    })

    expect(categoryBuilder.update).toHaveBeenCalledWith(expect.objectContaining({ type: "income" }))
    expect(txBuilder.update).toHaveBeenCalledWith({ type: "income" })
    expect(txBuilder.eq).toHaveBeenCalledWith("category_id", 1)
  })
})
