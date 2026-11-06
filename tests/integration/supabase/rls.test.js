const { createClient } = require("@supabase/supabase-js")
const {
  createTestUser,
  createTestProfile,
  createTestScenario,
  createTestCategory,
  createTestTransaction,
  cleanupTestData,
  deleteTestRows,
  getCategoriesByUser,
  getTransactionsByUser
} = require("../../helpers/factory")
const { assertLocalSupabase } = require("../../helpers/localSupabase")

// IT-01 (leitura) e IT-02 (escrita): isolamento entre dois usuários pelo RLS real.
//
// Regras desta suíte (issue #66):
//   - Leitura compara o conjunto exato de linhas esperado. `data.every(...)` sozinho é verdadeiro
//     para lista vazia: se o RLS escondesse tudo, ou o cenário não fosse criado, o teste passaria.
//   - Nenhuma consulta de isolamento filtra pelo próprio usuário: o filtro faria o teste passar
//     mesmo sem RLS. Quem restringe as linhas tem de ser o banco.
//   - Os testes de invasão atacam uma linha "vítima" criada só para eles e removida no afterEach.
//     Se o RLS falhar, o estrago fica nessa linha e não contamina o cenário dos outros testes.

assertLocalSupabase()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

const TEST_RUN_ID = Date.now().toString(36)
const TEST_USER_1 = { email: `rls-user1-${TEST_RUN_ID}@test.local`, password: "123456" }
const TEST_USER_2 = { email: `rls-user2-${TEST_RUN_ID}@test.local`, password: "123456" }

let supabase1, supabase2
let user1Id, user2Id
let scenario1, scenario2

const sortedTitles = rows => rows.map(r => r.title ?? r.name).sort()

// Linhas criadas por um teste de invasão (ou por um insert indevido que o RLS deixasse passar)
const created = { transactions: [], categories: [] }

beforeAll(async () => {
  const u1 = await createTestUser(TEST_USER_1.email, TEST_USER_1.password)
  const u2 = await createTestUser(TEST_USER_2.email, TEST_USER_2.password)
  user1Id = u1.id
  user2Id = u2.id

  supabase1 = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
  supabase2 = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)

  for (const [client, user] of [
    [supabase1, TEST_USER_1],
    [supabase2, TEST_USER_2]
  ]) {
    const { error } = await client.auth.signInWithPassword(user)
    if (error) throw error
  }

  await createTestProfile(user1Id, { full_name: "RLS User 1" })
  await createTestProfile(user2Id, { full_name: "RLS User 2" })

  scenario1 = await createTestScenario(user1Id, {
    categories: [
      { name: "Food", type: "expense", color: "#FF0000" },
      { name: "Salary", type: "income", color: "#00FF00" }
    ],
    transactions: [
      { title: "Lunch", amount: 50, type: "expense", occurred_on: "2026-10-01" },
      { title: "Salary", amount: 1000, type: "income", occurred_on: "2026-10-01" }
    ]
  })

  scenario2 = await createTestScenario(user2Id, {
    categories: [{ name: "Transport", type: "expense", color: "#0000FF" }],
    transactions: [{ title: "Bus", amount: 20, type: "expense", occurred_on: "2026-10-01" }]
  })

  // Sem isto, um cenário incompleto faria os testes de leitura compararem listas erradas
  expect(scenario1.transactions).toHaveLength(2)
  expect(scenario2.transactions).toHaveLength(1)
}, 30000)

afterEach(async () => {
  await deleteTestRows("transactions", created.transactions.splice(0))
  await deleteTestRows("categories", created.categories.splice(0))
})

afterAll(async () => {
  await cleanupTestData([user1Id, user2Id])
})

describe("RLS - Isolation between users (Supabase real)", () => {
  describe("Categories", () => {
    it("user1 sees exactly their own categories", async () => {
      const { data, error } = await supabase1.from("categories").select("name, user_id")
      expect(error).toBeNull()
      expect(sortedTitles(data)).toEqual(["Food", "Salary"])
      expect(data.every(c => c.user_id === user1Id)).toBe(true)
    })

    it("user2 sees exactly their own categories", async () => {
      const { data, error } = await supabase2.from("categories").select("name, user_id")
      expect(error).toBeNull()
      expect(sortedTitles(data)).toEqual(["Transport"])
      expect(data.every(c => c.user_id === user2Id)).toBe(true)
    })

    it("user1 cannot insert category for user2", async () => {
      const { data, error } = await supabase1
        .from("categories")
        .insert({ user_id: user2Id, name: "Invasion", type: "expense", color: "#FF0000" })
        .select("id")
      if (data) created.categories.push(...data.map(r => r.id))

      expect(error).not.toBeNull()
      expect(error.code).toBe("42501")
    })

    it("user1 cannot update user2 category", async () => {
      const victim = await createTestCategory(user2Id, { name: `Victim ${TEST_RUN_ID}` })
      created.categories.push(victim.id)

      const { data, error } = await supabase1
        .from("categories")
        .update({ name: "Hack" })
        .eq("id", victim.id)
        .select("id")

      expect(error).toBeNull()
      expect(data).toEqual([])
      const after = (await getCategoriesByUser(user2Id)).find(c => c.id === victim.id)
      expect(after.name).toBe(victim.name)
    })

    it("user1 cannot delete user2 category", async () => {
      const victim = await createTestCategory(user2Id, { name: `Victim ${TEST_RUN_ID}` })
      created.categories.push(victim.id)

      const { data, error } = await supabase1
        .from("categories")
        .delete()
        .eq("id", victim.id)
        .select("id")

      expect(error).toBeNull()
      expect(data).toEqual([])
      const after = (await getCategoriesByUser(user2Id)).find(c => c.id === victim.id)
      expect(after).toBeDefined()
    })
  })

  describe("Transactions", () => {
    it("user1 sees exactly their own transactions", async () => {
      const { data, error } = await supabase1.from("transactions").select("title, user_id")
      expect(error).toBeNull()
      expect(sortedTitles(data)).toEqual(["Lunch", "Salary"])
      expect(data.every(t => t.user_id === user1Id)).toBe(true)
    })

    it("user2 sees exactly their own transactions", async () => {
      const { data, error } = await supabase2.from("transactions").select("title, user_id")
      expect(error).toBeNull()
      expect(sortedTitles(data)).toEqual(["Bus"])
      expect(data.every(t => t.user_id === user2Id)).toBe(true)
    })

    it("user1 cannot insert transaction for user2", async () => {
      const { data, error } = await supabase1
        .from("transactions")
        .insert({
          user_id: user2Id,
          category_id: scenario1.categories[0].id,
          type: "expense",
          amount: 100,
          title: "Attempt",
          occurred_on: "2026-10-10"
        })
        .select("id")
      if (data) created.transactions.push(...data.map(r => r.id))

      expect(error).not.toBeNull()
      expect(error.code).toBe("42501")
    })

    it("user1 cannot update user2 transaction", async () => {
      const victim = await createTestTransaction(user2Id, scenario2.categories[0].id, {
        title: `Victim ${TEST_RUN_ID}`,
        amount: 30
      })
      created.transactions.push(victim.id)

      const { data, error } = await supabase1
        .from("transactions")
        .update({ amount: 9999 })
        .eq("id", victim.id)
        .select("id")

      expect(error).toBeNull()
      expect(data).toEqual([])
      const after = (await getTransactionsByUser(user2Id)).find(t => t.id === victim.id)
      expect(Number(after.amount)).toBe(30)
    })

    it("user1 cannot delete user2 transaction", async () => {
      const victim = await createTestTransaction(user2Id, scenario2.categories[0].id, {
        title: `Victim ${TEST_RUN_ID}`
      })
      created.transactions.push(victim.id)

      const { data, error } = await supabase1
        .from("transactions")
        .delete()
        .eq("id", victim.id)
        .select("id")

      expect(error).toBeNull()
      expect(data).toEqual([])
      const after = (await getTransactionsByUser(user2Id)).find(t => t.id === victim.id)
      expect(after).toBeDefined()
    })
  })

  describe("Profiles", () => {
    it("user1 sees exactly one profile, their own, without filtering", async () => {
      const { data, error } = await supabase1.from("profiles").select("id, full_name")
      expect(error).toBeNull()
      expect(data).toEqual([{ id: user1Id, full_name: "RLS User 1" }])
    })

    it("user1 does NOT see user2 profile even when asking for it", async () => {
      const { data, error } = await supabase1.from("profiles").select("id").eq("id", user2Id)
      expect(error).toBeNull()
      expect(data).toEqual([])
    })
  })
})
