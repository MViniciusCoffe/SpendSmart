import validators from "./validators"

export { obterSessao, traduzirErroSupabase } from "./baseService"

export const validarTitulo = validators.titulo
export const validarValor = validators.valor
