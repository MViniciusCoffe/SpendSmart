import { supabase } from "@/lib/supabase"
import { categoryService } from "@/services/categoryService"
import { transactionService } from "@/services/transactionService"
import {
  createTestUser,
  createTestCategory,
  createTestTransaction,
  cleanupTestData,
  getTransactionsByUser
} from "@/tests/helpers/factory"
import { assertLocalSupabase } from "@/tests/helpers/localSupabase"

// US-007 (Listar categorias) pelo código de produção: o `categoryService.getCategories` real, com o
// cliente da aplicação (`@/lib/supabase`) autenticado no Supabase local. Substitui o antigo
// tests/integration/postgres/categoryListing.test.js, que rodava um SQL escrito no próprio teste e
// passaria mesmo se o service perdesse o filtro por user_id ou por deleted_at (issue #66).

assertLocalSupabase()

const RUN = Date.now().toString(36)
const DONO = { email: `svc-dono-${RUN}@test.local`, password: "123456" }
const OUTRO = { email: `svc-outro-${RUN}@test.local`, password: "123456" }
const SEM_CATEGORIAS = { email: `svc-vazio-${RUN}@test.local`, password: "123456" }
const TIPO = { email: `svc-tipo-${RUN}@test.local`, password: "123456" }

let ids = []

// Cada teste escolhe a própria sessão: nenhum depende de quem entrou no teste anterior
async function entrarComo(usuario) {
  await supabase.auth.signOut()
  const { error } = await supabase.auth.signInWithPassword(usuario)
  if (error) throw error
}

beforeAll(async () => {
  const [dono, outro, vazio, tipo] = await Promise.all(
    [DONO, OUTRO, SEM_CATEGORIAS, TIPO].map(u => createTestUser(u.email, u.password))
  )
  ids = [dono.id, outro.id, vazio.id, tipo.id]
  TIPO.id = tipo.id
  OUTRO.id = outro.id

  await createTestCategory(dono.id, { name: "Transporte", type: "expense" })
  await createTestCategory(dono.id, { name: "Alimentacao", type: "expense" })
  await createTestCategory(dono.id, { name: "Salario", type: "income" })
  await createTestCategory(dono.id, {
    name: "Antiga",
    type: "expense",
    deleted_at: new Date().toISOString()
  })
  await createTestCategory(outro.id, { name: "Lazer", type: "expense" })
}, 30000)

afterAll(async () => {
  await supabase.auth.signOut()
  await cleanupTestData(ids)
})

describe("US-007 — categoryService.getCategories contra o Supabase local", () => {
  it("devolve só as categorias ativas do usuário da sessão, ordenadas por nome (CA-007.01)", async () => {
    await entrarComo(DONO)

    const categorias = await categoryService.getCategories()

    expect(categorias.map(c => c.name)).toEqual(["Alimentacao", "Salario", "Transporte"])
  })

  it("devolve DTOs com os campos do mapper, sem user_id nem timestamps", async () => {
    await entrarComo(DONO)

    const [categoria] = await categoryService.getCategories()

    expect(Object.keys(categoria).sort()).toEqual([
      "color",
      "deleted_at",
      "description",
      "id",
      "name",
      "type"
    ])
  })

  it("inclui a categoria apagada quando pedido (nome das transações antigas, US-009)", async () => {
    await entrarComo(DONO)

    const categorias = await categoryService.getCategories({ includeDeleted: true })

    expect(categorias.map(c => c.name)).toEqual(["Alimentacao", "Antiga", "Salario", "Transporte"])
    expect(categorias.find(c => c.name === "Antiga").deleted_at).not.toBeNull()
  })

  it("não devolve categorias de outro usuário", async () => {
    await entrarComo(OUTRO)

    const categorias = await categoryService.getCategories()

    expect(categorias.map(c => c.name)).toEqual(["Lazer"])
  })

  it("devolve lista vazia para o usuário sem categorias (CA-007.02)", async () => {
    await entrarComo(SEM_CATEGORIAS)

    await expect(categoryService.getCategories()).resolves.toEqual([])
  })
})

// #78: tipo e dono da transação garantidos pela FK composta (category_id, user_id, type). O pg-mem
// não implementa ON UPDATE CASCADE, então a propagação só é testada aqui, no Supabase real.
describe("#78 — FK composta entre transação e categoria, pelos services", () => {
  // Regressão da CA-008.03: mudar o tipo da categoria deixava as transações com o tipo antigo. Só o
  // banco real mostra a cascata (o pg-mem não a implementa), por isso a regressão mora aqui
  it("mudar o tipo da categoria leva as transações junto, inclusive as excluídas (regressão da CA-008.03, #78)", async () => {
    const categoria = await createTestCategory(TIPO.id, { name: "Freela", type: "expense" })
    await createTestTransaction(TIPO.id, categoria.id, { title: "Ativa", type: "expense" })
    await createTestTransaction(TIPO.id, categoria.id, {
      title: "Excluída",
      type: "expense",
      deleted_at: new Date().toISOString()
    })
    await entrarComo(TIPO)

    // O que o diálogo de confirmação mostra: 1 ativa e 1 excluída
    expect(await categoryService.countTransactions(categoria.id)).toBe(1)
    expect(await categoryService.countTransactions(categoria.id, { deleted: true })).toBe(1)

    const atualizada = await categoryService.updateCategory({
      id: categoria.id,
      name: "Freela",
      type: "income",
      color: "#22C55E"
    })

    expect(atualizada.type).toBe("income")
    const transacoes = await getTransactionsByUser(TIPO.id)
    expect(transacoes.map(t => [t.title, t.type]).sort()).toEqual([
      ["Ativa", "income"],
      ["Excluída", "income"]
    ])
  })

  it("recusa transação de tipo diferente do da categoria com a mensagem do service", async () => {
    const categoria = await createTestCategory(TIPO.id, { name: "Bolsa", type: "income" })
    await entrarComo(TIPO)

    await expect(
      transactionService.createTransaction({
        title: "Errada",
        amount: 10,
        type: "expense",
        category_id: categoria.id,
        occurred_on: "2026-11-01"
      })
    ).rejects.toThrow("Categoria não encontrada.")
  })

  it("recusa transação na categoria de outro usuário, sem revelar que ela existe", async () => {
    // O RLS deixava passar: o WITH CHECK olha o user_id da transação, e a checagem da FK antiga não
    // via de quem era a categoria
    const alheia = await createTestCategory(OUTRO.id, { name: "Alheia", type: "expense" })
    await entrarComo(TIPO)

    await expect(
      transactionService.createTransaction({
        title: "Invasão",
        amount: 10,
        type: "expense",
        category_id: alheia.id,
        occurred_on: "2026-11-01"
      })
    ).rejects.toThrow("Categoria não encontrada.")
    expect((await getTransactionsByUser(TIPO.id)).map(t => t.title)).not.toContain("Invasão")
  })
})
