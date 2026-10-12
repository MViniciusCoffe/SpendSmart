export const METODOS = ["select", "insert", "update", "delete", "eq", "order", "single"]

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
