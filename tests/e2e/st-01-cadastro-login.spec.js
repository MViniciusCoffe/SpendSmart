// ST-01 — Criar conta e entrar (P3, docs/test-plan.md §2.3.1)
// Rastreia US-001 (CA-001.01 a CA-001.04) e US-002 (CA-002.01, CA-002.02), docs/user-stories.md.
// Autor do script: Marcus; US-001 desenvolvida por José (regra de dupla verificação, §9).
const { test, expect } = require("@playwright/test")
const {
  adminClient,
  emailFor,
  findUsersByEmail,
  deleteRunUsers,
  createAccount
} = require("./support/env")
const { PASSWORD, appAlerts, register, login, logout, expectDashboard } = require("./support/pages")

const admin = adminClient()
// Cada teste usa a própria conta: todos rodam sozinhos e em qualquer ordem (no modo UI, um teste
// isolado não pode depender de outro ter cadastrado antes)
const conta = { name: "Ana E2E", email: emailFor("ana") }
const existente = { name: "Davi E2E", email: emailFor("davi"), password: PASSWORD }
const entrada = { name: "Lia E2E", email: emailFor("lia"), password: PASSWORD }

test.beforeAll(async () => {
  await createAccount(admin, existente)
  await createAccount(admin, entrada)
})

test.afterAll(async () => {
  await deleteRunUsers(admin)
})

test.describe("US-001 — Criar conta", () => {
  test("CA-001.01 e CA-001.04 — cadastro válido cria conta e perfil, sem erro na tela", async ({
    page
  }) => {
    const errosNoConsole = []
    page.on("console", msg => msg.type() === "error" && errosNoConsole.push(msg.text()))

    await register(page, conta)

    // CA-001.04: a tela seguinte carrega sem erro visível
    await expectDashboard(page)
    await expect(appAlerts(page)).toHaveCount(0)
    expect(errosNoConsole).toEqual([])

    // CA-001.01: a conta existe no Auth e o perfil foi gravado com o mesmo id
    const [usuario] = await findUsersByEmail(admin, conta.email)
    expect(usuario).toBeDefined()
    const { data: perfil, error } = await admin
      .from("profiles")
      .select("id, full_name, phone")
      .eq("id", usuario.id)
      .single()
    expect(error).toBeNull()
    expect(perfil).toEqual({ id: usuario.id, full_name: conta.name, phone: "84999998888" })
  })

  test("CA-001.02 — e-mail já cadastrado mostra a mensagem e não cria outra conta", async ({
    page
  }) => {
    // Conta que já existe (criada no beforeAll), não a do CA-001.01: o teste roda sozinho
    await register(page, { ...existente, name: "Outra Pessoa", password: "outra-senha-9" })

    const alerta = appAlerts(page)
    await expect(alerta).toContainText("E-mail já cadastrado")
    // Sem "Tente novamente" (repetir não resolve) e com o caminho para entrar (melhoria da P3)
    await expect(alerta).not.toContainText("Tente novamente")
    await expect(page).toHaveURL(/\/register$/)
    expect(await findUsersByEmail(admin, existente.email)).toHaveLength(1)

    await alerta.getByRole("link", { name: "Entrar com este e-mail" }).click()
    await expect(page).toHaveURL(/\/login$/)
  })

  test("CA-001.03 — senha curta é bloqueada no cliente, sem chamada ao Auth", async ({ page }) => {
    const email = emailFor("senha-curta")
    const chamadasDeCadastro = []
    page.on("request", req => req.url().includes("/auth/v1/signup") && chamadasDeCadastro.push(req))

    await register(page, { email, password: "12345" })

    // O navegador barra o envio (minLength=6) e a dica orienta o tamanho mínimo
    const senha = page.getByLabel("Senha")
    expect(await senha.evaluate(el => el.validity.tooShort)).toBe(true)
    await expect(page.getByText("Mínimo de 6 caracteres")).toBeVisible()
    await expect(page).toHaveURL(/\/register$/)
    expect(chamadasDeCadastro).toHaveLength(0)
    expect(await findUsersByEmail(admin, email)).toHaveLength(0)
  })
})

test.describe("US-002 — Entrar", () => {
  test("CA-002.01 — credenciais válidas levam ao dashboard (depois de sair)", async ({ page }) => {
    await login(page, { email: entrada.email, password: PASSWORD })
    await expectDashboard(page)

    await logout(page)
    await login(page, { email: entrada.email, password: PASSWORD })
    await expectDashboard(page)
  })

  test("CA-002.02 — senha errada e e-mail inexistente dão a mesma mensagem", async ({ page }) => {
    await login(page, { email: entrada.email, password: "senha-errada" })
    await expect(appAlerts(page)).toHaveText("E-mail ou senha incorretos.")

    // A mensagem não revela se o e-mail existe
    await login(page, { email: emailFor("nao-existe"), password: "senha-errada" })
    await expect(appAlerts(page)).toHaveText("E-mail ou senha incorretos.")
    await expect(page).toHaveURL(/\/login$/)
  })
})
