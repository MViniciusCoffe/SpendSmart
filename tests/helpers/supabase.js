export const METODOS = [
  "select",
  "insert",
  "update",
  "delete",
  "eq",
  "order",
  "single",
  "maybeSingle",
  "is"
]

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

// --- Helpers para testes de integração com Supabase real ---
export const criarUsuarioTeste = async (
  supabase,
  email = `test-${Date.now()}@test.local`,
  password = "123456"
) => {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  return { userId: data.user.id, accessToken: data.session?.access_token }
}

export const limparBanco = async db => {
  await db.client.query("TRUNCATE transactions, categories, profiles RESTART IDENTITY CASCADE")
}

export const seedDadosBasicos = async (db, userId) => {
  const categorias = [
    {
      user_id: userId,
      name: "Salário",
      type: "income",
      description: "Renda mensal",
      color: "#00AA55"
    },
    {
      user_id: userId,
      name: "Freelance",
      type: "income",
      description: "Rendas extras",
      color: "#00CC66"
    },
    {
      user_id: userId,
      name: "Mercado",
      type: "expense",
      description: "Compras do mês",
      color: "#AA0000"
    },
    {
      user_id: userId,
      name: "Transporte",
      type: "expense",
      description: "Combustível, ônibus",
      color: "#AA5500"
    },
    {
      user_id: userId,
      name: "Lazer",
      type: "expense",
      description: "Entretenimento",
      color: "#AA00AA"
    }
  ]
  for (const cat of categorias) {
    await db.client.query(
      `INSERT INTO categories (user_id, name, type, description, color) VALUES ($1,$2,$3,$4,$5)`,
      [cat.user_id, cat.name, cat.type, cat.description, cat.color]
    )
  }
}

export const assertSoftDelete = obj => {
  expect(obj).toHaveProperty("deleted_at", null)
}
