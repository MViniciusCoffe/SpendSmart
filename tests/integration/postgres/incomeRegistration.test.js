import { createTestDb } from "../db"

// Testes de integração de persistência do registro de receita (US-010, Iteração 1):
// CT10.01 — Cadastro com dados válidos
// CT10.02 — Valor inválido é rejeitado
// Limites de schema: amount > 0, title NOT NULL, occurred_on NOT NULL, category_id FK

let db

const USUARIO_TESTE = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"

const inserirCategoria = ({ userId = USUARIO_TESTE, nome = "Salário", tipo = "income" } = {}) =>
  db.client.query(
    `INSERT INTO categories (user_id, name, type, description, color)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [userId, nome, tipo, "Renda mensal", "#00AA55"]
  )

const inserirReceita = ({
  userId = USUARIO_TESTE,
  categoryId,
  title = "Salário Outubro",
  amount = 5000.0,
  occurredOn = "2026-10-01",
  description = "Salário do mês",
  paymentMethod = "pix"
} = {}) =>
  db.client.query(
    `INSERT INTO transactions
       (user_id, category_id, type, amount, title, occurred_on, description, payment_method)
     VALUES ($1, $2, 'income', $3, $4, $5, $6, $7)
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

describe("CT10.01 — Cadastro de receita com dados válidos", () => {
  it("persiste a receita e devolve os dados corretos [pg-mem]", async () => {
    const { rows: catRows } = await inserirCategoria()
    const categoryId = catRows[0].id

    const { rows } = await inserirReceita({ categoryId })

    expect(rows[0].id).toBeDefined()
    expect(rows[0].title).toBe("Salário Outubro")
    expect(Number(rows[0].amount)).toBe(5000.0)
    expect(rows[0].type).toBe("income")
    expect(rows[0].category_id).toBe(categoryId)
    const occurredOn =
      rows[0].occurred_on instanceof Date
        ? rows[0].occurred_on.toISOString().split("T")[0]
        : rows[0].occurred_on
    expect(occurredOn).toBe("2026-10-01")
    expect(rows[0].description).toBe("Salário do mês")
    expect(rows[0].payment_method).toBe("pix")
  })
})

describe("CT10.02 — Valor inválido é rejeitado", () => {
  it("rejeita amount <= 0 (constraint transactions_amount_positive)", async () => {
    const { rows: catRows } = await inserirCategoria()
    const categoryId = catRows[0].id

    const erro = await capturarErro(inserirReceita({ categoryId, amount: 0 }))

    expect(erro.message).toMatch(/check constraint.*transactions_amount_positive/i)
  })

  it("rejeita amount negativo (constraint transactions_amount_positive)", async () => {
    const { rows: catRows } = await inserirCategoria()
    const categoryId = catRows[0].id

    const erro = await capturarErro(inserirReceita({ categoryId, amount: -100 }))

    expect(erro.message).toMatch(/check constraint.*transactions_amount_positive/i)
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
         VALUES ($1, $2, 'income', 100, NULL, '2026-10-01')
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
         VALUES ($1, $2, 'income', 100, 'Teste', NULL)
         RETURNING id`,
        [USUARIO_TESTE, categoryId]
      )
    )

    expect(erro.message).toMatch(/not-null constraint/)
    expect(erro.message).toMatch(/occurred_on/i)
  })

  it("rejeita category_id inexistente (FK 23503)", async () => {
    const erro = await capturarErro(inserirReceita({ categoryId: 999999 }))

    expect(erro.message).toMatch(/violates foreign key constraint/i)
    if (erro.code) expect(erro.code).toBe("23503")
  })
})
