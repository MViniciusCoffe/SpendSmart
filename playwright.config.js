// Testes de sistema (E2E) com Playwright: P3, docs/test-plan.md §2.3.1.
// Rodam só contra a aplicação local e o Supabase CLI local (tests/e2e/support/env.js confere).
const { defineConfig, devices } = require("@playwright/test")

// 3100 para não colidir com o `npm run dev` (3000)
const PORT = Number(process.env.E2E_PORT ?? 3100)
const baseURL = `http://localhost:${PORT}`
const isCI = Boolean(process.env.CI)

module.exports = defineConfig({
  testDir: "tests/e2e",
  testMatch: "**/*.spec.js",
  // Cada spec cria os próprios usuários; os testes de um arquivo dividem estado, então rodam em série
  fullyParallel: false,
  workers: 1,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  outputDir: "test-results",
  use: {
    baseURL,
    locale: "pt-BR",
    timezoneId: "America/Fortaleza",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Sempre contra o build de produção, o mesmo código que vai para a Vercel. Em `next dev`, o Fast
  // Refresh recarregava /login em laço (~27 vezes em 8 s, 2026-11-07), o que não acontece no build.
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `${baseURL}/api/health`,
    // Sem reaproveitar: um servidor antigo na porta rodaria um build desatualizado
    reuseExistingServer: false,
    timeout: 240_000,
    stdout: "ignore",
    stderr: "pipe"
  }
})
