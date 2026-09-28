jest.mock("../../infra/supabase", () => ({
  supabase: {
    // Mocka apenas métodos que authServices usa
    // SignOut não é usado ainda
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      getSession: jest.fn(),
      signOut: jest.fn()
    }
  }
}))

import { supabase } from "../../infra/supabase"
import { authService } from "../../services/authServices"

// Usuário fictício devolvido pelo Supabase Auth
const usuario = { id: "u1", email: "joao@email.com" }

// Resposta de fetch bem-sucedida. O serviço só lê "ok", então só isso é necessário
const respostaOk = { ok: true }

// Resposta de fetch com erro. O método "json" precisa ser função que devolve promessa
const respostaComErro = mensagem => ({
  ok: false,
  json: () => Promise.resolve({ message: mensagem })
})

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, "error").mockImplementation(() => {})
  // O fetch é mockado aqui para que todo teste já o tenha disponível
  jest.spyOn(global, "fetch").mockResolvedValue(respostaOk)
})

afterEach(() => {
  jest.restoreAllMocks()
})

// Testes para o método registerUser do serviço de autenticação
describe("registerUser", () => {
  it("cria a conta e devolve o usuario", async () => {
    supabase.auth.signUp.mockResolvedValue({ data: { user: usuario }, error: null })

    const resultado = await authService.registerUser({
      email: "joao@email.com",
      password: "senha123"
    })

    expect(resultado).toEqual(usuario)
  })

  it("envia o perfil para /api/createProfile com o id do usuario recem-criado", async () => {
    supabase.auth.signUp.mockResolvedValue({ data: { user: usuario }, error: null })

    await authService.registerUser({
      email: "joao@email.com",
      password: "senha123",
      nomeCompleto: "Joao Silva",
      dataNascimento: "1990-01-01",
      telefone: "11999999999"
    })

    // Verifica se o fetch foi chamado com a URL correta e o método POST
    const [, opcoes] = global.fetch.mock.calls[0]

    // Verifica se o corpo da requisição contém os dados corretos,
    // incluindo o id do usuário recem-criado
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/createProfile",
      expect.objectContaining({ method: "POST" })
    )
    expect(JSON.parse(opcoes.body)).toEqual({
      id: "u1",
      nome_completo: "Joao Silva",
      data_nascimento: "1990-01-01",
      telefone: "11999999999"
    })
  })

  it("traduz 'already registered' em e-mail ja cadastrado", async () => {
    supabase.auth.signUp.mockResolvedValue({
      data: null,
      error: { message: "User already registered" }
    })

    await expect(
      authService.registerUser({ email: "joao@email.com", password: "senha123" })
    ).rejects.toThrow("E-mail já cadastrado")
  })

  it("traduz qualquer outro erro de cadastro", async () => {
    supabase.auth.signUp.mockResolvedValue({ data: null, error: { message: "Password too weak" } })

    await expect(
      authService.registerUser({ email: "joao@email.com", password: "123" })
    ).rejects.toThrow("Erro ao registrar usuário. Verifique os dados e tente novamente")
  })

  it("traduz falha do /api/createProfile avisando que a conta foi criada", async () => {
    supabase.auth.signUp.mockResolvedValue({ data: { user: usuario }, error: null })
    global.fetch.mockResolvedValue(respostaComErro("sem token"))

    await expect(
      authService.registerUser({ email: "joao@email.com", password: "senha123" })
    ).rejects.toThrow("Conta criada, mas houve um problema ao salvar dados adicionais")
  })
})

// Testes para o método loginUser do serviço de autenticação
describe("loginUser", () => {
  it("devolve o usuario autenticado", async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({ data: { user: usuario }, error: null })

    const resultado = await authService.loginUser({ email: "joao@email.com", password: "senha123" })

    expect(resultado).toEqual(usuario)
  })

  it("traduz credenciais invalidas", async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: null,
      error: { message: "Invalid login credentials" }
    })

    await expect(
      authService.loginUser({ email: "joao@email.com", password: "errada" })
    ).rejects.toThrow("E-mail ou senha incorretos.")
  })

  it("traduz rate limit pelo status 429", async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: null,
      error: { message: "Too many requests", status: 429 }
    })

    await expect(
      authService.loginUser({ email: "joao@email.com", password: "senha123" })
    ).rejects.toThrow("Muitas tentativas. Aguarde um momento e tente novamente.")
  })

  it("traduz e-mail nao confirmado", async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: null,
      error: { message: "Email not confirmed", status: 400 }
    })

    await expect(
      authService.loginUser({ email: "joao@email.com", password: "senha123" })
    ).rejects.toThrow("Por favor, confirme seu e-mail antes de entrar.")
  })

  it("traduz erro desconhecido no generico", async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: null,
      error: { message: "connection failure", status: 500 }
    })

    await expect(
      authService.loginUser({ email: "joao@email.com", password: "senha123" })
    ).rejects.toThrow("Ocorreu um erro inesperado. Tente novamente mais tarde.")
  })
})

// Testes para o método getSession do serviço de autenticação
describe("getSession", () => {
  it("devolve a sessao atual", async () => {
    const sessao = { user: usuario, access_token: "token123" }
    supabase.auth.getSession.mockResolvedValue({ data: { session: sessao }, error: null })

    const resultado = await authService.getSession()

    expect(resultado).toEqual(sessao)
  })

  it("devolve null quando nao ha sessao", async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })

    const resultado = await authService.getSession()

    expect(resultado).toBeNull()
  })
})

// Testes para o método logoutUser do serviço de autenticação
describe("logoutUser", () => {
  it("encerra a sessao com sucesso", async () => {
    supabase.auth.signOut.mockResolvedValue({ error: null })

    // O método não devolve nada quando dá certo, só não lança
    await expect(authService.logoutUser()).resolves.toBeUndefined()
  })

  it("traduz falha ao encerrar a sessao", async () => {
    supabase.auth.signOut.mockResolvedValue({ error: { message: "network error" } })

    await expect(authService.logoutUser()).rejects.toThrow("Erro ao sair. Tente novamente.")
  })
})
