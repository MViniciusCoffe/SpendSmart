import { supabase } from "@/lib/supabase"
import { categoryService } from "@/services/categoryService"
import { clearSessionCache } from "@/services/utils/baseService"
import { createTestUser, createTestCategory, cleanupTestData } from "@/tests/helpers/factory"
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

let ids = []

// Cada teste escolhe a própria sessão: nenhum depende de quem entrou no teste anterior
async function entrarComo(usuario) {
  await supabase.auth.signOut()
  const { error } = await supabase.auth.signInWithPassword(usuario)
  if (error) throw error
  clearSessionCache()
}

beforeAll(async () => {
  const [dono, outro, vazio] = await Promise.all(
    [DONO, OUTRO, SEM_CATEGORIAS].map(u => createTestUser(u.email, u.password))
  )
  ids = [dono.id, outro.id, vazio.id]

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
  clearSessionCache()
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
