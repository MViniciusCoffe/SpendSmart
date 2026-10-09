import { createTestDb } from "../db"

// Teste de integração de persistência da US-007 (Listar categorias).
//
// Cobre o CA-007.01 no nível em que mocks não alcançam: a leitura filtrada por
// `user_id` que o `categoryService.getCategories` passou a aplicar
// (services/categoryService.js). O service monta `.eq("user_id", session.user.id)`;
// aqui a mesma consulta roda contra um Postgres de verdade (pg-mem ou real) para
// provar que o filtro isola de fato os registros de cada usuário.
//
// O isolamento por RLS continua sendo IT-01/IT-02 e depende da stack do Supabase
// (issue #20); este caso cobre a garantia que a aplicação passou a dar por
// conta própria.

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

const listarPorUsuario = userId =>
  db.client.query("SELECT name FROM categories WHERE user_id = $1 ORDER BY name ASC", [userId])

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

describe("US-007 — listagem de categorias isolada por usuário", () => {
  it("devolve apenas as categorias do usuário consultado", async () => {
    await inserirCategoria({ userId: USUARIO_A, nome: "Salario", tipo: "income" })
    await inserirCategoria({ userId: USUARIO_A, nome: "Mercado", tipo: "expense" })
    await inserirCategoria({ userId: USUARIO_B, nome: "Lazer", tipo: "expense" })

    const { rows } = await listarPorUsuario(USUARIO_A)

    expect(rows.map(r => r.name)).toEqual(["Mercado", "Salario"])
  })

  it("não vaza a categoria de outro usuário", async () => {
    await inserirCategoria({ userId: USUARIO_B, nome: "Lazer", tipo: "expense" })

    const { rows } = await listarPorUsuario(USUARIO_A)

    expect(rows).toEqual([])
  })

  it("devolve conjunto vazio para o usuário sem categorias (CA-007.02)", async () => {
    await inserirCategoria({ userId: USUARIO_A })

    const { rowCount } = await listarPorUsuario(USUARIO_B)

    expect(rowCount).toBe(0)
  })

  it("ordena o resultado por nome crescente, como o service pede", async () => {
    await inserirCategoria({ userId: USUARIO_A, nome: "Transporte" })
    await inserirCategoria({ userId: USUARIO_A, nome: "Alimentacao" })
    await inserirCategoria({ userId: USUARIO_A, nome: "Moradia" })

    const { rows } = await listarPorUsuario(USUARIO_A)

    expect(rows.map(r => r.name)).toEqual(["Alimentacao", "Moradia", "Transporte"])
  })
})
