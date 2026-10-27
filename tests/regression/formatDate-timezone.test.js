import { formatDate, formatCurrency } from "../../src/lib/utils/format"

describe("Regressão: data da transação exibida um dia antes", () => {
  const originalTZ = process.env.TZ

  afterEach(() => {
    process.env.TZ = originalTZ
  })

  it("mantém o dia informado em fuso negativo (America/Sao_Paulo)", () => {
    process.env.TZ = "America/Sao_Paulo"
    expect(formatDate("2026-10-27")).toBe("27/10/2026")
  })

  it("aceita timestamp completo usando só a parte da data", () => {
    expect(formatDate("2026-01-05T00:00:00Z")).toBe("05/01/2026")
  })

  it("devolve travessão para valor vazio ou inválido", () => {
    expect(formatDate(null)).toBe("—")
    expect(formatDate("abc")).toBe("—")
  })
})

describe("formatCurrency", () => {
  it("formata em reais", () => {
    expect(formatCurrency(190).replace(/\s/g, " ")).toBe("R$ 190,00")
    expect(formatCurrency("10000").replace(/\s/g, " ")).toBe("R$ 10.000,00")
  })
})
