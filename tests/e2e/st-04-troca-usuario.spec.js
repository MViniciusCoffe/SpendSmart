// ST-04 — Sair e entrar com outro usuário na mesma aba (docs/test-plan.md §2.3.1, US-005, RNF04)
// Regressão da #76: o baseService guardava a sessão em memória por 5 minutos, e o usuário que
// entrava depois na mesma aba via a lista vazia e tinha as escritas recusadas pelo RLS (403).
// Reproduz os passos do teste instrumental da P3 (2026-11-07).
//
// A aba nunca recarrega depois do primeiro login: um page.goto() criaria um JavaScript novo e
// zeraria a memória dos services, escondendo o defeito. Toda navegação é por clique.
const { test, expect } = require("@playwright/test")
const { adminClient, emailFor, deleteRunUsers, createAccount } = require("./support/env")
const { PASSWORD, login, logout, expectDashboard } = require("./support/pages")

const admin = adminClient()

const iara = { name: "Iara E2E", email: emailFor("iara"), password: PASSWORD }
const bruno = { name: "Bruno E2E", email: emailFor("bruno"), password: PASSWORD }

test.beforeAll(async () => {
  await createAccount(admin, iara)
  const usuario = await createAccount(admin, bruno)
  bruno.userId = usuario.id
  const { error } = await admin.from("categories").insert([
    { user_id: usuario.id, name: "Freelance", type: "income", color: "#22C55E" },
    { user_id: usuario.id, name: "Aluguel", type: "expense", color: "#EF4444" }
  ])
  if (error) throw error
})

test.afterAll(async () => {
  await deleteRunUsers(admin)
})

async function abrirCategoriasPeloMenu(page) {
  await page
    .getByRole("navigation", { name: "Navegação principal" })
    .getByRole("link", { name: "Categorias" })
    .click()
  await expect(page).toHaveURL(/\/categories$/)
  await expect(page.getByRole("heading", { name: "Categorias" })).toBeVisible()
}

test("o segundo usuário da aba vê e grava os próprios dados", async ({ page }) => {
  // Iara entra e abre as categorias: os services leem a sessão dela
  await login(page, iara)
  await expectDashboard(page)
  await abrirCategoriasPeloMenu(page)

  // Sai pelo Header, que leva a /login sem recarregar a página
  await logout(page)

  // Bruno entra pelo mesmo formulário, ainda no JavaScript carregado pela Iara
  await page.getByLabel("E-mail").fill(bruno.email)
  await page.getByLabel("Senha").fill(bruno.password)
  await page.getByRole("button", { name: "Entrar" }).click()
  await expectDashboard(page)
  await expect(page.getByRole("banner")).toContainText(bruno.name)

  // Leitura: a lista de edição traz as duas categorias do Bruno
  await abrirCategoriasPeloMenu(page)
  await page.getByRole("tab", { name: "Editar" }).click()
  await expect(page.getByText("Você ainda não tem categorias")).toHaveCount(0)
  await expect(page.getByLabel("Selecionar Categoria").locator("option")).toHaveText([
    "Selecione uma categoria",
    "Aluguel",
    "Freelance"
  ])

  // Escrita: a categoria nova é gravada no nome do Bruno (antes, o RLS respondia 403)
  await page.getByRole("tab", { name: "Adicionar" }).click()
  await page.getByLabel("Nome *").fill("Mercado")
  await page.getByLabel("Tipo *").selectOption("expense")
  await page.getByRole("button", { name: "Salvar Categoria" }).click()
  await expect(page.getByText("Categoria adicionada com sucesso")).toBeVisible()

  const { data, error } = await admin
    .from("categories")
    .select("name")
    .eq("user_id", bruno.userId)
    .eq("name", "Mercado")
  expect(error).toBeNull()
  expect(data).toHaveLength(1)
})

// #67: o AuthContext ouve o onAuthStateChange, então um logout feito em outra aba do mesmo
// navegador (que divide a sessão guardada) tira a primeira aba da área logada sem recarregar
test("sair em outra aba encerra a sessão nesta aba", async ({ page, context }) => {
  await login(page, iara)
  await expectDashboard(page)

  const outraAba = await context.newPage()
  await outraAba.goto("/dashboard")
  await expectDashboard(outraAba)
  await logout(outraAba)

  await page.bringToFront()
  await expect(page).toHaveURL(/\/login$/)
})
