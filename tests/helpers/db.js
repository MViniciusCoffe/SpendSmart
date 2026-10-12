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
