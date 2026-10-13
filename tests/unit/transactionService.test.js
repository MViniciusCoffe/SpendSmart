jest.mock("../../infra/supabase", () => ({
  supabase: {
    from: jest.fn(),
    auth: { getSession: jest.fn() }
  }
}))

import { supabase } from "../../infra/supabase"
import { transactionService } from "../../services/transactionService"
import {
  criarBuilder,
  linhaTransacao,
  dtoTransacao,
  semSessao,
  comSessao
} from "../helpers/supabase"
import { clearSessionCache } from "../../services/utils/baseService"

// Antes ou depois de cada teste, podemos limpar os mocks para evitar interferência entre testes
beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, "error").mockImplementation(() => {})
  clearSessionCache()
})

afterEach(() => {
  jest.restoreAllMocks()
})

// Testes para o método getTransactions do serviço de transação
describe("getTransactions", () => {
  it("recusa sem sessao", async () => {
    supabase.auth.getSession.mockResolvedValue(semSessao)

    await expect(transactionService.getTransactions()).rejects.toThrow("Usuário não autenticado.")
  })

  it("traduz income e expense para receita e despesa", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)

    supabase.from.mockReturnValue(
      criarBuilder({
        data: [
          linhaTransacao(),
          linhaTransacao({ id: 2, title: "Salario", type: "income", amount: 5000 })
        ],
        error: null
      })
    )

    const resultado = await transactionService.getTransactions()

    expect(resultado[0]).toEqual(dtoTransacao())
    expect(resultado[1]).toEqual(
      dtoTransacao({ id: 2, title: "Salario", amount: 5000, type: "income" })
    )
  })

  it("ordena por occurred_on decrescente", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)

    const builder = criarBuilder({ data: [], error: null })
    supabase.from.mockReturnValue(builder)

    await transactionService.getTransactions()

    expect(builder.order).toHaveBeenCalledWith("occurred_on", { ascending: false })
  })

  it("traduz o erro do banco em mensagem para o usuario", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)

    supabase.from.mockReturnValue(
      criarBuilder({ data: null, error: { code: "PGRST111", message: "refused" } })
    )

    await expect(transactionService.getTransactions()).rejects.toThrow(
      "Não foi possível carregar suas transações."
    )
  })

  it("le da tabela transactions", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)

    supabase.from.mockReturnValue(criarBuilder({ data: [], error: null }))

    await transactionService.getTransactions()

    expect(supabase.from).toHaveBeenCalledWith("transactions")
  })
})

// Testes para o método createTransaction do serviço de transação
describe("createTransaction", () => {
  it("escreve na tabela transactions", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)
    supabase.from.mockReturnValue(criarBuilder({ data: linhaTransacao(), error: null }))

    await transactionService.createTransaction({
      title: "Aluguel",
      amount: 1500,
      type: "expense",
      category_id: 7
    })

    expect(supabase.from).toHaveBeenCalledWith("transactions")
  })

  it("recusa sem sessao", async () => {
    supabase.auth.getSession.mockResolvedValue(semSessao)

    await expect(
      transactionService.createTransaction({
        title: "X",
        amount: 10,
        type: "expense",
        category_id: 7
      })
    ).rejects.toThrow("Usuário não autenticado.")
  })

  it("traduz o DTO para as colunas e usa o user_id da sessao", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)
    const builder = criarBuilder({ data: linhaTransacao, error: null })
    supabase.from.mockReturnValue(builder)

    await transactionService.createTransaction({
      title: "Aluguel",
      amount: 1500,
      type: "income",
      category_id: 7,
      occurred_on: "2026-09-01",
      description: "Setembro",
      payment_method: "cartao_credito"
    })

    expect(builder.insert).toHaveBeenCalledWith([
      {
        title: "Aluguel",
        amount: 1500,
        type: "income",
        category_id: 7,
        occurred_on: "2026-09-01",
        description: "Setembro",
        payment_method: "cartao_credito",
        user_id: "u1"
      }
    ])
  })

  it("converte despesa em expense na escrita", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)
    const builder = criarBuilder({ data: linhaTransacao, error: null })
    supabase.from.mockReturnValue(builder)

    await transactionService.createTransaction({
      title: "Mercado",
      amount: 80,
      type: "expense",
      category_id: 7
    })

    expect(builder.insert.mock.calls[0][0][0].type).toBe("expense")
  })

  it("limite do contrato: rejeita valor inválido (não numérico)", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)

    await expect(
      transactionService.createTransaction({
        title: "Aluguel",
        amount: "1.234,56",
        type: "expense",
        category_id: 7
      })
    ).rejects.toThrow("Valor inválido: deve ser um número válido")
  })

  it("devolve o DTO em ingles, nao a linha crua", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)
    supabase.from.mockReturnValue(criarBuilder({ data: linhaTransacao(), error: null }))

    const resultado = await transactionService.createTransaction({
      title: "Aluguel",
      amount: 1500,
      type: "expense",
      category_id: 7
    })

    expect(resultado).toEqual(dtoTransacao())
  })

  it("traduz 23503 em categoria inexistente", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)
    supabase.from.mockReturnValue(
      criarBuilder({ data: null, error: { code: "23503", message: "fk" } })
    )

    await expect(
      transactionService.createTransaction({
        title: "X",
        amount: 10,
        type: "expense",
        category_id: 7
      })
    ).rejects.toThrow("Categoria não encontrada.")
  })

  it("traduz qualquer outro erro", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)
    supabase.from.mockReturnValue(
      criarBuilder({ data: null, error: { code: "08006", message: "timeout" } })
    )

    await expect(
      transactionService.createTransaction({
        title: "X",
        amount: 10,
        type: "expense",
        category_id: 7
      })
    ).rejects.toThrow("Não foi possível criar a transação.")
  })
})

// Testes para o método updateTransaction do serviço de transação
describe("updateTransaction", () => {
  it("recusa sem sessao", async () => {
    supabase.auth.getSession.mockResolvedValue(semSessao)

    await expect(
      transactionService.updateTransaction({
        id: 1,
        title: "X",
        amount: 10,
        type: "expense",
        category_id: 7
      })
    ).rejects.toThrow("Usuário não autenticado.")
  })

  it("traduz o DTO para as colunas do update sem enviar user_id", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)
    const builder = criarBuilder({ data: linhaTransacao({ title: "Novo" }), error: null })
    supabase.from.mockReturnValue(builder)

    await transactionService.updateTransaction({
      id: 1,
      title: "Novo",
      amount: 1500,
      type: "income",
      category_id: 7,
      occurred_on: "2026-09-01",
      description: "Setembro",
      payment_method: "cartao_credito"
    })

    const payload = builder.update.mock.calls[0][0]
    expect(payload).toEqual({
      title: "Novo",
      amount: 1500,
      type: "income",
      category_id: 7,
      occurred_on: "2026-09-01",
      description: "Setembro",
      payment_method: "cartao_credito"
    })
    expect(payload).not.toHaveProperty("user_id")
  })

  it("filtra pelo id e devolve o DTO", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)

    const builder = criarBuilder({ data: linhaTransacao({ title: "Novo" }), error: null })
    supabase.from.mockReturnValue(builder)

    const resultado = await transactionService.updateTransaction({
      id: 1,
      title: "Novo",
      amount: 1500,
      type: "expense",
      category_id: 7
    })

    expect(builder.eq).toHaveBeenCalledWith("id", 1)
    expect(resultado).toEqual(dtoTransacao({ title: "Novo" }))
  })

  it("traduz 23503 em categoria inexistente", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)

    supabase.from.mockReturnValue(
      criarBuilder({ data: null, error: { code: "23503", message: "fk" } })
    )

    await expect(
      transactionService.updateTransaction({
        id: 1,
        title: "X",
        amount: 10,
        type: "expense",
        category_id: 7
      })
    ).rejects.toThrow("Categoria não encontrada.")
  })

  it("traduz qualquer outro erro", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)

    supabase.from.mockReturnValue(
      criarBuilder({ data: null, error: { code: "08006", message: "timeout" } })
    )

    await expect(
      transactionService.updateTransaction({
        id: 1,
        title: "X",
        amount: 10,
        type: "expense",
        category_id: 7
      })
    ).rejects.toThrow("Não foi possível atualizar a transação.")
  })
})

// Testes para o método deleteTransaction do serviço de transação
describe("deleteTransaction", () => {
  it("recusa sem sessao", async () => {
    supabase.auth.getSession.mockResolvedValue(semSessao)

    await expect(transactionService.deleteTransaction(1)).rejects.toThrow(
      "Usuário não autenticado."
    )
  })

  it("filtra pelo id e devolve true quando o banco aceita", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)

    const builder = criarBuilder({ error: null })
    supabase.from.mockReturnValue(builder)

    await expect(transactionService.deleteTransaction(1)).resolves.toBe(true)
    expect(builder.eq).toHaveBeenCalledWith("id", 1)
  })

  it("traduz erro genérico quando não há branch específico", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)

    supabase.from.mockReturnValue(criarBuilder({ error: { code: "08006", message: "fk" } }))

    await expect(transactionService.deleteTransaction(1)).rejects.toThrow(
      "Não foi possível deletar a transação."
    )
  })
})
