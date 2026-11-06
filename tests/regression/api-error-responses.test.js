// Regressão de dois defeitos de src/app/api/createProfile e deleteAccount (AGENTS.md §14.3, sem
// issue própria):
//
// 1. As duas rotas devolviam `error: error.message` no 500: a mensagem crua do Postgres ou do Auth
//    (nome de constraint, detalhe interno) chegava ao navegador.
// 2. createProfile lia `request.json()` fora do try: corpo que não era JSON virava erro não tratado.
//
// Também: token inválido respondia 500 ("erro interno"); agora responde 401.

jest.mock("@supabase/supabase-js", () => {
  const client = {
    auth: { getUser: jest.fn(), admin: { deleteUser: jest.fn() } },
    from: jest.fn()
  }
  return { createClient: jest.fn(() => client), __client: client }
})

const { __client: client } = require("@supabase/supabase-js")
const { POST: createProfile } = require("@/app/api/createProfile/route")
const { DELETE: deleteAccount } = require("@/app/api/deleteAccount/route")

const ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY"
]
const savedEnv = Object.fromEntries(ENV_KEYS.map(k => [k, process.env[k]]))

const MENSAGEM_INTERNA = 'duplicate key value violates unique constraint "profiles_pkey"'
const USUARIO = { id: "11111111-1111-1111-1111-111111111111" }

const requisicao = (method, body) =>
  new Request("https://app.test/api/x", {
    method,
    headers: { authorization: "Bearer token-valido" },
    body
  })

let insert

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, "error").mockImplementation(() => {})
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321"
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_teste"
  process.env.SUPABASE_SERVICE_ROLE_KEY = "chave-de-servico-de-teste"

  client.auth.getUser.mockResolvedValue({ data: { user: USUARIO }, error: null })
  client.auth.admin.deleteUser.mockResolvedValue({ error: null })
  insert = jest.fn().mockResolvedValue({ error: null })
  client.from.mockReturnValue({ insert })
})

afterEach(() => {
  for (const [key, value] of Object.entries(savedEnv)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
  jest.restoreAllMocks()
})

describe("Regressão — createProfile não vaza erro interno", () => {
  it("responde 500 só com a mensagem própria quando o insert falha", async () => {
    insert.mockResolvedValue({ error: { code: "23505", message: MENSAGEM_INTERNA } })

    const response = await createProfile(requisicao("POST", JSON.stringify({ full_name: "Ana" })))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({ message: "Erro ao criar perfil" })
    expect(JSON.stringify(body)).not.toContain("profiles_pkey")
    // O rollback da #25 continua: a conta sem perfil é apagada
    expect(client.auth.admin.deleteUser).toHaveBeenCalledWith(USUARIO.id)
  })

  it("responde 400 para corpo que não é JSON, sem tocar no banco", async () => {
    const response = await createProfile(requisicao("POST", "isto não é json"))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ message: "Corpo da requisição inválido" })
    expect(insert).not.toHaveBeenCalled()
  })

  it("responde 401 para token inválido, sem tocar no banco", async () => {
    client.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: "bad jwt" } })

    const response = await createProfile(requisicao("POST", JSON.stringify({ full_name: "Ana" })))

    expect(response.status).toBe(401)
    expect(insert).not.toHaveBeenCalled()
  })
})

describe("Regressão — deleteAccount não vaza erro interno", () => {
  it("responde 500 só com a mensagem própria quando o Auth falha", async () => {
    client.auth.admin.deleteUser.mockResolvedValue({
      error: { message: "Database error deleting user: violates foreign key constraint" }
    })

    const response = await deleteAccount(requisicao("DELETE"))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({ message: "Erro ao deletar conta" })
  })

  it("responde 401 para token inválido, sem excluir ninguém", async () => {
    client.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: "bad jwt" } })

    const response = await deleteAccount(requisicao("DELETE"))

    expect(response.status).toBe(401)
    expect(client.auth.admin.deleteUser).not.toHaveBeenCalled()
  })
})
