import { createTestDb } from "../db"

// Testes de integração de persistência do cadastro (US-001, Iteração 1): o que
// o banco garante na fronteira do POST /api/createProfile, que é a segunda
// metade do fluxo de registro (a primeira é o signUp no Auth).
//
// O caso central é o CT01.04 do PTI: hoje, quando a gravação do perfil falha,
// a conta fica órfã no Auth (issue #25). Estes testes comprovam em banco real
// as duas falhas de escrita que disparam esse caminho — dados obrigatórios
// ausentes e id reutilizado — e o caminho feliz que a correção precisa manter.

let db

const USUARIO_NOVO = "33333333-3333-3333-3333-333333333333"

const inserirPerfil = ({ id = USUARIO_NOVO, nome = "Usuário de Teste" } = {}) =>
  db.client.query(
    `INSERT INTO profiles (id, nome_completo, data_nascimento, telefone)
     VALUES ($1, $2, '2000-01-15', '84999990000')
     RETURNING id`,
    [id, nome]
  )

// Mesmo padrão do categoryConstraints: o pg-mem não preenche `code` em todas
// as violações, então a asserção primária é a mensagem padrão do PostgreSQL,
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
  await db.client.query("DELETE FROM profiles")
})

afterAll(async () => {
  await db.client.end()
})

describe("US-001 — gravação do perfil no cadastro", () => {
  it("persiste o perfil completo com o id informado (caminho feliz do createProfile)", async () => {
    const { rows } = await inserirPerfil()

    expect(rows[0].id).toBe(USUARIO_NOVO)

    const { rows: perfil } = await db.client.query(
      "SELECT nome_completo, telefone FROM profiles WHERE id = $1",
      [USUARIO_NOVO]
    )
    expect(perfil[0].nome_completo).toBe("Usuário de Teste")
  })

  it("rejeita perfil sem nome_completo — a falha que hoje gera conta órfã (CT01.04, issue #25)", async () => {
    const erro = await capturarErro(inserirPerfil({ nome: null }))

    expect(erro.message).toMatch(/violates not-null constraint/i)
    if (erro.code) expect(erro.code).toBe("23502")
  })

  it("rejeita perfil com id já cadastrado (23505) — reenvio não duplica nem sobrescreve", async () => {
    await inserirPerfil({ nome: "Primeiro Nome" })

    const erro = await capturarErro(inserirPerfil({ nome: "Nome Trocado" }))

    expect(erro.message).toMatch(/duplicate key value violates unique constraint/i)
    expect(erro.code).toBe("23505")

    const { rows } = await db.client.query("SELECT nome_completo FROM profiles WHERE id = $1", [
      USUARIO_NOVO
    ])
    expect(rows[0].nome_completo).toBe("Primeiro Nome")
  })
})
