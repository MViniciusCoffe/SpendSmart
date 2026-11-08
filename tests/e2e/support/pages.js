// Ações de tela reaproveitadas pelos fluxos. Seletores por papel e rótulo acessível (o que o usuário
// e o leitor de tela enxergam), não por classe CSS.
const { expect } = require("@playwright/test")

const PASSWORD = "senha-e2e-123"

// Mensagens de erro do app. O Next.js tem o próprio role="alert" (o anunciador de rota, que lê o
// título da página nova para o leitor de tela), e ele não é erro: fica de fora.
const appAlerts = page => page.locator('[role="alert"]:not(#__next-route-announcer__)')

async function register(
  page,
  {
    name = "Pessoa E2E",
    email,
    password = PASSWORD,
    birthDate = "1998-05-20",
    phone = "84999998888"
  }
) {
  await page.goto("/register")
  // O botão nasce desabilitado no HTML e só habilita quando o React (já hidratado) recebe os campos:
  // o click() espera ele habilitar, então o envio nunca acontece antes da hidratação
  await expect(page.getByRole("button", { name: "Criar conta" })).toBeVisible()
  // Formulário novo não mostra caixa de erro (achado do teste instrumental: um alerta vazio aparecia)
  await expect(appAlerts(page)).toHaveCount(0)
  await page.getByLabel("Nome completo").fill(name)
  await page.getByLabel("E-mail").fill(email)
  await page.getByLabel("Senha").fill(password)
  await page.getByLabel("Data de nascimento").fill(birthDate)
  await page.getByLabel("Telefone").fill(phone)
  await page.getByRole("button", { name: "Criar conta" }).click()
}

async function login(page, { email, password = PASSWORD }) {
  await page.goto("/login")
  await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible()
  await page.getByLabel("E-mail").fill(email)
  await page.getByLabel("Senha").fill(password)
  await page.getByRole("button", { name: "Entrar" }).click()
}

async function expectDashboard(page) {
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible()
}

async function logout(page) {
  await page.getByRole("button", { name: "Sair", exact: true }).first().click()
  await expect(page).toHaveURL(/\/login$/)
}

module.exports = { PASSWORD, appAlerts, register, login, logout, expectDashboard }
