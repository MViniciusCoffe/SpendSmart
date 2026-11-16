jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
    auth: { getSession: jest.fn(), updateUser: jest.fn() }
  }
}))

import { supabase } from "@/lib/supabase"
import { categoryService } from "@/services/categoryService"
import { transactionService } from "@/services/transactionService"
import { profileService } from "@/services/profileService"
import { criarBuilder, comSessao } from "../helpers/supabase"

// Regressão: com a internet fora do ar (ou o Supabase inacessível), a tela mostrava
// "FetchError: Failed to fetch", em inglês e falando de implementação. O postgrest-js devolve
// essas falhas de transporte como PostgrestError com code "" (conferido no pacote instalado, em
// toTransportFailure), e o withErrorHandling só traduzia erro com code preenchido.
// Encontrado por leitura de código em 2026-11-15, ao padronizar o profileService (#77).

const falhaDeRede = () => ({
  code: "",
  message: "FetchError: Failed to fetch",
  details: "",
  hint: ""
})

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, "error").mockImplementation(() => {})
  supabase.auth.getSession.mockResolvedValue(comSessao)
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe("Regressão: falha de rede não mostra o erro cru na tela", () => {
  it.each([
    [
      "categoryService.getCategories",
      () => categoryService.getCategories(),
      "Não foi possível carregar suas categorias."
    ],
    [
      "transactionService.getTransactions",
      () => transactionService.getTransactions(),
      "Não foi possível carregar suas transações."
    ],
    [
      "profileService.getProfile",
      () => profileService.getProfile(),
      "Não foi possível carregar os dados do perfil."
    ]
  ])("%s devolve a mensagem em português", async (_nome, chamar, mensagem) => {
    supabase.from.mockReturnValue(criarBuilder({ data: null, error: falhaDeRede() }))

    const erro = await chamar().catch(e => e)

    expect(erro.message).toBe(mensagem)
    expect(erro.message).not.toMatch(/FetchError/)
  })

  it("a escrita também traduz, em vez de vazar o texto do fetch", async () => {
    supabase.from.mockReturnValue(criarBuilder({ data: null, error: falhaDeRede() }))

    const erro = await categoryService
      .createCategory({ name: "Mercado", type: "expense" })
      .catch(e => e)

    expect(erro.message).toBe("Não foi possível criar a categoria.")
  })

  it("erro de validação continua chegando com a própria mensagem", async () => {
    const erro = await categoryService.createCategory({ name: "", type: "expense" }).catch(e => e)

    expect(erro.message).toMatch(/nome/i)
    expect(supabase.from).not.toHaveBeenCalled()
  })
})
