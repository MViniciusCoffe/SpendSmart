export const linha = (overrides = {}) => ({
  id: 1,
  title: "Aluguel",
  amount: 1500.0,
  type: "expense",
  category_id: 7,
  occurred_on: "2026-09-01",
  description: "Setembro",
  payment_method: "cartao_credito",
  user_id: "u1",
  ...overrides
})

export const dto = (overrides = {}) => ({
  id: 1,
  titulo: "Aluguel",
  valor: 1500.0,
  tipo: "despesa",
  category_id: 7,
  data_ocorrencia: "2026-09-01",
  descricao: "Setembro",
  metodo_pagamento: "cartao_credito",
  ...overrides
})
