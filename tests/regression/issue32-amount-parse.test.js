import { parseAmount } from "../../src/lib/utils/format"

// Regressão #32: o valor digitado era interpretado errado (vírgula/milhar)
describe("Regressão #32: interpretação do valor da transação", () => {
  it.each([
    ["190", 190],
    ["190,50", 190.5],
    ["1.234,56", 1234.56],
    ["1.234", 1234],
    ["1234.56", 1234.56],
    ["R$ 2.000,00", 2000]
  ])("%s vira %d", (texto, esperado) => {
    expect(parseAmount(texto)).toBe(esperado)
  })

  it.each(["", "abc", "1,2,3", "12a"])("%p é inválido", texto => {
    expect(parseAmount(texto)).toBeNaN()
  })
})
