jest.mock("../../infra/supabase", () => ({
  supabase: {
    from: jest.fn(),
    auth: { getSession: jest.fn() }
  }
}))

import { supabase } from "../../infra/supabase"
import { categoryService } from "../../services/categoryService"
import { criarBuilder, linhaCategoria, semSessao, comSessao } from "../helpers/supabase"

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
  it("recusa sem sessao", async () => {
    supabase.auth.getSession.mockResolvedValue(semSessao)

    await expect(categoryService.getCategories()).rejects.toThrow("Usuário não autenticado.")
  })

  // CA-007.01: a leitura não pode depender apenas do RLS — o service filtra pelo
  // user_id da sessão (mesmo padrão do createCategory).
  it("filtra as categorias pelo user_id da sessao", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)
    const builder = criarBuilder({ data: [], error: null })
    supabase.from.mockReturnValue(builder)

    await categoryService.getCategories()

    expect(builder.eq).toHaveBeenCalledWith("user_id", "u1")
  })

  it("devolve lista vazia quando o usuario nao tem categorias", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)
    supabase.from.mockReturnValue(criarBuilder({ data: [], error: null }))

    await expect(categoryService.getCategories()).resolves.toEqual([])
  })

  it("traduz income e expense para receita e despesa", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)

    // Configura o mock do Supabase para retornar duas categorias, uma de despesa e outra de receita
    supabase.auth.getSession.mockResolvedValue(comSessao)
    supabase.from.mockReturnValue(
      // Cria um builder com os dados das categorias
      criarBuilder({
        data: [linhaCategoria(), linhaCategoria({ id: 2, name: "Salario", type: "income" })],
        error: null
      })
    )

    // Chama o serviço para obter as categorias
    const resultado = await categoryService.getCategories()

    // Verifica se o resultado traduz corretamente os tipos para inglês
    expect(resultado).toEqual([
      {
        id: 1,
        name: "Alimentacao",
        type: "expense",
        description: "Mercado",
        color: "#FF0000",
        deleted_at: null
      },
      {
        id: 2,
        name: "Salario",
        type: "income",
        description: "Mercado",
        color: "#FF0000",
        deleted_at: null
      }
    ])
  })

  // Verifica se a ordenação por nome crescente é aplicada corretamente
  // it significa "it should" e descreve o comportamento esperado do teste
  it("ordena por nome crescente", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)

    // Configura o mock do Supabase para retornar um builder vazio,
    // apenas para testar a chamada do método order
    supabase.auth.getSession.mockResolvedValue(comSessao)
    const builder = criarBuilder({ data: [], error: null })
    supabase.from.mockReturnValue(builder)

    await categoryService.getCategories()

    // Verifica se o método order foi chamado com os parâmetros corretos
    expect(builder.order).toHaveBeenCalledWith("name", { ascending: true })
  })

  it("traduz o erro do banco em mensagem para o usuario", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)

    // Configura o mock do Supabase para simular um erro ao buscar categorias
    // Aqui, o builder chama o método then e retorna um objeto com data null e um erro com mensagem "refused"
    supabase.auth.getSession.mockResolvedValue(comSessao)
    supabase.from.mockReturnValue(criarBuilder({ data: null, error: { message: "refused" } }))

    await expect(categoryService.getCategories()).rejects.toThrow(
      "Não foi possível carregar suas categorias."
    )
  })

  it("le da tabela categories", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)

    supabase.from.mockReturnValue(criarBuilder({ data: [], error: null }))

    await categoryService.getCategories()

    expect(supabase.from).toHaveBeenCalledWith("categories")
  })
})

// Testes para o método createCategory do serviço de categoria
describe("createCategory", () => {
  it("escreve na tabela categories", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)
    supabase.from.mockReturnValue(criarBuilder({ data: linhaCategoria(), error: null }))

    await categoryService.createCategory({ name: "Mercado", type: "expense" })

    expect(supabase.from).toHaveBeenCalledWith("categories")
  })

  it("recusa sem sessao", async () => {
    supabase.auth.getSession.mockResolvedValue(semSessao)

    await expect(categoryService.createCategory({ name: "X", type: "income" })).rejects.toThrow(
      "Usuário não autenticado."
    )
  })

  it("traduz o DTO para as colunas e usa o user_id da sessao", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)
    const builder = criarBuilder({ data: linhaCategoria({ type: "income" }), error: null })
    supabase.from.mockReturnValue(builder)

    await categoryService.createCategory({
      name: "Salario",
      type: "income",
      description: "Mensal",
      color: "#00FF00"
    })

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

  it("devolve o DTO em ingles, nao a linha crua", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)
    supabase.from.mockReturnValue(criarBuilder({ data: linhaCategoria(), error: null }))

    const resultado = await categoryService.createCategory({ name: "X", type: "expense" })

    expect(resultado).toEqual({
      id: 1,
      name: "Alimentacao",
      type: "expense",
      description: "Mercado",
      color: "#FF0000",
      deleted_at: null
    })
  })

  it("traduz 23505 em conflito de nome", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)
    supabase.from.mockReturnValue(
      criarBuilder({ data: null, error: { code: "23505", message: "duplicate" } })
    )

    await expect(categoryService.createCategory({ name: "X", type: "expense" })).rejects.toThrow(
      "Categoria já existe. Escolha outro nome."
    )
  })

  it("traduz qualquer outro erro", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)
    supabase.from.mockReturnValue(
      criarBuilder({ data: null, error: { code: "08006", message: "timeout" } })
    )

    await expect(categoryService.createCategory({ name: "X", type: "expense" })).rejects.toThrow(
      "Não foi possível criar a categoria."
    )
  })
})

describe("updateCategory", () => {
  it("recusa sem sessao", async () => {
    supabase.auth.getSession.mockResolvedValue(semSessao)

    await expect(
      categoryService.updateCategory({ id: 1, name: "X", type: "expense" })
    ).rejects.toThrow("Usuário não autenticado.")
  })

  it("filtra pelo id e devolve o DTO", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)

    const builder = criarBuilder({ data: linhaCategoria({ name: "Novo" }), error: null })
    supabase.from.mockReturnValue(builder)

    const resultado = await categoryService.updateCategory({
      id: 1,
      name: "Novo",
      type: "expense"
    })

    expect(builder.eq).toHaveBeenCalledWith("id", 1)
    expect(resultado.name).toBe("Novo")
  })

  it("traduz 23505 em conflito de nome", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)

    supabase.from.mockReturnValue(
      criarBuilder({ data: null, error: { code: "23505", message: "duplicate" } })
    )

    await expect(
      categoryService.updateCategory({ id: 1, name: "X", type: "expense" })
    ).rejects.toThrow("Já existe outra categoria com este nome.")
  })

  it("traduz qualquer outro erro", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)

    supabase.from.mockReturnValue(
      criarBuilder({ data: null, error: { code: "08006", message: "timeout" } })
    )

    await expect(
      categoryService.updateCategory({ id: 1, name: "X", type: "expense" })
    ).rejects.toThrow("Não foi possível atualizar a categoria.")
  })

  it("traduz o DTO para as colunas do update", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)

    const builder = criarBuilder({ data: linhaCategoria({ name: "Novo" }), error: null })
    supabase.from.mockReturnValue(builder)

    await categoryService.updateCategory({
      id: 1,
      name: "Novo",
      type: "income",
      description: "Mensal",
      color: "#00FF00"
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
  it("recusa sem sessao", async () => {
    supabase.auth.getSession.mockResolvedValue(semSessao)

    await expect(categoryService.deleteCategory(1)).rejects.toThrow("Usuário não autenticado.")
  })

  it("devolve true quando o banco aceita", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)

    const builder = criarBuilder({ error: null })
    supabase.from.mockReturnValue(builder)

    await expect(categoryService.deleteCategory(1)).resolves.toBe(true)
    expect(builder.eq).toHaveBeenCalledWith("id", 1)
  })

  it("traduz 23503 em categoria em uso", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)

    supabase.from.mockReturnValue(criarBuilder({ error: { code: "23503", message: "fk" } }))

    await expect(categoryService.deleteCategory(1)).rejects.toThrow(
      "Não é possível deletar esta categoria pois existem transações usando ela."
    )
  })

  it("traduz qualquer outro erro", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)

    supabase.from.mockReturnValue(criarBuilder({ error: { code: "08006", message: "timeout" } }))

    await expect(categoryService.deleteCategory(1)).rejects.toThrow(
      "Não foi possível deletar a categoria."
    )
  })
})
