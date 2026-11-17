// US-004 — Excluir minha conta pela tela de configurações (CA-004.01 e CA-004.02).
// Desde a #75 a exclusão não passa mais pela rota /api/deleteAccount com a chave secreta: a página
// chama o AuthContext, que chama a RPC delete_own_account() pelo profileService. Este teste cobre o
// caminho da interface; a cascata e o isolamento entre contas também estão em
// tests/integration/supabase/account.test.js (IT-03, IT-09).
const { test, expect } = require("@playwright/test")
const { adminClient, emailFor, deleteRunUsers, createAccount } = require("./support/env")
const { PASSWORD, login, expectDashboard } = require("./support/pages")

const admin = adminClient()

const carla = { name: "Carla E2E", email: emailFor("carla"), password: PASSWORD }

test.beforeAll(async () => {
  const usuario = await createAccount(admin, carla)
  carla.userId = usuario.id
  const { error } = await admin
    .from("categories")
    .insert({ user_id: usuario.id, name: "Mercado", type: "expense", color: "#EF4444" })
  if (error) throw error
})

test.afterAll(async () => {
  await deleteRunUsers(admin)
})

test("CA-004.01 e CA-004.02 — excluir a conta confirma, sai e apaga os dados", async ({ page }) => {
  await login(page, carla)
  await expectDashboard(page)

  await page.goto("/settings")
  await page.getByRole("button", { name: "Excluir Conta" }).click()
  await page.getByRole("button", { name: "Excluir Minha Conta" }).click()

  await expect(page.getByText("Conta excluída com sucesso.")).toBeVisible()
  await expect(page).toHaveURL(/\/login$/)

  // A sessão também saiu: a área logada manda de volta para o login
  await page.goto("/dashboard")
  await expect(page).toHaveURL(/\/login$/)

  // Usuário do Auth, perfil e categoria apagados (ON DELETE CASCADE)
  const { data: authUser } = await admin.auth.admin.getUserById(carla.userId)
  expect(authUser.user).toBeNull()
  const { data: perfis } = await admin.from("profiles").select("id").eq("id", carla.userId)
  expect(perfis).toEqual([])
  const { data: categorias } = await admin
    .from("categories")
    .select("id")
    .eq("user_id", carla.userId)
  expect(categorias).toEqual([])
})
