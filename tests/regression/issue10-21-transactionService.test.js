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
      transactionService.createTransaction({ title: "", amount: 100, type: "income" })
    ).rejects.toThrow("Título é obrigatório")
  })

  it("updateTransaction rejeita título vazio", async () => {
    await expect(
      transactionService.updateTransaction({ id: 1, title: "", amount: 100, type: "income" })
    ).rejects.toThrow("Título é obrigatório")
  })
})

describe("Regressão #21 — DTO com occurred_on e payment_method", () => {
  it("createTransaction devolve DTO com occurred_on e payment_method", async () => {
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
      title: "Salário",
      amount: 5000,
      type: "income",
      occurred_on: "2026-10-01",
      payment_method: "pix"
    })

    expect(resultado).toEqual(
      expect.objectContaining({
        title: "Salário",
        occurred_on: "2026-10-01",
        payment_method: "pix"
      })
    )
  })

  it("updateTransaction devolve DTO com occurred_on e payment_method", async () => {
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
      title: "Freelance",
      amount: 1200,
      type: "income",
      occurred_on: "2026-10-05",
      payment_method: "transferencia"
    })

    expect(resultado).toEqual(
      expect.objectContaining({
        title: "Freelance",
        occurred_on: "2026-10-05",
        payment_method: "transferencia"
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
      title: "Salário",
      amount: 5000,
      type: "income"
    })

    expect(builder.insert.mock.calls[0][0][0].type).toBe("income")
  })

  it("createTransaction com despesa traduz tipo para expense", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)
    const builder = criarBuilder({ data: linha({ type: "expense" }), error: null })
    supabase.from.mockReturnValue(builder)

    await transactionService.createTransaction({
      title: "Mercado",
      amount: 150,
      type: "expense"
    })

    expect(builder.insert.mock.calls[0][0][0].type).toBe("expense")
  })

  it("createTransaction rejeita valor inválido (NaN)", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)

    await expect(
      transactionService.createTransaction({ title: "Teste", amount: "abc", type: "income" })
    ).rejects.toThrow("Valor inválido: deve ser um número válido")
  })

  it("updateTransaction rejeita valor inválido (NaN)", async () => {
    await expect(
      transactionService.updateTransaction({
        id: 1,
        title: "Teste",
        amount: "abc",
        type: "income"
      })
    ).rejects.toThrow("Valor inválido: deve ser um número válido")
  })
})
