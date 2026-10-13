const { createClient } = require("@supabase/supabase-js")
const {
  createTestUser,
  createTestProfile,
  createTestScenario,
  cleanupTestData,
  getCategoriesByUser,
  getTransactionsByUser
} = require("../../helpers/factory")

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  const missing = []
  if (!SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL")
  if (!SUPABASE_PUBLISHABLE_KEY) missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
  if (!SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY")
  throw new Error(
    `Variáveis de ambiente do Supabase não configuradas: ${missing.join(", ")}. Execute: supabase start`
  )
}

const TEST_USER_1 = { email: "rls-user1@test.local", password: "123456" }
const TEST_USER_2 = { email: "rls-user2@test.local", password: "123456" }

let supabase1, supabase2
let user1Id, user2Id

beforeAll(async () => {
  // Create/get test users
  const u1 = await createTestUser(TEST_USER_1.email, TEST_USER_1.password)
  const u2 = await createTestUser(TEST_USER_2.email, TEST_USER_2.password)

  user1Id = u1.id
  user2Id = u2.id

  // Create authenticated clients
  supabase1 = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
  supabase2 = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)

  await supabase1.auth.signInWithPassword(TEST_USER_1)
  await supabase2.auth.signInWithPassword(TEST_USER_2)

  // Create profiles
  await createTestProfile(user1Id, { full_name: "RLS User 1" })
  await createTestProfile(user2Id, { full_name: "RLS User 2" })

  // Create test scenarios with factory
  await createTestScenario(user1Id, {
    categories: [
      { name: "Food", type: "expense", color: "#FF0000" },
      { name: "Salary", type: "income", color: "#00FF00" }
    ],
    transactions: [
      { title: "Lunch", amount: 50, type: "expense", occurred_on: "2026-10-01" },
      { title: "Salary", amount: 1000, type: "income", occurred_on: "2026-10-01" }
    ]
  })

  await createTestScenario(user2Id, {
    categories: [{ name: "Transport", type: "expense", color: "#0000FF" }],
    transactions: [{ title: "Bus", amount: 20, type: "expense", occurred_on: "2026-10-01" }]
  })
}, 30000)

afterAll(async () => {
  await cleanupTestData([user1Id, user2Id])
})

describe("RLS - Isolation between users (Supabase real)", () => {
  describe("Categories", () => {
    it("user1 sees only their categories", async () => {
      const { data, error } = await supabase1.from("categories").select("*")
      expect(error).toBeNull()
      expect(data.every(c => c.user_id === user1Id)).toBe(true)
    })

    it("user2 sees only their categories", async () => {
      const { data, error } = await supabase2.from("categories").select("*")
      expect(error).toBeNull()
      expect(data.every(c => c.user_id === user2Id)).toBe(true)
    })

    it("user1 cannot insert category for user2", async () => {
      const { error } = await supabase1.from("categories").insert({
        user_id: user2Id,
        name: "Invasion",
        type: "expense",
        color: "#FF0000"
      })
      expect(error).not.toBeNull()
      expect(error.code).toBe("42501")
    })

    it("user1 cannot update user2 category", async () => {
      const { data: cats } = await supabase2.from("categories").select("id, name").limit(1)
      const catId = cats[0].id
      const originalName = cats[0].name

      await supabase1.from("categories").update({ name: "Hack" }).eq("id", catId)

      const { data: after } = await supabase2.from("categories").select("name").eq("id", catId)
      expect(after[0].name).toBe(originalName)
    })

    it("user1 cannot delete user2 category", async () => {
      const { data: cats } = await supabase2.from("categories").select("id").limit(1)
      const catId = cats[0].id

      await supabase1.from("categories").delete().eq("id", catId)

      const { data: after } = await supabase2.from("categories").select("id").eq("id", catId)
      expect(after.length).toBe(1)
    })
  })

  describe("Transactions", () => {
    it("user1 sees only their transactions", async () => {
      const { data, error } = await supabase1.from("transactions").select("*")
      expect(error).toBeNull()
      expect(data.every(t => t.user_id === user1Id)).toBe(true)
    })

    it("user2 sees only their transactions", async () => {
      const { data, error } = await supabase2.from("transactions").select("*")
      expect(error).toBeNull()
      expect(data.every(t => t.user_id === user2Id)).toBe(true)
    })

    it("user1 cannot insert transaction for user2", async () => {
      const { data: cats } = await supabase1.from("categories").select("id").limit(1)
      const { error } = await supabase1.from("transactions").insert({
        user_id: user2Id,
        category_id: cats[0].id,
        type: "expense",
        amount: 100,
        title: "Attempt",
        occurred_on: "2026-10-10"
      })
      expect(error).not.toBeNull()
      expect(error.code).toBe("42501")
    })

    it("user1 cannot update user2 transaction", async () => {
      const { data: trans } = await supabase2.from("transactions").select("id, amount").limit(1)
      const transId = trans[0].id
      const originalAmount = trans[0].amount

      await supabase1.from("transactions").update({ amount: 9999 }).eq("id", transId)

      const { data: after } = await supabase2
        .from("transactions")
        .select("amount")
        .eq("id", transId)
      expect(after[0].amount).toBe(originalAmount)
    })

    it("user1 cannot delete user2 transaction", async () => {
      const { data: trans } = await supabase2.from("transactions").select("id").limit(1)
      const transId = trans[0].id

      await supabase1.from("transactions").delete().eq("id", transId)

      const { data: after } = await supabase2.from("transactions").select("id").eq("id", transId)
      expect(after.length).toBe(1)
    })
  })

  describe("Profiles", () => {
    it("user1 sees only their profile", async () => {
      const { data, error } = await supabase1.from("profiles").select("*").eq("id", user1Id)
      expect(error).toBeNull()
      expect(data.length).toBe(1)
    })

    it("user1 does NOT see user2 profile", async () => {
      const { data, error } = await supabase1.from("profiles").select("*").eq("id", user2Id)
      expect(error).toBeNull()
      expect(data.length).toBe(0)
    })
  })
})
