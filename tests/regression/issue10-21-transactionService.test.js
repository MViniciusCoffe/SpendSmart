jest.mock("../../infra/supabase", () => ({
  supabase: {
    from: jest.fn(),
    auth: { getSession: jest.fn() }
  }
}))

import { supabase } from "../../infra/supabase"
import { transactionService } from "../../services/transactionService"
import { criarBuilder, comSessao } from "../helpers/supabase"
import { linha } from "../helpers/fixtures"

describe("Regressão #10 — validação de título na fronteira", () => {
  it("createTransaction rejeita título vazio", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)

    await expect(
      transactionService.createTransaction({ titulo: "", valor: 100, tipo: "receita" })
    ).rejects.toThrow("Título é obrigatório")
  })

  it("updateTransaction rejeita título vazio", async () => {
    await expect(
      transactionService.updateTransaction({ id: 1, titulo: "", valor: 100, tipo: "receita" })
    ).rejects.toThrow("Título é obrigatório")
  })
})

describe("Regressão #21 — DTO com data_ocorrencia e metodo_pagamento", () => {
  it("createTransaction devolve DTO com data_ocorrencia e metodo_pagamento", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)
    supabase.from.mockReturnValue(
      criarBuilder({
        data: linha({
          title: "Salário",
          occurred_on: "2026-10-01",
          payment_method: "pix"
        }),
        error: null
      })
    )

    const resultado = await transactionService.createTransaction({
      titulo: "Salário",
      valor: 5000,
      tipo: "receita",
      data_ocorrencia: "2026-10-01",
      metodo_pagamento: "pix"
    })

    expect(resultado).toEqual(
      expect.objectContaining({
        titulo: "Salário",
        data_ocorrencia: "2026-10-01",
        metodo_pagamento: "pix"
      })
    )
  })

  it("updateTransaction devolve DTO com data_ocorrencia e metodo_pagamento", async () => {
    supabase.from.mockReturnValue(
      criarBuilder({
        data: linha({
          title: "Freelance",
          occurred_on: "2026-10-05",
          payment_method: "transferencia"
        }),
        error: null
      })
    )

    const resultado = await transactionService.updateTransaction({
      id: 1,
      titulo: "Freelance",
      valor: 1200,
      tipo: "receita",
      data_ocorrencia: "2026-10-05",
      metodo_pagamento: "transferencia"
    })

    expect(resultado).toEqual(
      expect.objectContaining({
        titulo: "Freelance",
        data_ocorrencia: "2026-10-05",
        metodo_pagamento: "transferencia"
      })
    )
  })
})

describe("Regressão #10/#21 — validação de valor e tradução de tipo", () => {
  it("createTransaction com receita traduz tipo para income", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)
    const builder = criarBuilder({ data: linha({ type: "income" }), error: null })
    supabase.from.mockReturnValue(builder)

    await transactionService.createTransaction({
      titulo: "Salário",
      valor: 5000,
      tipo: "receita"
    })

    expect(builder.insert.mock.calls[0][0][0].type).toBe("income")
  })

  it("createTransaction com despesa traduz tipo para expense", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)
    const builder = criarBuilder({ data: linha({ type: "expense" }), error: null })
    supabase.from.mockReturnValue(builder)

    await transactionService.createTransaction({
      titulo: "Mercado",
      valor: 150,
      tipo: "despesa"
    })

    expect(builder.insert.mock.calls[0][0][0].type).toBe("expense")
  })

  it("createTransaction rejeita valor inválido (NaN)", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)

    await expect(
      transactionService.createTransaction({ titulo: "Teste", valor: "abc", tipo: "receita" })
    ).rejects.toThrow("Valor inválido: deve ser um número válido")
  })

  it("updateTransaction rejeita valor inválido (NaN)", async () => {
    await expect(
      transactionService.updateTransaction({
        id: 1,
        titulo: "Teste",
        valor: "abc",
        tipo: "receita"
      })
    ).rejects.toThrow("Valor inválido: deve ser um número válido")
  })
})
