const { createClient } = require("@supabase/supabase-js")
const {
  createTestUser,
  createTestScenario,
  cleanupTestData,
  getCategoriesByUser,
  getTransactionsByUser
} = require("../../helpers/factory")
const { assertLocalSupabase } = require("../../helpers/localSupabase")

// Ciclo de vida da conta sem a chave de serviço na aplicação (#75), contra o Supabase local real
// (IT-03, IT-08 e IT-09 do docs/test-plan.md):
//   - cadastro: o trigger on_auth_user_created cria o perfil na mesma transação do usuário do Auth.
//     Regressão da #25: perfil que falha não deixa conta órfã no Auth;
//   - exclusão: a RPC delete_own_account apaga só a conta do próprio token, com perfil, categorias e
//     transações (ON DELETE CASCADE), e não alcança a conta de outro usuário.
//
// A chave secreta só aparece aqui para conferir o estado do banco por fora do RLS; o que está sob
// teste usa a chave pública, como o navegador.

assertLocalSupabase()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

const RUN_ID = Date.now().toString(36)
const emailFor = name => `account-${name}-${RUN_ID}@test.local`

const publicClient = () =>
  createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } })
const admin = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
})

const findAuthUser = async email => {
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (error) throw error
  return data.users.find(user => user.email === email) ?? null
}

const profileOf = async id => {
  const { data, error } = await admin
    .from("profiles")
    .select("id, full_name, birth_date, phone")
    .eq("id", id)
  if (error) throw error
  return data
}

// Usuários que sobrarem se um teste falhar no meio
const toCleanup = []

afterAll(async () => {
  const existing = []
  for (const email of toCleanup) {
    const user = await findAuthUser(email)
    if (user) existing.push(user.id)
  }
  if (existing.length) await cleanupTestData(existing)
})

describe("cadastro com perfil criado pelo banco (#75)", () => {
  it("cria usuário do Auth e perfil numa operação só, com os metadados do signUp", async () => {
    const email = emailFor("signup")
    toCleanup.push(email)
    const client = publicClient()

    const { data, error } = await client.auth.signUp({
      email,
      password: "123456",
      options: { data: { full_name: "Ana Souza", birth_date: "1990-02-03", phone: "84999998888" } }
    })

    expect(error).toBeNull()
    expect(await profileOf(data.user.id)).toEqual([
      { id: data.user.id, full_name: "Ana Souza", birth_date: "1990-02-03", phone: "84999998888" }
    ])
  })

  it("aceita data de nascimento e telefone ausentes", async () => {
    const email = emailFor("optional")
    toCleanup.push(email)

    const { data, error } = await publicClient().auth.signUp({
      email,
      password: "123456",
      options: { data: { full_name: "Sem Opcionais" } }
    })

    expect(error).toBeNull()
    expect(await profileOf(data.user.id)).toEqual([
      { id: data.user.id, full_name: "Sem Opcionais", birth_date: null, phone: null }
    ])
  })

  // Regressão da #25: antes o perfil era um segundo passo, e a falha dele deixava a conta no Auth
  it.each([
    ["sem full_name", "no-name", {}],
    ["com full_name em branco", "blank-name", { full_name: "   " }],
    ["com data de nascimento inválida", "bad-date", { full_name: "Data", birth_date: "31/02/1990" }]
  ])("recusa o cadastro %s sem deixar usuário no Auth", async (_caso, slug, metadata) => {
    const email = emailFor(slug)
    toCleanup.push(email)

    const { error } = await publicClient().auth.signUp({
      email,
      password: "123456",
      options: { data: metadata }
    })

    expect(error).not.toBeNull()
    expect(await findAuthUser(email)).toBeNull()
  })
})

describe("exclusão da própria conta pela RPC delete_own_account (#75)", () => {
  let owner, other, ownerClient

  beforeEach(async () => {
    // Um par novo por teste: o primeiro teste apaga o dono
    const suffix = toCleanup.length
    const ownerEmail = emailFor(`owner-${suffix}`)
    const otherEmail = emailFor(`other-${suffix}`)
    toCleanup.push(ownerEmail, otherEmail)

    owner = await createTestUser(ownerEmail)
    other = await createTestUser(otherEmail)
    await createTestScenario(owner.id)
    await createTestScenario(other.id)

    ownerClient = publicClient()
    const { error } = await ownerClient.auth.signInWithPassword({
      email: ownerEmail,
      password: "123456"
    })
    if (error) throw error
  })

  it("apaga Auth, perfil, categorias e transações da conta logada", async () => {
    expect(await getTransactionsByUser(owner.id)).toHaveLength(1)

    const { error } = await ownerClient.rpc("delete_own_account")

    expect(error).toBeNull()
    expect((await admin.auth.admin.getUserById(owner.id)).data.user).toBeNull()
    expect(await profileOf(owner.id)).toEqual([])
    expect(await getCategoriesByUser(owner.id)).toEqual([])
    expect(await getTransactionsByUser(owner.id)).toEqual([])
  })

  it("não toca na conta de outro usuário", async () => {
    await ownerClient.rpc("delete_own_account")

    expect((await admin.auth.admin.getUserById(other.id)).data.user?.id).toBe(other.id)
    expect(await profileOf(other.id)).toHaveLength(1)
    expect(await getCategoriesByUser(other.id)).toHaveLength(1)
    expect(await getTransactionsByUser(other.id)).toHaveLength(1)
  })

  it("recusa a chamada sem login (anon sem EXECUTE)", async () => {
    const { error } = await publicClient().rpc("delete_own_account")

    expect(error?.code).toBe("42501")
    expect((await admin.auth.admin.getUserById(owner.id)).data.user?.id).toBe(owner.id)
  })
})

// Privilégios de profiles para quem está logado (#75): o perfil nasce do trigger e só some com a
// conta, então sobram SELECT e UPDATE nas colunas da tela de configurações. Sem isso o usuário podia
// apagar ou "excluir" (deleted_at) o próprio perfil e ficar com conta sem perfil.
describe("privilégios do usuário logado em profiles (#75)", () => {
  let user, client

  beforeAll(async () => {
    const email = emailFor("grants")
    toCleanup.push(email)
    user = await createTestUser(email)
    client = publicClient()
    const { error } = await client.auth.signInWithPassword({ email, password: "123456" })
    if (error) throw error
  })

  it("edita nome, data de nascimento e telefone", async () => {
    const { error } = await client
      .from("profiles")
      .update({ full_name: "Nome Novo", birth_date: "1991-04-05", phone: "84911112222" })
      .eq("id", user.id)

    expect(error).toBeNull()
    expect(await profileOf(user.id)).toEqual([
      { id: user.id, full_name: "Nome Novo", birth_date: "1991-04-05", phone: "84911112222" }
    ])
  })

  it.each([
    ["insere outro perfil", c => c.from("profiles").insert({ id: user.id, full_name: "Outro" })],
    ["apaga o próprio perfil", c => c.from("profiles").delete().eq("id", user.id)],
    [
      "marca o próprio perfil como excluído",
      c => c.from("profiles").update({ deleted_at: new Date().toISOString() }).eq("id", user.id)
    ]
  ])("não %s (42501)", async (_caso, write) => {
    const { error } = await write(client)

    expect(error?.code).toBe("42501")
    const [profile] = await profileOf(user.id)
    expect(profile?.id).toBe(user.id)
  })
})
