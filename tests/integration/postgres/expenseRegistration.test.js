import { createTestDb } from "../db.js"

// Testes de integração de persistência do registro de despesa (US-013, Iteração 2)
// CT13.01 — Cadastro com dados válidos
// CT13.02 — Valor inválido é rejeitado
// CT13.03 — Detalhe preenchido (regressão #21)
// CT13.04 — Formatação monetária
// Limites de schema: amount > 0, title NOT NULL, occurred_on NOT NULL, category_id FK

let db

const USUARIO_TESTE = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"

const inserirCategoria = ({ userId = USUARIO_TESTE, nome = "Mercado", tipo = "expense" } = {}) =>
  db.client.query(
    `INSERT INTO categories (user_id, name, type, description, color)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [userId, nome, tipo, "Compras do mês", "#AA0000"]
  )

const inserirDespesa = ({
  userId = USUARIO_TESTE,
  categoryId,
  title = "Compra",
  amount = 87.4,
  occurredOn = "2026-10-06",
  description = "Compras da semana",
  paymentMethod = "Débito"
} = {}) =>
  db.client.query(
    `INSERT INTO transactions
       (user_id, category_id, type, amount, title, occurred_on, description, payment_method)
     VALUES ($1, $2, 'expense', $3, $4, $5, $6, $7)
     RETURNING id, title, amount, type, category_id, occurred_on, description, payment_method`,
    [userId, categoryId, amount, title, occurredOn, description, paymentMethod]
  )

const capturarErro = async promise => {
  try {
    await promise
  } catch (erro) {
    return erro
  }
  throw new Error("A operação deveria ter sido rejeitada pelo banco")
}

beforeAll(async () => {
  db = await createTestDb()
})

beforeEach(async () => {
  await db.client.query("DELETE FROM transactions")
  await db.client.query("DELETE FROM categories")
})

afterAll(async () => {
  await db.client.end()
})

describe("CT13.01 — Cadastro de despesa com dados válidos", () => {
  it("persiste a despesa e devolve os dados corretos [pg-mem]", async () => {
    const { rows: catRows } = await inserirCategoria()
    const categoryId = catRows[0].id

    const { rows } = await inserirDespesa({ categoryId })

    expect(rows[0].id).toBeDefined()
    expect(rows[0].title).toBe("Compra")
    expect(Number(rows[0].amount)).toBe(87.4)
    expect(rows[0].type).toBe("expense")
    expect(rows[0].category_id).toBe(categoryId)
    const occurredOn =
      rows[0].occurred_on instanceof Date
        ? rows[0].occurred_on.toISOString().split("T")[0]
        : rows[0].occurred_on
    expect(occurredOn).toBe("2026-10-06")
    expect(rows[0].description).toBe("Compras da semana")
    expect(rows[0].payment_method).toBe("Débito")
  })
})

describe("CT13.02 — Valor inválido é rejeitado", () => {
  it("rejeita amount <= 0 (constraint transactions_amount_positive)", async () => {
    const { rows: catRows } = await inserirCategoria()
    const categoryId = catRows[0].id

    const erro = await capturarErro(inserirDespesa({ categoryId, amount: 0 }))

    expect(erro.message).toMatch(/check constraint.*transactions_amount_positive/i)
  })

  it("rejeita amount negativo (constraint transactions_amount_positive)", async () => {
    const { rows: catRows } = await inserirCategoria()
    const categoryId = catRows[0].id

    const erro = await capturarErro(inserirDespesa({ categoryId, amount: -10 }))

    expect(erro.message).toMatch(/check constraint.*transactions_amount_positive/i)
  })
})

describe("CT13.03 — Detalhe preenchido (regressão #21)", () => {
  it("persiste occurred_on e payment_method para consulta no detalhe", async () => {
    const { rows: catRows } = await inserirCategoria()
    const categoryId = catRows[0].id

    const { rows } = await inserirDespesa({
      categoryId,
      occurredOn: "2026-10-06",
      paymentMethod: "Débito"
    })

    const occurredOn =
      rows[0].occurred_on instanceof Date
        ? rows[0].occurred_on.toISOString().split("T")[0]
        : rows[0].occurred_on

    expect(occurredOn).toBe("2026-10-06")
    expect(rows[0].payment_method).toBe("Débito")
  })
})

describe("CT13.04 — Formatação monetária", () => {
  it("persiste amount com precisão decimal correta", async () => {
    const { rows: catRows } = await inserirCategoria()
    const categoryId = catRows[0].id

    const { rows } = await inserirDespesa({ categoryId, amount: 1234.5 })

    expect(Number(rows[0].amount)).toBe(1234.5)
    expect(rows[0].amount.toFixed(2)).toBe("1234.50")
  })
})

describe("Limites de schema — campos obrigatórios e chaves estrangeiras", () => {
  it("rejeita title nulo (NOT NULL)", async () => {
    const { rows: catRows } = await inserirCategoria()
    const categoryId = catRows[0].id

    const erro = await capturarErro(
      db.client.query(
        `INSERT INTO transactions
           (user_id, category_id, type, amount, title, occurred_on)
         VALUES ($1, $2, 'expense', 100, NULL, '2026-10-06')
         RETURNING id`,
        [USUARIO_TESTE, categoryId]
      )
    )

    expect(erro.message).toMatch(/not-null constraint/)
    expect(erro.message).toMatch(/title/i)
  })

  it("rejeita occurred_on nulo (NOT NULL)", async () => {
    const { rows: catRows } = await inserirCategoria()
    const categoryId = catRows[0].id

    const erro = await capturarErro(
      db.client.query(
        `INSERT INTO transactions
           (user_id, category_id, type, amount, title, occurred_on)
         VALUES ($1, $2, 'expense', 100, 'Teste', NULL)
         RETURNING id`,
        [USUARIO_TESTE, categoryId]
      )
    )

    expect(erro.message).toMatch(/not-null constraint/)
    expect(erro.message).toMatch(/occurred_on/i)
  })

  it("rejeita category_id inexistente (FK 23503)", async () => {
    const erro = await capturarErro(inserirDespesa({ categoryId: 999999 }))

    expect(erro.message).toMatch(/violates foreign key constraint/i)
    if (erro.code) expect(erro.code).toBe("23503")
  })
})
