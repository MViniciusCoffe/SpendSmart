// /health — checagem de prontidão contra o Supabase local real (T4/P5, tacianosilva/bsi-tasks#604).
// Os testes de regressão (tests/regression/health-route.test.js) mockam o fetch; este é o único que
// prova a RPC health_check() e o /auth/v1/health de verdade antes do smoke test em produção.
const { test, expect } = require("@playwright/test")
const { adminClient } = require("./support/env")

// Só confere que o Supabase apontado é o local, como os demais specs
adminClient()

test("o /health responde 200 com banco e Auth no ar, sem cache", async ({ request }) => {
  const response = await request.get("/health")

  expect(response.status()).toBe(200)
  expect(response.headers()["cache-control"]).toContain("no-store")
  expect(await response.json()).toMatchObject({
    status: "ok",
    checks: { database: "ok", auth: "ok" }
  })
})
