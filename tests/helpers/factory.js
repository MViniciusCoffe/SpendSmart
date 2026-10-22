import { createClient } from "@supabase/supabase-js"

function getAdminClient() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase env vars not loaded. Ensure setupEnv.js runs first.")
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
}

const defaultCategory = (overrides = {}) => ({
  name: "Test Category",
  type: "expense",
  color: "#FF0000",
  ...overrides
})

const defaultTransaction = (overrides = {}) => ({
  title: "Test Transaction",
  amount: 100,
  type: "expense",
  occurred_on: "2026-10-10",
  description: "",
  payment_method: "cartao_credito",
  ...overrides
})

export async function createTestUser(email, password = "123456") {
  const admin = getAdminClient()
  const { data: usersData } = await admin.auth.admin.listUsers()
  let user = usersData.users.find(u => u.email === email)

  if (!user) {
    const { data: created } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })
    user = created.user
  }
  return user
}

export async function createTestProfile(userId, overrides = {}) {
  const admin = getAdminClient()
  const { error } = await admin.from("profiles").upsert({
    id: userId,
    full_name: `User ${userId.slice(0, 8)}`,
    birth_date: "1990-01-01",
    phone: "11999999999",
    ...overrides
  })
  if (error) throw error
}

export async function createTestCategory(userId, overrides = {}) {
  const admin = getAdminClient()
  const cat = defaultCategory(overrides)
  const { data, error } = await admin
    .from("categories")
    .insert({ ...cat, user_id: userId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function createTestTransaction(userId, categoryId, overrides = {}) {
  const admin = getAdminClient()
  const tx = defaultTransaction(overrides)
  const { data, error } = await admin
    .from("transactions")
    .insert({ ...tx, user_id: userId, category_id: categoryId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function createTestScenario(userId, options = {}) {
  const admin = getAdminClient()
  const {
    categories: catDefs = [{ name: "Food", type: "expense", color: "#FF0000" }],
    transactions: txDefs = [{ title: "Lunch", amount: 50, type: "expense" }]
  } = options

  // Clean existing test categories/transactions for this user first
  await admin.from("transactions").delete().eq("user_id", userId)
  await admin.from("categories").delete().eq("user_id", userId)

  const categories = []
  for (const catDef of catDefs) {
    const cat = await createTestCategory(userId, catDef)
    categories.push(cat)
  }

  const transactions = []
  for (const txDef of txDefs) {
    const cat = categories.find(c => c.type === txDef.type)
    if (cat) {
      const tx = await createTestTransaction(userId, cat.id, txDef)
      transactions.push(tx)
    }
  }

  return { categories, transactions }
}

export async function cleanupTestData(userIds) {
  const admin = getAdminClient()
  const ids = Array.isArray(userIds) ? userIds : [userIds]

  for (const userId of ids) {
    await admin.from("transactions").delete().eq("user_id", userId)
    await admin.from("categories").delete().eq("user_id", userId)
    await admin.from("profiles").delete().eq("id", userId)
    await admin.auth.admin.deleteUser(userId)
  }
}

export async function getCategoriesByUser(userId) {
  const admin = getAdminClient()
  const { data, error } = await admin.from("categories").select("*").eq("user_id", userId)
  if (error) throw error
  return data
}

export async function getTransactionsByUser(userId) {
  const admin = getAdminClient()
  const { data, error } = await admin.from("transactions").select("*").eq("user_id", userId)
  if (error) throw error
  return data
}
