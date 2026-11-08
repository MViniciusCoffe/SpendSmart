// ST-02 — Registrar e consultar despesa (P3, docs/test-plan.md §2.3.1)
// Rastreia US-013 (CA-013.01 a CA-013.04), docs/user-stories.md.
// Autor do script: José; US-013 desenvolvida por Marcus (regra de dupla verificação, §9).
const { test, expect } = require("@playwright/test")
const { adminClient, emailFor, deleteRunUsers, createAccount } = require("./support/env")
const { PASSWORD, appAlerts, login, expectDashboard } = require("./support/pages")

const admin = adminClient()

// Uma conta e uma categoria de despesa por teste: cada teste roda sozinho e em qualquer ordem.
// O RUN_ID de support/env.js é por processo, então o modo --fully-parallel também isola as contas.
const cenarios = {
  registro: { name: "Nina E2E", email: emailFor("nina"), password: PASSWORD, categoria: "Mercado" },
  validacao: {
    name: "Otto E2E",
    email: emailFor("otto"),
    password: PASSWORD,
    categoria: "Transporte"
  },
  detalhe: { name: "Rita E2E", email: emailFor("rita"), password: PASSWORD, categoria: "Farmácia" },
  formatacao: {
    name: "Sofia E2E",
    email: emailFor("sofia"),
    password: PASSWORD,
    categoria: "Eletrônicos"
  }
}

async function prepararCenario(cenario) {
  const usuario = await createAccount(admin, cenario)
  const { data, error } = await admin
    .from("categories")
    .insert({
      user_id: usuario.id,
      name: cenario.categoria,
      type: "expense",
      color: "#EF4444"
    })
    .select("id")
    .single()
  if (error) throw error
  cenario.userId = usuario.id
  cenario.categoryId = data.id
}

async function limparCenario(cenario) {
  if (cenario.userId) await admin.auth.admin.deleteUser(cenario.userId)
}

test.afterAll(async () => {
  await deleteRunUsers(admin)
})

async function abrirFormularioDeDespesa(page, cenario) {
  await login(page, { email: cenario.email, password: PASSWORD })
  await expectDashboard(page)
  await page.goto("/transactions")
  await expect(page.getByRole("heading", { name: "Transações" })).toBeVisible()
  await page.getByRole("tab", { name: "Adicionar Transação" }).click()
  await expect(page.getByRole("tabpanel")).toBeVisible()
}

async function preencherDespesa(
  page,
  cenario,
  { valor, titulo, data = "2026-10-20", pagamento = "pix" }
) {
  await page.getByLabel("Categoria *").selectOption(String(cenario.categoryId))
  await page.getByLabel("Valor *").fill(valor)
  await page.getByLabel("Data *").fill(data)
  await page.getByLabel("Título *").fill(titulo)
  await page.getByLabel("Forma de Pagamento").selectOption(pagamento)
}

async function salvarDespesa(page) {
  await page.getByRole("button", { name: "Salvar Transação" }).click()
  await expect(page.getByText("Transação adicionada com sucesso")).toBeVisible()
}

test.describe("US-013 — CA-013.01: registro válido", () => {
  const cenario = cenarios.registro

  test.beforeAll(async () => {
    await prepararCenario(cenario)
  })

  test.afterAll(async () => {
    await limparCenario(cenario)
  })

  test("despesa válida aparece na listagem e recalcula saídas e saldo", async ({ page }) => {
    await abrirFormularioDeDespesa(page, cenario)
    await preencherDespesa(page, cenario, { valor: "87,40", titulo: "Compra do mês" })
    await salvarDespesa(page)

    // CA-013.01: categoria, valor, título, data e forma de pagamento na listagem
    const linha = page.getByRole("row", { name: /Compra do mês/ })
    await expect(linha).toContainText(cenario.categoria)
    await expect(linha).toContainText(/R\$\s*87,40/)
    await expect(linha).toContainText("20/10/2026")
    await expect(linha).toContainText("PIX")

    const { data, error } = await admin
      .from("transactions")
      .select("title, amount, type, occurred_on, payment_method")
      .eq("user_id", cenario.userId)
    expect(error).toBeNull()
    expect(data).toHaveLength(1)
    expect(data[0]).toMatchObject({
      title: "Compra do mês",
      type: "expense",
      occurred_on: "2026-10-20",
      payment_method: "pix"
    })
    expect(Number(data[0].amount)).toBeCloseTo(87.4, 2)

    // Gherkin: o total de saídas e o saldo são recalculados no dashboard
    await page.goto("/dashboard")
    await expectDashboard(page)
    const totalDeDespesas = page.getByRole("heading", { name: "Total de Despesas" }).locator("..")
    const saldoAtual = page.getByRole("heading", { name: "Saldo Atual" }).locator("..")
    await expect(totalDeDespesas).toContainText(/R\$\s*87,40/)
    await expect(saldoAtual).toContainText(/-R\$\s*87,40/)
  })
})

test.describe("US-013 — CA-013.02: valor inválido", () => {
  const cenario = cenarios.validacao

  test.beforeAll(async () => {
    await prepararCenario(cenario)
  })

  test.afterAll(async () => {
    await limparCenario(cenario)
  })

  test("valor vazio, não numérico ou negativo é bloqueado sem gravar", async ({ page }) => {
    const chamadas = []
    page.on("request", req => {
      if (req.method() === "POST" && req.url().includes("/rest/v1/transactions")) {
        chamadas.push(req.url())
      }
    })

    await abrirFormularioDeDespesa(page, cenario)
    await page.getByLabel("Categoria *").selectOption(String(cenario.categoryId))
    await page.getByLabel("Data *").fill("2026-10-20")
    await page.getByLabel("Título *").fill("Tentativa inválida")
    await page.getByLabel("Forma de Pagamento").selectOption("pix")

    // A tela usa noValidate e o campo Valor é type="text": a restrição nativa (el.validity)
    // não acusa nada. O bloqueio do CA-013.02 é feito pelo validador do TransactionForm; o
    // teste confere o efeito exigido: envio bloqueado, nenhuma chamada REST e nada persistido.
    const casos = [
      { valor: "", erro: "Valor é obrigatório" },
      { valor: "abc", erro: "Valor inválido" },
      { valor: "-10", erro: "Valor deve ser maior que 0" }
    ]

    for (const caso of casos) {
      await page.getByLabel("Valor *").fill(caso.valor)
      await page.getByRole("button", { name: "Salvar Transação" }).click()
      await expect(page.getByText(caso.erro)).toBeVisible()
      await expect(appAlerts(page)).toContainText(
        "Por favor, corrija os erros acima antes de enviar"
      )
      await expect(page).toHaveURL(/\/transactions$/)
    }

    expect(chamadas).toHaveLength(0)
    const { data, error } = await admin
      .from("transactions")
      .select("id")
      .eq("user_id", cenario.userId)
    expect(error).toBeNull()
    expect(data).toHaveLength(0)
  })
})

test.describe("US-013 — CA-013.03: detalhe da despesa", () => {
  const cenario = cenarios.detalhe

  test.beforeAll(async () => {
    await prepararCenario(cenario)
  })

  test.afterAll(async () => {
    await limparCenario(cenario)
  })

  test("detalhe mostra data e forma de pagamento preenchidas", async ({ page }) => {
    await abrirFormularioDeDespesa(page, cenario)
    await preencherDespesa(page, cenario, {
      valor: "45,90",
      titulo: "Remédio",
      data: "2026-10-18",
      pagamento: "debit_card"
    })
    await salvarDespesa(page)

    const linha = page.getByRole("row", { name: /Remédio/ })
    await expect(linha).toContainText("18/10/2026")
    await expect(linha).toContainText("Cartão de Débito")

    // O detalhe é a aba de edição, aberta ao selecionar a linha e clicar em Editar
    await page.getByRole("gridcell", { name: "Remédio" }).click()
    await page.getByRole("button", { name: "Editar" }).click()
    await expect(page.getByRole("tab", { name: "Atualizar Transação" })).toBeVisible()
    await expect(page.getByLabel("Data *")).toHaveValue("2026-10-18")
    await expect(page.getByLabel("Forma de Pagamento")).toHaveValue("debit_card")
    expect(
      await page
        .getByLabel("Forma de Pagamento")
        .evaluate(el => el.selectedOptions[0]?.textContent.trim())
    ).toBe("Cartão de Débito")
  })
})

test.describe("US-013 — CA-013.04: formatação monetária", () => {
  const cenario = cenarios.formatacao

  test.beforeAll(async () => {
    await prepararCenario(cenario)
  })

  test.afterAll(async () => {
    await limparCenario(cenario)
  })

  test("valor 1234,5 aparece como R$ 1.234,50", async ({ page }) => {
    await abrirFormularioDeDespesa(page, cenario)
    await preencherDespesa(page, cenario, { valor: "1234,5", titulo: "Compra grande" })
    await salvarDespesa(page)

    // O Intl usa espaço especial (NBSP) depois do R$; o regex cobre espaço normal e NBSP
    const linha = page.getByRole("row", { name: /Compra grande/ })
    await expect(linha).toContainText(/R\$\s*1\.234,50/)

    await page.goto("/dashboard")
    await expectDashboard(page)
    const totalDeDespesas = page.getByRole("heading", { name: "Total de Despesas" }).locator("..")
    await expect(totalDeDespesas).toContainText(/R\$\s*1\.234,50/)
  })
})
