import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

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
  const {
    categories: catDefs = [{ name: "Food", type: "expense", color: "#FF0000" }],
    transactions: txDefs = [{ title: "Lunch", amount: 50, type: "expense" }]
  } = options

  // Clean existing test categories/transactions for this user first
  await admin.from("transactions").delete().eq("user_id", userId)
  await admin.from("categories").delete().eq("user_id", userId)

  const categories = await Promise.all(catDefs.map(c => createTestCategory(userId, c)))

  const transactions = await Promise.all(
    txDefs.map((t, i) => createTestTransaction(userId, categories[i % categories.length].id, t))
  )

  return { categories, transactions }
}

export async function cleanupTestData(userIds) {
  if (!userIds.length) return

  await admin.from("transactions").delete().in("user_id", userIds)
  await admin.from("categories").delete().in("user_id", userIds)
  await admin.from("profiles").delete().in("id", userIds)

  for (const userId of userIds) {
    await admin.auth.admin.deleteUser(userId)
  }
}

export async function getCategoriesByUser(userId) {
  const { data, error } = await admin
    .from("categories")
    .select("id,name,type,color")
    .eq("user_id", userId)
  if (error) throw error
  return data
}

export async function getTransactionsByUser(userId) {
  const { data, error } = await admin
    .from("transactions")
    .select("id,title,amount,type,category_id,occurred_on")
    .eq("user_id", userId)
  if (error) throw error
  return data
}
