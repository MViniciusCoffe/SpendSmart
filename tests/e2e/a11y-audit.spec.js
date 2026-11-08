// Auditoria de acessibilidade (P3, Passo 6; docs/test-plan.md §2.5) com @axe-core/playwright.
// Regras WCAG 2.0/2.1/2.2, níveis A e AA, nas telas do plano. O resultado completo de cada tela vai
// anexado ao relatório HTML do Playwright e resumido em test-results/a11y-<tela>.json.
const fs = require("fs")
const path = require("path")
const { test, expect } = require("@playwright/test")
const AxeBuilder = require("@axe-core/playwright").default
const { adminClient, emailFor, deleteRunUsers, findUsersByEmail } = require("./support/env")
const { register, login, expectDashboard } = require("./support/pages")

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"]

const admin = adminClient()
const conta = { name: "Bia A11y", email: emailFor("a11y") }

test.afterAll(async () => {
  await deleteRunUsers(admin)
})

async function audit(page, testInfo, tela) {
  // Em dev o Next.js pode recarregar a página na primeira compilação; analisa só com a tela parada
  await page.waitForLoadState("networkidle")
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  const resumo = results.violations.map(v => ({
    regra: v.id,
    impacto: v.impact,
    criterios: v.tags.filter(t => /^wcag\d{3,4}$/.test(t)),
    descricao: v.help,
    ocorrencias: v.nodes.length,
    alvos: v.nodes.slice(0, 5).map(n => n.target.join(" ")),
    detalhes: v.nodes.slice(0, 5).map(n => n.any.map(c => c.message).join("; "))
  }))
  await testInfo.attach(`axe-${tela}`, {
    body: JSON.stringify(results.violations, null, 2),
    contentType: "application/json"
  })
  fs.mkdirSync("test-results", { recursive: true })
  fs.writeFileSync(path.join("test-results", `a11y-${tela}.json`), JSON.stringify(resumo, null, 2))
  return resumo
}

const publicas = [
  ["login", "/login"],
  ["register", "/register"]
]

for (const [tela, rota] of publicas) {
  test(`tela ${rota} sem violações WCAG A/AA`, async ({ page }, testInfo) => {
    await page.goto(rota)
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    const violacoes = await audit(page, testInfo, tela)
    expect(violacoes).toEqual([])
  })
}

test.describe("telas privadas", () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    await register(page, conta)
    await expectDashboard(page)
    await page.close()

    // Dados para as telas não ficarem vazias: uma categoria de cada tipo e dois lançamentos
    const [usuario] = await findUsersByEmail(admin, conta.email)
    const { data: categorias } = await admin
      .from("categories")
      .insert([
        { user_id: usuario.id, name: "Salário", type: "income", color: "#22C55E" },
        { user_id: usuario.id, name: "Mercado", type: "expense", color: "#EF4444" }
      ])
      .select("id, type")
    const idDo = tipo => categorias.find(c => c.type === tipo).id
    await admin.from("transactions").insert([
      {
        user_id: usuario.id,
        category_id: idDo("income"),
        type: "income",
        amount: 3000,
        title: "Salário de outubro",
        occurred_on: "2026-10-05"
      },
      {
        user_id: usuario.id,
        category_id: idDo("expense"),
        type: "expense",
        amount: 245.9,
        title: "Compras do mês",
        occurred_on: "2026-10-12"
      }
    ])
  })

  for (const tela of ["dashboard", "transactions", "categories", "settings"]) {
    test(`tela /${tela} sem violações WCAG A/AA`, async ({ page }, testInfo) => {
      await login(page, { email: conta.email })
      await expectDashboard(page)
      await page.goto(`/${tela}`)
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
      const violacoes = await audit(page, testInfo, tela)
      expect(violacoes).toEqual([])
    })
  }
})
