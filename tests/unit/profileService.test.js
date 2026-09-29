jest.mock("../../infra/supabase", () => ({
  supabase: {
    // Mocka apenas métodos que perfil usa
    auth: {
      getSession: jest.fn(),
      updateUser: jest.fn()
    },
    from: jest.fn()
  }
}))

import { supabase } from "../../infra/supabase"
import { profileService } from "../../services/profileService"

// Sessão fictícia devolvida pelo Supabase Auth
const sessao = { user: { id: "u1" }, access_token: "token123" }

// Sessão válida, com usuário autenticado
const comSessao = { data: { session: sessao }, error: null }

// Sessão válida, mas sem usuário autenticado
const semSessao = { data: { session: null }, error: null }

// Consulta da sessão que falha em vez de devolver sessão vazia
const sessaoComErro = { data: { session: null }, error: { message: "token expirado" } }

// Resposta de fetch bem-sucedida. Nesse caminho o método "json" não é chamado
const respostaOk = { ok: true }

// Resposta de fetch com erro. O método "json" precisa ser função que devolve promessa
const respostaComErro = mensagem => ({
  ok: false,
  json: () => Promise.resolve({ message: mensagem })
})

// Guarda as duas pontas da corrente de escrita no banco.
// O "from" devolve "update", que devolve "eq", que devolve a promessa final
let update
let eq

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, "error").mockImplementation(() => {})
  // O fetch é mockado aqui para que todo teste já o tenha disponível
  jest.spyOn(global, "fetch").mockResolvedValue(respostaOk)

  // Comportamento padrão: trocar a senha e gravar o perfil funcionam
  supabase.auth.updateUser.mockResolvedValue({ error: null })
  eq = jest.fn().mockResolvedValue({ error: null })
  update = jest.fn().mockReturnValue({ eq })
  supabase.from.mockReturnValue({ update })
})

afterEach(() => {
  jest.restoreAllMocks()
})

// Testes para o método updateProfile do serviço de perfil
describe("updateProfile", () => {
  it("atualiza todos os campos do perfil de uma vez", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)

    const resultado = await profileService.updateProfile({
      nome: "Joao Silva",
      dataNascimento: "1990-01-01",
      telefone: "11999999999"
    })

    expect(resultado).toBe(true)
    // O serviço traduz os nomes do formulário para os nomes das colunas do banco
    expect(update).toHaveBeenCalledWith({
      nome_completo: "Joao Silva",
      data_nascimento: "1990-01-01",
      telefone: "11999999999"
    })
    // E o filtro por usuário vem do id da sessão, nunca do que o formulário mandou
    expect(eq).toHaveBeenCalledWith("id", "u1")
  })

  it("atualiza a senha e não toca no banco quando não há dados de perfil", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)

    const resultado = await profileService.updateProfile({ senha: "novaSenha123" })

    expect(resultado).toBe(true)
    expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: "novaSenha123" })
    // Sem campos de perfil, a requisição à tabela profiles é desnecessária
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it("atualiza a senha e o perfil na mesma chamada", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)

    await profileService.updateProfile({ nome: "Joao Silva", senha: "novaSenha123" })

    expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: "novaSenha123" })
    expect(update).toHaveBeenCalledWith({ nome_completo: "Joao Silva" })
  })

  it("ignora os campos que o usuário deixou em branco", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)

    await profileService.updateProfile({ nome: "Joao Silva" })

    // Só o nome vai para o banco, data de nascimento e telefone ficam de fora
    expect(update).toHaveBeenCalledWith({ nome_completo: "Joao Silva" })
  })

  it("não chama nem a senha nem o banco quando nada vem preenchido", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)

    const resultado = await profileService.updateProfile({})

    expect(resultado).toBe(true)
    expect(supabase.auth.updateUser).not.toHaveBeenCalled()
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it("recusa quando não há sessão", async () => {
    supabase.auth.getSession.mockResolvedValue(semSessao)

    await expect(profileService.updateProfile({ nome: "Joao" })).rejects.toThrow(
      "Usuário não autenticado."
    )
  })

  it("recusa quando a consulta da sessão falha", async () => {
    supabase.auth.getSession.mockResolvedValue(sessaoComErro)

    await expect(profileService.updateProfile({ nome: "Joao" })).rejects.toThrow(
      "Usuário não autenticado."
    )
  })

  it("traduz falha ao trocar a senha e para antes de tocar no perfil", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)
    supabase.auth.updateUser.mockResolvedValue({ error: { message: "weak password" } })

    await expect(profileService.updateProfile({ nome: "Joao", senha: "123" })).rejects.toThrow(
      "Não foi possível atualizar a senha. A senha deve ter no mínimo 6 caracteres."
    )
    // A senha é o primeiro passo, então o perfil nem chega a ser gravado
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it("traduz falha ao gravar o perfil", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)
    eq.mockResolvedValue({ error: { message: "violates check constraint" } })

    await expect(profileService.updateProfile({ nome: "Joao" })).rejects.toThrow(
      "Não foi possível atualizar os dados do perfil."
    )
  })
})

// Testes para o método deleteAccount do serviço de perfil
describe("deleteAccount", () => {
  it("exclui a conta usando o token da sessão", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)

    const resultado = await profileService.deleteAccount()

    expect(resultado).toBe(true)
    // O token vai no cabeçalho, e não no corpo: é o que a rota interna valida
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/deleteAccount",
      expect.objectContaining({
        method: "DELETE",
        headers: { Authorization: "Bearer token123" }
      })
    )
  })

  it("recusa quando não há sessão", async () => {
    supabase.auth.getSession.mockResolvedValue(semSessao)

    await expect(profileService.deleteAccount()).rejects.toThrow("Usuário não autenticado.")
  })

  it("recusa quando a consulta da sessão falha", async () => {
    supabase.auth.getSession.mockResolvedValue(sessaoComErro)

    await expect(profileService.deleteAccount()).rejects.toThrow("Usuário não autenticado.")
  })

  it("repassa a mensagem que a rota devolveu", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)
    global.fetch.mockResolvedValue(respostaComErro("Falha ao remover as cascatas"))

    await expect(profileService.deleteAccount()).rejects.toThrow("Falha ao remover as cascatas")
  })

  it("usa a mensagem padrão quando a rota não manda nenhuma", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)
    global.fetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({})
    })

    await expect(profileService.deleteAccount()).rejects.toThrow(
      "Não foi possível excluir a conta."
    )
  })
})
