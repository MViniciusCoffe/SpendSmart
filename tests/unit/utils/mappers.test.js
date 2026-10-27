import { categoryTypeMap, transactionTypeMap, profileTypeMap } from "@/services/utils/mappers"
import { linhaCategoria, linhaTransacao } from "../../helpers/supabase"

// Os mappers devolvem DTOs: só os campos públicos, nunca a linha crua (sem user_id)
describe("mappers", () => {
  it("categoryTypeMap remove user_id e mantém os campos públicos", () => {
    const dto = categoryTypeMap({ ...linhaCategoria(), user_id: "u1" })

    expect(dto).not.toHaveProperty("user_id")
    expect(dto).toEqual(expect.objectContaining({ id: 1, name: "Alimentacao", type: "expense" }))
  })

  it("transactionTypeMap remove user_id e mantém os campos públicos", () => {
    const dto = transactionTypeMap(linhaTransacao())

    expect(dto).not.toHaveProperty("user_id")
    expect(dto).toEqual(expect.objectContaining({ id: 1, title: "Aluguel", amount: 1500 }))
  })

  it("profileTypeMap devolve só os campos do perfil", () => {
    const dto = profileTypeMap({
      id: "u1",
      full_name: "Joao Silva",
      birth_date: "1990-01-01",
      phone: "11999999999",
      created_at: "2026-01-01",
      updated_at: "2026-01-02",
      deleted_at: null,
      extra: "não deve passar"
    })

    expect(dto).toEqual({
      id: "u1",
      full_name: "Joao Silva",
      birth_date: "1990-01-01",
      phone: "11999999999",
      created_at: "2026-01-01",
      updated_at: "2026-01-02",
      deleted_at: null
    })
  })
})
