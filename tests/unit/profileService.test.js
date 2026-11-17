jest.mock("@/lib/supabase", () => ({
  supabase: {
    // Mocka apenas métodos que perfil usa
    auth: {
      getSession: jest.fn(),
      updateUser: jest.fn()
    },
    from: jest.fn(),
    rpc: jest.fn()
  }
}))

import { supabase } from "@/lib/supabase"
import { profileService } from "@/services/profileService"
import { criarBuilder } from "../helpers/supabase"

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

// Corrente de escrita no banco: update -> eq -> is, que resolve com o resultado
let escrita

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, "error").mockImplementation(() => {})
  // O fetch é mockado aqui para que todo teste já o tenha disponível
  jest.spyOn(global, "fetch").mockResolvedValue(respostaOk)

  // Comportamento padrão: trocar a senha e gravar o perfil funcionam
  supabase.auth.updateUser.mockResolvedValue({ error: null })
  escrita = criarBuilder({ error: null })
  supabase.from.mockReturnValue(escrita)
})

afterEach(() => {
  jest.restoreAllMocks()
})

// Testes para o método updateProfile do serviço de perfil
describe("updateProfile", () => {
  it("atualiza todos os campos do perfil de uma vez", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)

    const resultado = await profileService.updateProfile({
      full_name: "Joao Silva",
      birth_date: "1990-01-01",
      phone: "11999999999"
    })

    expect(resultado).toBe(true)
    expect(supabase.from).toHaveBeenCalledWith("profiles")
    // O serviço traduz os nomes do formulário para os nomes das colunas do banco
    expect(escrita.update).toHaveBeenCalledWith({
      full_name: "Joao Silva",
      birth_date: "1990-01-01",
      phone: "11999999999"
    })
    // E o filtro por usuário vem do id da sessão, nunca do que o formulário mandou
    expect(escrita.eq).toHaveBeenCalledWith("id", "u1")
    // Perfil excluído (soft delete) não é editado
    expect(escrita.is).toHaveBeenCalledWith("deleted_at", null)
  })

  it("atualiza a senha e não toca no banco quando não há dados de perfil", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)

    const resultado = await profileService.updateProfile({ password: "novaSenha123" })

    expect(resultado).toBe(true)
    expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: "novaSenha123" })
    // Sem campos de perfil, a requisição à tabela profiles é desnecessária
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it("atualiza a senha e o perfil na mesma chamada", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)

    await profileService.updateProfile({ full_name: "Joao Silva", password: "novaSenha123" })

    expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: "novaSenha123" })
    expect(escrita.update).toHaveBeenCalledWith({ full_name: "Joao Silva" })
  })

  it("ignora os campos que o usuário deixou em branco", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)

    await profileService.updateProfile({ full_name: "Joao Silva" })

    // Só o nome vai para o banco, data de nascimento e telefone ficam de fora
    expect(escrita.update).toHaveBeenCalledWith({ full_name: "Joao Silva" })
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

    await expect(profileService.updateProfile({ full_name: "Joao" })).rejects.toThrow(
      "Usuário não autenticado."
    )
  })

  it("recusa quando a consulta da sessão falha", async () => {
    supabase.auth.getSession.mockResolvedValue(sessaoComErro)

    await expect(profileService.updateProfile({ full_name: "Joao" })).rejects.toThrow(
      "Usuário não autenticado."
    )
  })

  it("recusa senha curta antes de chamar o Supabase e não toca no perfil", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)

    await expect(
      profileService.updateProfile({ full_name: "Joao", password: "123" })
    ).rejects.toThrow("Senha deve ter no mínimo 6 caracteres")
    expect(supabase.auth.updateUser).not.toHaveBeenCalled()
    expect(supabase.from).not.toHaveBeenCalled()
  })

  // Códigos reais do Supabase Auth (HTTP 422), conferidos no Supabase local
  it.each([
    ["same_password", "A nova senha deve ser diferente da atual."],
    ["weak_password", "Senha deve ter no mínimo 6 caracteres"],
    ["unexpected_failure", "Não foi possível atualizar a senha."],
    [undefined, "Não foi possível atualizar a senha."]
  ])(
    "traduz o erro %p do Supabase Auth e para antes de tocar no perfil",
    async (code, mensagem) => {
      supabase.auth.getSession.mockResolvedValue(comSessao)
      supabase.auth.updateUser.mockResolvedValue({ error: { code, message: "erro do Auth" } })

      await expect(
        profileService.updateProfile({ full_name: "Joao", password: "senha123" })
      ).rejects.toThrow(new Error(mensagem))
      // A senha é o primeiro passo, então o perfil nem chega a ser gravado
      expect(supabase.from).not.toHaveBeenCalled()
    }
  )

  it("traduz falha ao gravar o perfil", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)
    supabase.from.mockReturnValue(
      criarBuilder({ error: { code: "23514", message: "violates check constraint" } })
    )

    await expect(profileService.updateProfile({ full_name: "Joao" })).rejects.toThrow(
      "Não foi possível atualizar os dados do perfil."
    )
  })
})

describe("getProfile", () => {
  it("recusa sem sessao", async () => {
    supabase.auth.getSession.mockResolvedValue(semSessao)

    await expect(profileService.getProfile()).rejects.toThrow("Usuário não autenticado.")
  })

  it("recusa quando a consulta da sessão falha", async () => {
    supabase.auth.getSession.mockResolvedValue(sessaoComErro)

    await expect(profileService.getProfile()).rejects.toThrow("Usuário não autenticado.")
  })

  it("busca o perfil ativo pelo id da sessão e devolve o DTO", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)
    const linha = {
      id: "u1",
      full_name: "Joao Silva",
      birth_date: "1990-01-01",
      phone: "11999999999",
      created_at: "2026-10-01T00:00:00Z",
      updated_at: "2026-10-02T00:00:00Z",
      deleted_at: null,
      coluna_extra: "não sai do service"
    }
    const builder = criarBuilder({ data: linha, error: null })
    supabase.from.mockReturnValue(builder)

    const resultado = await profileService.getProfile()

    expect(supabase.from).toHaveBeenCalledWith("profiles")
    // Texto literal, não a constante: se a constante esvaziar, o teste tem de falhar
    expect(builder.select).toHaveBeenCalledWith(
      "id,full_name,birth_date,phone,created_at,updated_at,deleted_at"
    )
    expect(builder.eq).toHaveBeenCalledWith("id", "u1")
    expect(builder.is).toHaveBeenCalledWith("deleted_at", null)
    const { coluna_extra, ...dto } = linha
    expect(resultado).toEqual(dto)
  })

  it("devolve null quando não há perfil ativo", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)
    supabase.from.mockReturnValue(criarBuilder({ data: null, error: null }))

    await expect(profileService.getProfile()).resolves.toBeNull()
  })

  it("traduz erro do banco", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)
    supabase.from.mockReturnValue(
      criarBuilder({ data: null, error: { code: "08006", message: "timeout" } })
    )

    await expect(profileService.getProfile()).rejects.toThrow(
      "Não foi possível carregar os dados do perfil."
    )
  })
})

// Exclusão da própria conta pela RPC delete_own_account (#75): sem rota de API nem chave de serviço
describe("deleteAccount", () => {
  it("recusa sem sessão, sem chamar o banco", async () => {
    supabase.auth.getSession.mockResolvedValue(semSessao)

    await expect(profileService.deleteAccount()).rejects.toThrow("Usuário não autenticado.")
    expect(supabase.rpc).not.toHaveBeenCalled()
  })

  it("chama a RPC sem parâmetros: quem é excluído vem do token, nunca do cliente", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)
    supabase.rpc.mockResolvedValue({ data: null, error: null })

    await expect(profileService.deleteAccount()).resolves.toBe(true)
    expect(supabase.rpc).toHaveBeenCalledWith("delete_own_account")
  })

  it("traduz o erro do banco na mensagem própria", async () => {
    supabase.auth.getSession.mockResolvedValue(comSessao)
    supabase.rpc.mockResolvedValue({
      data: null,
      error: { code: "42501", message: "permission denied for function delete_own_account" }
    })

    await expect(profileService.deleteAccount()).rejects.toThrow(
      "Não foi possível excluir a conta."
    )
  })
})
