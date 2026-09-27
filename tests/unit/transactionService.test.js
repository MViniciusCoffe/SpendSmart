jest.mock("../../infra/supabase", () => ({
  supabase: {
    from: jest.fn(),
    auth: { getSession: jest.fn() }
  }
}))

import { supabase } from "../../infra/supabase"
import { transactionService } from "../../services/transactionService"

// Simula o comportamento do Supabase para os métodos que usamos no serviço de transação
const METODOS = ["select", "insert", "update", "delete", "eq", "order", "single"]

const criarBuilder = resultado => {
  const builder = {}
  // Na memória, ficaria tipo:
  // builder.select = jest.fn(() => builder)
  // builder.insert = jest.fn(() => builder)
  // ... e assim por diante
  // Mas podemos fazer isso de forma dinâmica com um loop
  METODOS.forEach(metodo => {
    builder[metodo] = jest.fn(() => builder)
  })
  builder.then = (resolver, rejeitar) => Promise.resolve(resultado).then(resolver, rejeitar)
  return builder
}

// Função auxiliar para criar uma linha de transação com valores padrão, podendo sobrescrever com overrides
const linha = (overrides = {}) => ({
  id: 1,
  title: "Aluguel",
  amount: 1500.0,
  type: "expense",
  category_id: 7,
  occurred_on: "2026-09-01",
  description: "Setembro",
  payment_method: "cartao_credito",
  user_id: "u1",
  ...overrides
})

// Função auxiliar com o DTO em português, que é o que o serviço deve devolver
const dto = (overrides = {}) => ({
  id: 1,
  titulo: "Aluguel",
  valor: 1500.0,
  tipo: "despesa",
  categoria_id: 7,
  data_ocorrencia: "2026-09-01",
  descricao: "Setembro",
  metodo_pagamento: "cartao_credito",
  ...overrides
})

const semSessao = { data: { session: null } }
const comSessao = { data: { session: { user: { id: "u1" } } } }

// Antes ou depois de cada teste, podemos limpar os mocks para evitar interferência entre testes
beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

// Testes para o método getTransactions do serviço de transação
describe("getTransactions", () => {
  it("traduz income e expense para receita e despesa", async () => {
    supabase.from.mockReturnValue(
      criarBuilder({
        data: [linha(), linha({ id: 2, title: "Salario", type: "income", amount: 5000 })],
        error: null
      })
    )

    const resultado = await transactionService.getTransactions()

    expect(resultado[0]).toEqual(dto())
    expect(resultado[1]).toEqual(dto({ id: 2, titulo: "Salario", valor: 5000, tipo: "receita" }))
  })

  it("ordena por occurred_on decrescente", async () => {
    const builder = criarBuilder({ data: [], error: null })
    supabase.from.mockReturnValue(builder)

    await transactionService.getTransactions()

    expect(builder.order).toHaveBeenCalledWith("occurred_on", { ascending: false })
  })

  it("traduz o erro do banco em mensagem para o usuario", async () => {
    supabase.from.mockReturnValue(criarBuilder({ data: null, error: { message: "refused" } }))

    await expect(transactionService.getTransactions()).rejects.toThrow(
      "Não foi possível carregar suas transações."
    )
  })

  it("le da tabela transactions", async () => {
    supabase.from.mockReturnValue(criarBuilder({ data: [], error: null }))

    await transactionService.getTransactions()

    expect(supabase.from).toHaveBeenCalledWith("transactions")
  })
})

// Testes para o método createTransaction do serviço de transação
describe("createTransaction", () => {
  it("escreve na tabela transactions", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)
    supabase.from.mockReturnValue(criarBuilder({ data: linha(), error: null }))

    await transactionService.createTransaction({ titulo: "Aluguel", valor: 1500, tipo: "despesa" })

    expect(supabase.from).toHaveBeenCalledWith("transactions")
  })

  it("recusa sem sessao", async () => {
    supabase.auth.getSession.mockResolvedValue(semSessao)

    await expect(
      transactionService.createTransaction({ titulo: "X", valor: 10, tipo: "despesa" })
    ).rejects.toThrow("Usuário não autenticado.")
  })

  it("traduz o DTO para as colunas e usa o user_id da sessao", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)
    const builder = criarBuilder({ data: linha(), error: null })
    supabase.from.mockReturnValue(builder)

    await transactionService.createTransaction({
      titulo: "Aluguel",
      valor: 1500,
      tipo: "receita",
      categoria_id: 7,
      data_ocorrencia: "2026-09-01",
      descricao: "Setembro",
      metodo_pagamento: "cartao_credito"
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
    const builder = criarBuilder({ data: linha(), error: null })
    supabase.from.mockReturnValue(builder)

    await transactionService.createTransaction({ titulo: "Mercado", valor: 80, tipo: "despesa" })

    expect(builder.insert.mock.calls[0][0][0].type).toBe("expense")
  })

  it("limite do contrato: nao formata pt-BR, quem chama deve normalizar", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)
    const builder = criarBuilder({ data: linha(), error: null })
    supabase.from.mockReturnValue(builder)

    await transactionService.createTransaction({
      titulo: "Aluguel",
      valor: "1.234,56",
      tipo: "despesa"
    })

    expect(builder.insert.mock.calls[0][0][0].amount).toBe(1.234)
  })

  it("devolve o DTO em portugues, nao a linha crua", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)
    supabase.from.mockReturnValue(criarBuilder({ data: linha(), error: null }))

    const resultado = await transactionService.createTransaction({
      titulo: "Aluguel",
      valor: 1500,
      tipo: "despesa"
    })

    expect(resultado).toEqual(dto())
  })

  it("traduz 23503 em categoria inexistente", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)
    supabase.from.mockReturnValue(
      criarBuilder({ data: null, error: { code: "23503", message: "fk" } })
    )

    await expect(
      transactionService.createTransaction({ titulo: "X", valor: 10, tipo: "despesa" })
    ).rejects.toThrow("Categoria não encontrada.")
  })

  it("traduz qualquer outro erro", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)
    supabase.from.mockReturnValue(
      criarBuilder({ data: null, error: { code: "08006", message: "timeout" } })
    )

    await expect(
      transactionService.createTransaction({ titulo: "X", valor: 10, tipo: "despesa" })
    ).rejects.toThrow("Não foi possível criar a transação.")
  })
})

// Testes para o método updateTransaction do serviço de transação
describe("updateTransaction", () => {
  it("traduz o DTO para as colunas do update sem enviar user_id", async () => {
    const builder = criarBuilder({ data: linha({ title: "Novo" }), error: null })
    supabase.from.mockReturnValue(builder)

    await transactionService.updateTransaction({
      id: 1,
      titulo: "Novo",
      valor: 1500,
      tipo: "receita",
      categoria_id: 7,
      data_ocorrencia: "2026-09-01",
      descricao: "Setembro",
      metodo_pagamento: "cartao_credito"
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

  it("converte despesa em expense no update", async () => {
    const builder = criarBuilder({ data: linha(), error: null })
    supabase.from.mockReturnValue(builder)

    await transactionService.updateTransaction({
      id: 1,
      titulo: "Mercado",
      valor: 80,
      tipo: "despesa"
    })

    expect(builder.update.mock.calls[0][0].type).toBe("expense")
  })

  it("filtra pelo id e devolve o DTO", async () => {
    const builder = criarBuilder({ data: linha({ title: "Novo" }), error: null })
    supabase.from.mockReturnValue(builder)

    const resultado = await transactionService.updateTransaction({
      id: 1,
      titulo: "Novo",
      valor: 1500,
      tipo: "despesa"
    })

    expect(builder.eq).toHaveBeenCalledWith("id", 1)
    expect(resultado).toEqual(dto({ titulo: "Novo" }))
  })

  it("traduz 23503 em categoria inexistente", async () => {
    supabase.from.mockReturnValue(
      criarBuilder({ data: null, error: { code: "23503", message: "fk" } })
    )

    await expect(
      transactionService.updateTransaction({ id: 1, titulo: "X", valor: 10, tipo: "despesa" })
    ).rejects.toThrow("Categoria não encontrada.")
  })

  it("traduz qualquer outro erro", async () => {
    supabase.from.mockReturnValue(
      criarBuilder({ data: null, error: { code: "08006", message: "timeout" } })
    )

    await expect(
      transactionService.updateTransaction({ id: 1, titulo: "X", valor: 10, tipo: "despesa" })
    ).rejects.toThrow("Não foi possível atualizar a transação.")
  })
})

// Testes para o método deleteTransaction do serviço de transação
describe("deleteTransaction", () => {
  it("filtra pelo id e devolve true quando o banco aceita", async () => {
    const builder = criarBuilder({ error: null })
    supabase.from.mockReturnValue(builder)

    await expect(transactionService.deleteTransaction(1)).resolves.toBe(true)
    expect(builder.eq).toHaveBeenCalledWith("id", 1)
  })

  it("traduz qualquer erro", async () => {
    supabase.from.mockReturnValue(criarBuilder({ error: { code: "23503", message: "fk" } }))

    await expect(transactionService.deleteTransaction(1)).rejects.toThrow(
      "Não foi possível deletar a transação."
    )
  })
})
