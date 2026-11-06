export const capturarErro = async promise => {
  try {
    await promise
  } catch (erro) {
    return erro
  }
  throw new Error("A operação deveria ter sido rejeitada pelo banco")
}

export const inserirCategoria = ({
  userId = "11111111-1111-1111-1111-111111111111",
  nome = "Mercado",
  tipo = "expense"
} = {}) => [userId, nome, tipo, "Alimentação da casa", "#FF0000"]

export const inserirTransacao = ({
  userId = "11111111-1111-1111-1111-111111111111",
  categoryId,
  title = "Compras do mês",
  amount = 150.0,
  occurredOn = "2026-10-01",
  paymentMethod = "pix"
} = {}) => [userId, categoryId, "expense", amount, title, occurredOn, paymentMethod]

// O pg-mem não preenche o SQLSTATE de violação de FK (23503) nem de NOT NULL (23502): error.code
// chega undefined (verificado em 2026-11-05; o de unicidade, 23505, ele preenche). Em vez de pular a asserção em silêncio com `if (erro.code)`, cada modo
// verifica o que oferece. Se o pg-mem passar a preencher o código, este teste avisa.
export const esperarCodigoPg = (erro, codigo, modo) => {
  expect(erro.code).toBe(modo === "pg-mem" ? undefined : codigo)
}

// Coluna `date` como "AAAA-MM-DD". O Postgres real devolve texto (parser configurado em
// tests/integration/db.js); o pg-mem devolve Date à meia-noite UTC, e não aceita `::text` em date.
export const dataISO = valor => (valor instanceof Date ? valor.toISOString().slice(0, 10) : valor)
