import { createTestDb } from "../db"

// Testes de integração de persistência das categorias: IT-04 e IT-05 do plano
// de testes (docs/test-plan.md). São os casos que nenhum mock em JS consegue
// cobrir, porque a regra vive no banco:
//
//   IT-04 — Exclusão de categoria em uso é rejeitada (ON DELETE RESTRICT, 23503)
//   IT-05 — Unicidade de categoria por (usuário, nome, tipo) (23505)
//
// O service traduz esses códigos para mensagens em português
// (services/categoryService.js:53,93) — os testes de unidade cobrem o mapa,
// estes cobrem a origem: o banco realmente rejeita.

let db

const USUARIO_A = "11111111-1111-1111-1111-111111111111"
const USUARIO_B = "22222222-2222-2222-2222-222222222222"

const inserirCategoria = ({ userId = USUARIO_A, nome = "Mercado", tipo = "expense" } = {}) =>
  db.client.query(
    `INSERT INTO categories (user_id, name, type, description, color)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [userId, nome, tipo, "Alimentação da casa", "#FF0000"]
  )

const inserirTransacao = categoriaId =>
  db.client.query(
    `INSERT INTO transactions
       (user_id, category_id, type, amount, title, occurred_on, payment_method)
     VALUES ($1, $2, 'expense', 150.00, 'Compras do mês', '2026-10-01', 'pix')`,
    [USUARIO_A, categoriaId]
  )

// Captura o erro rejeitado para inspecionar código e mensagem. O pg-mem não
// preenche `code` em violações de chave estrangeira (o 23503 só aparece no
// Postgres real), então FK é verificada pela mensagem padrão do PostgreSQL,
// idêntica nos dois backends; quando o código existe, ele também é conferido.
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
  // Ordem importa: transactions primeiro por causa da FK RESTRICT
  await db.client.query("DELETE FROM transactions")
  await db.client.query("DELETE FROM categories")
})

afterAll(async () => {
  await db.client.end()
})

describe("IT-05 — unicidade de categoria por (usuário, nome, tipo)", () => {
  it(`rejeita duplicata exata com o código 23505 [${process.env.TEST_DATABASE_URL ? "postgres-real" : "pg-mem"}]`, async () => {
    await inserirCategoria()

    const erro = await capturarErro(inserirCategoria())

    expect(erro.message).toMatch(/duplicate key value violates unique constraint/i)
    expect(erro.code).toBe("23505")
  })

  it("permite o mesmo nome para usuários diferentes", async () => {
    await inserirCategoria({ userId: USUARIO_A })
    const resultado = await inserirCategoria({ userId: USUARIO_B })

    expect(resultado.rows[0].id).toBeDefined()
  })

  it("permite o mesmo nome para tipos diferentes no mesmo usuário", async () => {
    await inserirCategoria({ tipo: "expense" })
    const resultado = await inserirCategoria({ tipo: "income" })

    expect(resultado.rows[0].id).toBeDefined()
  })
})

describe("IT-04 — exclusão de categoria em uso é rejeitada", () => {
  it("rejeita a exclusão por chave estrangeira e mantém a categoria", async () => {
    const { rows } = await inserirCategoria()
    await inserirTransacao(rows[0].id)

    const erro = await capturarErro(
      db.client.query("DELETE FROM categories WHERE id = $1", [rows[0].id])
    )

    expect(erro.message).toMatch(/violates foreign key constraint/i)
    if (erro.code) expect(erro.code).toBe("23503")

    const { rowCount } = await db.client.query("SELECT 1 FROM categories WHERE id = $1", [
      rows[0].id
    ])
    expect(rowCount).toBe(1)
  })

  it("permite excluir categoria sem transações vinculadas", async () => {
    const { rows } = await inserirCategoria()

    const { rowCount } = await db.client.query("DELETE FROM categories WHERE id = $1", [rows[0].id])

    expect(rowCount).toBe(1)
  })

  it("permite excluir depois que as transações são removidas", async () => {
    const { rows } = await inserirCategoria()
    await inserirTransacao(rows[0].id)

    await db.client.query("DELETE FROM transactions WHERE category_id = $1", [rows[0].id])
    const { rowCount } = await db.client.query("DELETE FROM categories WHERE id = $1", [rows[0].id])

    expect(rowCount).toBe(1)
  })

  it("rejeita transação apontando para categoria inexistente (23503)", async () => {
    // É a origem do "Categoria não encontrada." que o transactionService mapeia
    const erro = await capturarErro(inserirTransacao(999999))

    expect(erro.message).toMatch(/violates foreign key constraint/i)
    if (erro.code) expect(erro.code).toBe("23503")
  })
})
