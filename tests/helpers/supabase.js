export const METODOS = ["select", "insert", "update", "delete", "eq", "order", "single", "is"]

export const criarBuilder = resultado => {
  const builder = {}
  METODOS.forEach(metodo => {
    builder[metodo] = jest.fn(() => builder)
  })
  builder.then = (resolver, rejeitar) => Promise.resolve(resultado).then(resolver, rejeitar)
  return builder
}

export const semSessao = { data: { session: null } }
export const comSessao = { data: { session: { user: { id: "u1" } } } }

export const linhaTransacao = (overrides = {}) => ({
  id: 1,
  title: "Aluguel",
  amount: 1500.0,
  type: "expense",
  category_id: 7,
  occurred_on: "2026-09-01",
  description: "Setembro",
  payment_method: "cartao_credito",
  deleted_at: null,
  user_id: "u1",
  ...overrides
})

export const linhaCategoria = (overrides = {}) => ({
  id: 1,
  name: "Alimentacao",
  type: "expense",
  description: "Mercado",
  color: "#FF0000",
  deleted_at: null,
  ...overrides
})

export const dtoTransacao = (overrides = {}) => ({
  id: 1,
  title: "Aluguel",
  amount: 1500.0,
  type: "expense",
  category_id: 7,
  occurred_on: "2026-09-01",
  description: "Setembro",
  payment_method: "cartao_credito",
  deleted_at: null,
  ...overrides
})
