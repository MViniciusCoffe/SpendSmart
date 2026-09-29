jest.mock("../../infra/supabase", () => ({
  supabase: {
    from: jest.fn(),
    auth: { getSession: jest.fn() }
  }
}))

import { supabase } from "../../infra/supabase"
import { categoryService } from "../../services/categoryService"

// Simula o comportamento do Supabase para os métodos que usamos no serviço de categoria
const METODOS = ["select", "insert", "update", "delete", "eq", "order", "single"]

const criarBuilder = resultado => {
  const builder = {}
  // Na memória, ficaria tipo:
  // builder.select = jest.fn(() => builder)
  // builder.insert = jest.fn(() => builder)
  // builder.update = jest.fn(() => builder)
  // ...
  // Mas podemos fazer isso de forma dinâmica com um loop
  METODOS.forEach(metodo => {
    builder[metodo] = jest.fn(() => builder)
  })
  builder.then = (resolver, rejeitar) => Promise.resolve(resultado).then(resolver, rejeitar)
  return builder
}

// Função auxiliar para criar uma linha de categoria com valores padrão, podendo sobrescrever com overrides
const linha = (overrides = {}) => ({
  id: 1,
  name: "Alimentacao",
  type: "expense",
  description: "Mercado",
  color: "#FF0000",
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

// Descreve os testes para o serviço de categoria
describe("getCategories", () => {
  it("traduz income e expense para receita e despesa", async () => {
    // Configura o mock do Supabase para retornar duas categorias, uma de despesa e outra de receita
    supabase.from.mockReturnValue(
      // Cria um builder com os dados das categorias
      criarBuilder({
        data: [linha(), linha({ id: 2, name: "Salario", type: "income" })],
        error: null
      })
    )

    // Chama o serviço para obter as categorias
    const resultado = await categoryService.getCategories()

    // Verifica se o resultado traduz corretamente os tipos para português
    expect(resultado).toEqual([
      { id: 1, nome: "Alimentacao", tipo: "despesa", descricao: "Mercado", cor: "#FF0000" },
      { id: 2, nome: "Salario", tipo: "receita", descricao: "Mercado", cor: "#FF0000" }
    ])
  })

  // Verifica se a ordenação por nome crescente é aplicada corretamente
  // it significa "it should" e descreve o comportamento esperado do teste
  it("ordena por nome crescente", async () => {
    // Configura o mock do Supabase para retornar um builder vazio,
    // apenas para testar a chamada do método order
    const builder = criarBuilder({ data: [], error: null })
    supabase.from.mockReturnValue(builder)

    await categoryService.getCategories()

    // Verifica se o método order foi chamado com os parâmetros corretos
    expect(builder.order).toHaveBeenCalledWith("name", { ascending: true })
  })

  it("traduz o erro do banco em mensagem para o usuario", async () => {
    // Configura o mock do Supabase para simular um erro ao buscar categorias
    // Aqui, o builder chama o método then e retorna um objeto com data null e um erro com mensagem "refused"
    supabase.from.mockReturnValue(criarBuilder({ data: null, error: { message: "refused" } }))

    await expect(categoryService.getCategories()).rejects.toThrow(
      "Não foi possível carregar suas categorias."
    )
  })

  it("le da tabela categories", async () => {
    supabase.from.mockReturnValue(criarBuilder({ data: [], error: null }))

    await categoryService.getCategories()

    expect(supabase.from).toHaveBeenCalledWith("categories")
  })
})

// Testes para o método createCategory do serviço de categoria
describe("createCategory", () => {
  it("escreve na tabela categories", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)
    supabase.from.mockReturnValue(criarBuilder({ data: linha(), error: null }))

    await categoryService.createCategory({ nome: "Mercado", tipo: "despesa" })

    expect(supabase.from).toHaveBeenCalledWith("categories")
  })

  it("recusa sem sessao", async () => {
    supabase.auth.getSession.mockResolvedValue(semSessao)

    await expect(categoryService.createCategory({ nome: "X", tipo: "receita" })).rejects.toThrow(
      "Usuário não autenticado."
    )
  })

  it("traduz o DTO para as colunas e usa o user_id da sessao", async () => {
    // Configura o mock do Supabase para simular uma sessão de usuário autenticado
    supabase.auth.getSession.mockResolvedValue(comSessao)
    const builder = criarBuilder({ data: linha({ type: "income" }), error: null })
    supabase.from.mockReturnValue(builder)

    // Chama o serviço para criar uma nova categoria com os dados fornecidos
    await categoryService.createCategory({
      nome: "Salario",
      tipo: "receita",
      descricao: "Mensal",
      cor: "#00FF00"
    })

    // Verifica se o método insert do builder foi chamado com os dados corretos,
    // incluindo a tradução do tipo e o user_id da sessão
    expect(builder.insert).toHaveBeenCalledWith([
      {
        name: "Salario",
        type: "income",
        description: "Mensal",
        color: "#00FF00",
        user_id: "u1"
      }
    ])
  })

  it("devolve o DTO em portugues, nao a linha crua", async () => {
    // Configura o mock do Supabase para simular uma sessão de usuário autenticado
    supabase.auth.getSession.mockResolvedValue(comSessao)
    supabase.from.mockReturnValue(criarBuilder({ data: linha(), error: null }))

    const resultado = await categoryService.createCategory({ nome: "X", tipo: "despesa" })

    expect(resultado).toEqual({
      id: 1,
      nome: "Alimentacao",
      tipo: "despesa",
      descricao: "Mercado",
      cor: "#FF0000"
    })
  })

  it("traduz 23505 em conflito de nome", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)
    supabase.from.mockReturnValue(
      criarBuilder({ data: null, error: { code: "23505", message: "duplicate" } })
    )

    await expect(categoryService.createCategory({ nome: "X", tipo: "despesa" })).rejects.toThrow(
      "Categoria já existe. Escolha outro nome."
    )
  })

  it("traduz qualquer outro erro", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)
    supabase.from.mockReturnValue(
      criarBuilder({ data: null, error: { code: "08006", message: "timeout" } })
    )

    await expect(categoryService.createCategory({ nome: "X", tipo: "despesa" })).rejects.toThrow(
      "Não foi possível criar a categoria."
    )
  })

  it("converte despesa em expense na escrita", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)
    const builder = criarBuilder({ data: linha(), error: null })
    supabase.from.mockReturnValue(builder)

    await categoryService.createCategory({ nome: "Mercado", tipo: "despesa" })

    expect(builder.insert.mock.calls[0][0][0].type).toBe("expense")
  })
})

describe("updateCategory", () => {
  it("filtra pelo id e devolve o DTO", async () => {
    const builder = criarBuilder({ data: linha({ name: "Novo" }), error: null })
    supabase.from.mockReturnValue(builder)

    const resultado = await categoryService.updateCategory({
      id: 1,
      nome: "Novo",
      tipo: "despesa"
    })

    expect(builder.eq).toHaveBeenCalledWith("id", 1)
    expect(resultado.nome).toBe("Novo")
  })

  it("traduz 23505 em conflito de nome", async () => {
    supabase.from.mockReturnValue(
      criarBuilder({ data: null, error: { code: "23505", message: "duplicate" } })
    )

    await expect(
      categoryService.updateCategory({ id: 1, nome: "X", tipo: "despesa" })
    ).rejects.toThrow("Já existe outra categoria com este nome.")
  })

  it("traduz qualquer outro erro", async () => {
    supabase.from.mockReturnValue(
      criarBuilder({ data: null, error: { code: "08006", message: "timeout" } })
    )

    await expect(
      categoryService.updateCategory({ id: 1, nome: "X", tipo: "despesa" })
    ).rejects.toThrow("Não foi possível atualizar a categoria.")
  })

  it("traduz o DTO para as colunas do update", async () => {
    const builder = criarBuilder({ data: linha({ name: "Novo" }), error: null })
    supabase.from.mockReturnValue(builder)

    await categoryService.updateCategory({
      id: 1,
      nome: "Novo",
      tipo: "receita",
      descricao: "Mensal",
      cor: "#00FF00"
    })

    expect(builder.update).toHaveBeenCalledWith({
      name: "Novo",
      type: "income",
      description: "Mensal",
      color: "#00FF00"
    })
  })
})

describe("deleteCategory", () => {
  it("devolve true quando o banco aceita", async () => {
    const builder = criarBuilder({ error: null })
    supabase.from.mockReturnValue(builder)

    await expect(categoryService.deleteCategory(1)).resolves.toBe(true)
    expect(builder.eq).toHaveBeenCalledWith("id", 1)
  })

  it("traduz 23503 em categoria em uso", async () => {
    supabase.from.mockReturnValue(criarBuilder({ error: { code: "23503", message: "fk" } }))

    await expect(categoryService.deleteCategory(1)).rejects.toThrow(
      "Não é possível deletar esta categoria pois existem transações usando ela."
    )
  })

  it("traduz qualquer outro erro", async () => {
    supabase.from.mockReturnValue(criarBuilder({ error: { code: "08006", message: "timeout" } }))

    await expect(categoryService.deleteCategory(1)).rejects.toThrow(
      "Não foi possível deletar a categoria."
    )
  })
})
