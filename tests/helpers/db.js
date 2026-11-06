export const capturarErro = async promise => {
  try {
    await promise
  } catch (erro) {
    return erro
  }
  throw new Error("A operação deveria ter sido rejeitada pelo banco")
}

// auth.users só tem o stub (id) no pg-mem; categories, transactions e profiles referenciam essa tabela
export const garantirUsuario = (client, userId) =>
  client.query("INSERT INTO auth.users (id) VALUES ($1) ON CONFLICT (id) DO NOTHING", [userId])

export const inserirCategoria = async (
  client,
  { userId, nome = "Mercado", tipo = "expense", descricao = "Categoria de teste", cor = "#FF0000" }
) => {
  await garantirUsuario(client, userId)
  return client.query(
    `INSERT INTO categories (user_id, name, type, description, color)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [userId, nome, tipo, descricao, cor]
  )
}

// Ordem das FKs: transactions -> categories -> profiles -> auth.users
export const limparBanco = async client => {
  for (const tabela of ["transactions", "categories", "profiles", "auth.users"]) {
    await client.query(`DELETE FROM ${tabela}`)
  }
}

// O pg-mem não preenche o SQLSTATE de violação de FK (23503) nem de NOT NULL (23502): error.code
// chega undefined (verificado em 2026-11-05; o de unicidade, 23505, ele preenche). Em vez de pular a asserção em silêncio com `if (erro.code)`, cada modo
// verifica o que oferece. Se o pg-mem passar a preencher o código, este teste avisa.
export const esperarCodigoPg = (erro, codigo, modo) => {
  expect(erro.code).toBe(modo === "pg-mem" ? undefined : codigo)
}

// Coluna `date` como "AAAA-MM-DD". O Postgres real devolve texto (parser configurado em
// tests/integration/db.js); o pg-mem devolve Date à meia-noite UTC, e não aceita `::text` em date.
export const dataISO = valor => (valor instanceof Date ? valor.toISOString().slice(0, 10) : valor)
