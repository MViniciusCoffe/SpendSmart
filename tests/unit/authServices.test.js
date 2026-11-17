jest.mock("@/lib/supabase", () => ({
  supabase: {
    // Mocka apenas os métodos de auth que authServices usa
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      getSession: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn()
    }
  }
}))

import { supabase } from "@/lib/supabase"
import { authService } from "@/services/authServices"

// Usuário fictício devolvido pelo Supabase Auth
const usuario = { id: "u1", email: "joao@email.com" }

// signUp bem-sucedido com sessão aberta (confirmação de e-mail desligada)
const cadastroOk = { data: { user: usuario, session: { access_token: "token123" } }, error: null }

// Dados válidos do formulário de cadastro
const cadastro = {
  email: "joao@email.com",
  password: "senha123",
  full_name: "Joao Silva",
  birth_date: "1990-01-01",
  phone: "11999999999"
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, "error").mockImplementation(() => {})
  supabase.auth.signUp.mockResolvedValue(cadastroOk)
})

afterEach(() => {
  jest.restoreAllMocks()
})

// Testes para o método registerUser do serviço de autenticação. O perfil é criado pelo trigger do
// banco a partir dos metadados do signUp (#75), então não há segunda chamada depois do cadastro
describe("registerUser", () => {
  it("cria a conta e devolve o usuario", async () => {
    await expect(authService.registerUser(cadastro)).resolves.toEqual(usuario)
  })

  it("envia o perfil validado nos metadados do signUp", async () => {
    await authService.registerUser({
      ...cadastro,
      full_name: "  Joao Silva  ",
      phone: "(11) 99999-9999"
    })

    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: "joao@email.com",
      password: "senha123",
      options: {
        data: { full_name: "Joao Silva", birth_date: "1990-01-01", phone: "11999999999" }
      }
    })
  })

  it("omite data de nascimento e telefone vazios, que o trigger grava como null", async () => {
    await authService.registerUser({ ...cadastro, birth_date: "", phone: "" })

    const [{ options }] = supabase.auth.signUp.mock.calls[0]
    expect(options.data).toEqual({
      full_name: "Joao Silva",
      birth_date: undefined,
      phone: undefined
    })
  })

  it("envia o e-mail normalizado ao signUp", async () => {
    await authService.registerUser({ ...cadastro, email: "  Joao@Email.com " })

    const [{ email, password }] = supabase.auth.signUp.mock.calls[0]
    expect(email).toBe("joao@email.com")
    expect(password).toBe("senha123")
  })

  it.each([
    ["e-mail inválido", { email: "joao@" }, "E-mail inválido"],
    ["senha curta", { password: "12345" }, "Senha deve ter no mínimo 6 caracteres"],
    ["nome vazio", { full_name: "  " }, "Nome é obrigatório"],
    ["telefone inválido", { phone: "abc" }, "Telefone inválido"],
    ["idade fora da faixa", { birth_date: "2025-01-01" }, "Idade deve ser entre 13 e 120 anos"]
  ])("recusa %s antes do signUp", async (_caso, campo, mensagem) => {
    await expect(authService.registerUser({ ...cadastro, ...campo })).rejects.toThrow(mensagem)
    expect(supabase.auth.signUp).not.toHaveBeenCalled()
  })

  it("traduz 'already registered' em e-mail ja cadastrado", async () => {
    supabase.auth.signUp.mockResolvedValue({
      data: null,
      error: { message: "User already registered" }
    })

    await expect(authService.registerUser(cadastro)).rejects.toThrow("E-mail já cadastrado")
    // Caso esperado, com mensagem própria: sem ruído no console (#82)
    expect(console.error).not.toHaveBeenCalled()
  })

  it("traduz a falha do trigger de perfil no erro genérico, sem a mensagem do banco", async () => {
    supabase.auth.signUp.mockResolvedValue({
      data: null,
      error: { message: "Database error saving new user", status: 500 }
    })

    await expect(authService.registerUser(cadastro)).rejects.toThrow(
      "Erro ao registrar usuário. Verifique os dados e tente novamente"
    )
    expect(console.error).toHaveBeenCalledWith(
      "[Supabase Register Error]",
      "Database error saving new user"
    )
  })

  it("avisa que a sessão não abriu quando o signUp não devolve sessão (confirmação de e-mail)", async () => {
    supabase.auth.signUp.mockResolvedValue({ data: { user: usuario, session: null }, error: null })

    await expect(authService.registerUser(cadastro)).rejects.toThrow(
      "Sessão não iniciada após cadastro."
    )
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
// Inscrição nas mudanças de sessão usada pelo AuthContext (#67)
describe("onAuthChange", () => {
  it("repassa evento e sessão ao callback", () => {
    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } }
    })
    const callback = jest.fn()

    authService.onAuthChange(callback)
    const [ouvinte] = supabase.auth.onAuthStateChange.mock.calls[0]
    ouvinte("SIGNED_OUT", null)

    expect(callback).toHaveBeenCalledWith("SIGNED_OUT", null)
  })

  it("devolve a função que cancela a inscrição", () => {
    const unsubscribe = jest.fn()
    supabase.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe } } })

    const cancelar = authService.onAuthChange(jest.fn())
    expect(unsubscribe).not.toHaveBeenCalled()
    cancelar()

    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })
})

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

// Argumentos enviados ao Supabase Auth (testes de mutação, #60)
describe("argumentos enviados pelo authService", () => {
  it("loginUser repassa e-mail e senha ao signInWithPassword", async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({ data: { user: usuario }, error: null })

    await authService.loginUser({ email: "joao@email.com", password: "senha123" })

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "joao@email.com",
      password: "senha123"
    })
  })

  it("loginUser não registra no console o erro que tem mensagem amigável", async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: null,
      error: { message: "Invalid login credentials" }
    })
    await expect(
      authService.loginUser({ email: "joao@email.com", password: "errada" })
    ).rejects.toThrow()
    expect(console.error).not.toHaveBeenCalled()
  })

  it("loginUser registra no console o erro sem mensagem amigável específica", async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: null,
      error: { message: "connection failure", status: 500 }
    })
    await expect(
      authService.loginUser({ email: "joao@email.com", password: "senha123" })
    ).rejects.toThrow()
    expect(console.error).toHaveBeenCalledWith("[Supabase Login Error]:", "connection failure")
  })
})
