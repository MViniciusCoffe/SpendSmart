import validators from "@/services/utils/validators"

// Uma entrada por caso (it.each): quando uma falha, as outras continuam rodando e o relatório diz
// qual entrada quebrou (issue #66).

// A idade é calculada a partir de new Date(): sem relógio fixo, o resultado mudaria com o dia em que
// a suíte roda (issue #66). "Hoje" nestes testes é 2026-06-15.
const usarHojeFixo = () => jest.useFakeTimers({ now: new Date(2026, 5, 15, 12) })

afterEach(() => {
  jest.useRealTimers()
})

const VAZIOS = [[""], [null], [undefined]]

describe("validators", () => {
  describe("titulo", () => {
    it("retorna titulo valido com trim", () => {
      expect(validators.titulo("  Teste  ")).toBe("Teste")
    })

    it.each([
      ["string vazia", ""],
      ["apenas espaços", "   "],
      ["valor não string", 123],
      ["null", null],
      ["undefined", undefined]
    ])("lança erro para %s", (_caso, entrada) => {
      expect(() => validators.titulo(entrada)).toThrow("Título é obrigatório")
    })
  })

  describe("valor", () => {
    it.each([
      [100, 100],
      ["100", 100],
      [100.5, 100.5]
    ])("aceita %p e devolve %p", (entrada, esperado) => {
      expect(validators.valor(entrada)).toBe(esperado)
    })

    it.each([["abc"], [Infinity], [-Infinity]])("lança TypeError para %p", entrada => {
      expect(() => validators.valor(entrada)).toThrow(TypeError)
    })

    it("usa a mensagem de número inválido para texto não numérico", () => {
      expect(() => validators.valor("abc")).toThrow("Valor inválido: deve ser um número válido")
    })

    it.each([[0], [-10], [""]])("lança erro de valor não positivo para %p", entrada => {
      expect(() => validators.valor(entrada)).toThrow("Valor deve ser maior que zero")
    })
  })

  describe("tipo", () => {
    it.each([["income"], ["expense"]])("aceita %p", entrada => {
      expect(validators.tipo(entrada)).toBe(entrada)
    })

    it.each([["invalid"], [""]])("lança erro para %p", entrada => {
      expect(() => validators.tipo(entrada)).toThrow(
        "Tipo inválido: deve ser 'income' ou 'expense'"
      )
    })
  })

  describe("categoriaId", () => {
    it.each([
      [1, 1],
      ["10", 10]
    ])("aceita %p e devolve %p", (entrada, esperado) => {
      expect(validators.categoriaId(entrada)).toBe(esperado)
    })

    it.each([
      ["zero", 0],
      ["negativo", -1],
      ["decimal", 1.5],
      ["string não numérica", "abc"]
    ])("lança erro para %s", (_caso, entrada) => {
      expect(() => validators.categoriaId(entrada)).toThrow("Categoria inválida")
    })
  })

  describe("data", () => {
    it("retorna data valida", () => {
      expect(validators.data("2024-01-15")).toBe("2024-01-15")
    })

    it.each(VAZIOS)("retorna undefined para %p", entrada => {
      expect(validators.data(entrada)).toBeUndefined()
    })

    it.each([["15/01/2024"], ["2024/01/15"], ["invalid"]])(
      "lança erro de formato para %p",
      entrada => {
        expect(() => validators.data(entrada)).toThrow("Data inválida: use formato YYYY-MM-DD")
      }
    )

    it.each([["2024-02-30"], ["2024-04-31"]])(
      "lança TypeError para a data inexistente %p",
      entrada => {
        expect(() => validators.data(entrada)).toThrow(TypeError)
      }
    )
  })

  describe("descricao", () => {
    it.each([
      ["  teste  ", "teste"],
      [undefined, ""],
      [null, ""],
      [123, "123"]
    ])("converte %p em %p", (entrada, esperado) => {
      expect(validators.descricao(entrada)).toBe(esperado)
    })
  })

  describe("formaPagamento", () => {
    it("retorna forma com trim", () => {
      expect(validators.formaPagamento("  pix  ")).toBe("pix")
    })

    it.each(VAZIOS)("retorna undefined para %p", entrada => {
      expect(validators.formaPagamento(entrada)).toBeUndefined()
    })
  })

  describe("nome", () => {
    it("retorna nome valido com trim", () => {
      expect(validators.nome("  João  ")).toBe("João")
    })

    it.each([
      ["string vazia", ""],
      ["apenas espaços", "   "],
      ["valor não string", 123]
    ])("lança erro para %s", (_caso, entrada) => {
      expect(() => validators.nome(entrada)).toThrow("Nome é obrigatório")
    })
  })

  describe("email", () => {
    it.each([
      ["TEST@EXAMPLE.COM", "test@example.com"],
      ["user.name@example.com", "user.name@example.com"],
      ["  Joao@Email.com ", "joao@email.com"],
      ["user+tag@example.com", "user+tag@example.com"]
    ])("aceita %p e devolve %p", (entrada, esperado) => {
      expect(validators.email(entrada)).toBe(esperado)
    })

    it.each([
      ["número", 12345],
      ["null", null],
      ["sem @", "invalido"],
      ["sem domínio", "user@"],
      ["sem TLD", "user@exemplo"],
      ["string vazia", ""]
    ])("lança erro para %s", (_caso, entrada) => {
      expect(() => validators.email(entrada)).toThrow("E-mail inválido")
    })
  })

  describe("senha", () => {
    it("retorna senha valida", () => {
      expect(validators.senha("123456")).toBe("123456")
    })

    it.each([
      ["senha curta", "12345"],
      ["string vazia", ""],
      ["valor não string", 123456]
    ])("lança erro para %s", (_caso, entrada) => {
      expect(() => validators.senha(entrada)).toThrow("Senha deve ter no mínimo 6 caracteres")
    })
  })

  describe("telefone", () => {
    it.each([["(11) 99999-9999"], ["11 99999-9999"]])("limpa %p", entrada => {
      expect(validators.telefone(entrada)).toBe("11999999999")
    })

    it.each(VAZIOS)("retorna undefined para %p", entrada => {
      expect(validators.telefone(entrada)).toBeUndefined()
    })

    it.each([
      ["curto", "123456789"],
      ["longo", "123456789012"]
    ])("lança erro para telefone %s", (_caso, entrada) => {
      expect(() => validators.telefone(entrada)).toThrow("Telefone inválido")
    })
  })

  describe("dataNascimento", () => {
    it("retorna data valida", () => {
      usarHojeFixo()
      expect(validators.dataNascimento("1990-01-01")).toBe("1990-01-01")
    })

    it.each(VAZIOS)("retorna undefined para %p", entrada => {
      expect(validators.dataNascimento(entrada)).toBeUndefined()
    })

    it("lança erro para formato invalido", () => {
      expect(() => validators.dataNascimento("01/01/1990")).toThrow(
        "Data de nascimento inválida: use YYYY-MM-DD"
      )
    })

    it("lança TypeError para data invalida", () => {
      expect(() => validators.dataNascimento("2024-13-45")).toThrow(TypeError)
    })

    it.each([
      ["menor de 13 anos", "2016-06-15"],
      ["maior de 120 anos", "1905-06-15"]
    ])("lança erro para %s", (_caso, entrada) => {
      usarHojeFixo()
      expect(() => validators.dataNascimento(entrada)).toThrow("Idade deve ser entre 13 e 120 anos")
    })
  })

  describe("cor", () => {
    it.each([
      ["#ff0000", "#FF0000"],
      ["#abcdef", "#ABCDEF"]
    ])("converte %p em %p", (entrada, esperado) => {
      expect(validators.cor(entrada)).toBe(esperado)
    })

    it.each(VAZIOS)("retorna undefined para %p", entrada => {
      expect(validators.cor(entrada)).toBeUndefined()
    })

    it.each([["#ff00"], ["ff0000"], ["#gggggg"]])("lança erro de formato para %p", entrada => {
      expect(() => validators.cor(entrada)).toThrow("Cor inválida: use formato #RRGGBB")
    })
  })

  // Casos de borda apontados pelos testes de mutação (#60)
  describe("bordas apontadas pelos testes de mutação", () => {
    it.each([["x2024-01-15"], ["2024-01-15x"]])(
      "data exige o formato completo, sem texto antes ou depois (%p)",
      entrada => {
        expect(() => validators.data(entrada)).toThrow("Data inválida: use formato YYYY-MM-DD")
      }
    )

    it("recusa ano com menos de 4 dígitos significativos que o Date desloca para 19xx", () => {
      // new Date(50, 0, 1) vira 1950-01-01: só a checagem do ano detecta
      expect(() => validators.data("0050-01-01")).toThrow(TypeError)
    })

    it("data usa a mensagem exata de data inexistente", () => {
      expect(() => validators.data("2024-02-30")).toThrow(new TypeError("Data inválida"))
    })

    it("dataNascimento usa a mensagem exata de data inexistente", () => {
      expect(() => validators.dataNascimento("1990-02-30")).toThrow(
        new TypeError("Data de nascimento inválida")
      )
    })

    it.each([["joao silva@email.com"], ["joao@email.com x"]])(
      "email recusa texto antes ou depois do endereço (%p)",
      entrada => {
        expect(() => validators.email(entrada)).toThrow("E-mail inválido")
      }
    )

    it("telefone aceita exatamente 10 dígitos (fixo com DDD)", () => {
      expect(validators.telefone("(84) 3215-3000")).toBe("8432153000")
    })

    it.each([
      ["13", "2013-01-01"],
      ["120", "1906-01-01"]
    ])("dataNascimento aceita a idade limite de %s anos", (_idade, entrada) => {
      usarHojeFixo()
      expect(validators.dataNascimento(entrada)).toBe(entrada)
    })

    it.each([["x#FF0000"], ["#FF0000x"]])(
      "cor recusa texto antes ou depois do #RRGGBB (%p)",
      entrada => {
        expect(() => validators.cor(entrada)).toThrow("Cor inválida: use formato #RRGGBB")
      }
    )
  })
})
