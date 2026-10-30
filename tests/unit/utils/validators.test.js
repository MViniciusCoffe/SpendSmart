import validators from "@/services/utils/validators"

describe("validators", () => {
  describe("titulo", () => {
    it("retorna titulo valido com trim", () => {
      expect(validators.titulo("  Teste  ")).toBe("Teste")
    })

    it("lança erro para string vazia", () => {
      expect(() => validators.titulo("")).toThrow("Título é obrigatório")
    })

    it("lança erro para apenas espacos", () => {
      expect(() => validators.titulo("   ")).toThrow("Título é obrigatório")
    })

    it("lança erro para valor nao string", () => {
      expect(() => validators.titulo(123)).toThrow("Título é obrigatório")
    })

    it("lança erro para null", () => {
      expect(() => validators.titulo(null)).toThrow("Título é obrigatório")
    })

    it("lança erro para undefined", () => {
      expect(() => validators.titulo(undefined)).toThrow("Título é obrigatório")
    })
  })

  describe("valor", () => {
    it("retorna numero valido", () => {
      expect(validators.valor(100)).toBe(100)
      expect(validators.valor("100")).toBe(100)
      expect(validators.valor(100.5)).toBe(100.5)
    })

    it("lança TypeError para NaN", () => {
      expect(() => validators.valor("abc")).toThrow(TypeError)
      expect(() => validators.valor("abc")).toThrow("Valor inválido: deve ser um número válido")
    })

    it("lança TypeError para Infinity", () => {
      expect(() => validators.valor(Infinity)).toThrow(TypeError)
    })

    it("lança TypeError para -Infinity", () => {
      expect(() => validators.valor(-Infinity)).toThrow(TypeError)
    })

    it("lança erro para valor <= 0", () => {
      expect(() => validators.valor(0)).toThrow("Valor deve ser maior que zero")
      expect(() => validators.valor(-10)).toThrow("Valor deve ser maior que zero")
    })

    it("lança TypeError para string nao numerica", () => {
      expect(() => validators.valor("abc")).toThrow(TypeError)
    })
  })

  describe("tipo", () => {
    it("retorna income valido", () => {
      expect(validators.tipo("income")).toBe("income")
    })

    it("retorna expense valido", () => {
      expect(validators.tipo("expense")).toBe("expense")
    })

    it("lança erro para tipo invalido", () => {
      expect(() => validators.tipo("invalid")).toThrow(
        "Tipo inválido: deve ser 'income' ou 'expense'"
      )
    })

    it("lança erro para string vazia", () => {
      expect(() => validators.tipo("")).toThrow("Tipo inválido: deve ser 'income' ou 'expense'")
    })
  })

  describe("categoriaId", () => {
    it("retorna id valido", () => {
      expect(validators.categoriaId(1)).toBe(1)
      expect(validators.categoriaId("10")).toBe(10)
    })

    it("lança erro para zero", () => {
      expect(() => validators.categoriaId(0)).toThrow("Categoria inválida")
    })

    it("lança erro para negativo", () => {
      expect(() => validators.categoriaId(-1)).toThrow("Categoria inválida")
    })

    it("lança erro para decimal", () => {
      expect(() => validators.categoriaId(1.5)).toThrow("Categoria inválida")
    })

    it("lança erro para string nao numerica", () => {
      expect(() => validators.categoriaId("abc")).toThrow("Categoria inválida")
    })
  })

  describe("data", () => {
    it("retorna data valida", () => {
      expect(validators.data("2024-01-15")).toBe("2024-01-15")
    })

    it("retorna undefined para valor falsy", () => {
      expect(validators.data("")).toBeUndefined()
      expect(validators.data(null)).toBeUndefined()
      expect(validators.data(undefined)).toBeUndefined()
    })

    it("lança erro para formato invalido", () => {
      expect(() => validators.data("15/01/2024")).toThrow("Data inválida: use formato YYYY-MM-DD")
      expect(() => validators.data("2024/01/15")).toThrow("Data inválida: use formato YYYY-MM-DD")
      expect(() => validators.data("invalid")).toThrow("Data inválida: use formato YYYY-MM-DD")
    })

    it("lança TypeError para data invalida", () => {
      expect(() => validators.data("2024-02-30")).toThrow(TypeError)
      expect(() => validators.data("2024-04-31")).toThrow(TypeError)
    })
  })

  describe("descricao", () => {
    it("retorna descricao com trim", () => {
      expect(validators.descricao("  teste  ")).toBe("teste")
    })

    it("retorna string vazia para undefined", () => {
      expect(validators.descricao(undefined)).toBe("")
    })

    it("retorna string vazia para null", () => {
      expect(validators.descricao(null)).toBe("")
    })

    it("converte numero para string", () => {
      expect(validators.descricao(123)).toBe("123")
    })
  })

  describe("formaPagamento", () => {
    it("retorna forma com trim", () => {
      expect(validators.formaPagamento("  pix  ")).toBe("pix")
    })

    it("retorna undefined para valor falsy", () => {
      expect(validators.formaPagamento("")).toBeUndefined()
      expect(validators.formaPagamento(null)).toBeUndefined()
      expect(validators.formaPagamento(undefined)).toBeUndefined()
    })
  })

  describe("nome", () => {
    it("retorna nome valido com trim", () => {
      expect(validators.nome("  João  ")).toBe("João")
    })

    it("lança erro para string vazia", () => {
      expect(() => validators.nome("")).toThrow("Nome é obrigatório")
    })

    it("lança erro para apenas espacos", () => {
      expect(() => validators.nome("   ")).toThrow("Nome é obrigatório")
    })

    it("lança erro para nao string", () => {
      expect(() => validators.nome(123)).toThrow("Nome é obrigatório")
    })
  })

  describe("email", () => {
    ;(it("retorna email valido em lowercase", () => {
      expect(validators.email("TEST@EXAMPLE.COM")).toBe("test@example.com")
    }),
      it("aceita email com ponto", () => {
        expect(validators.email("user.name@example.com")).toBe("user.name@example.com")
      }))

    it("aceita email com mais sinal", () => {
      expect(validators.email("user+tag@example.com")).toBe("user+tag@example.com")
    })

    it("lança erro para email invalido sem @", () => {
      expect(() => validators.email("invalido")).toThrow("E-mail inválido")
    })

    it("lança erro para email sem dominio", () => {
      expect(() => validators.email("user@")).toThrow("E-mail inválido")
    })

    it("lança erro para email sem TLD", () => {
      expect(() => validators.email("user@exemplo")).toThrow("E-mail inválido")
    })

    it("lança erro para string vazia", () => {
      expect(() => validators.email("")).toThrow("E-mail inválido")
    })
  })

  describe("senha", () => {
    it("retorna senha valida", () => {
      expect(validators.senha("123456")).toBe("123456")
    })

    it("lança erro para senha curta", () => {
      expect(() => validators.senha("12345")).toThrow("Senha deve ter no mínimo 6 caracteres")
    })

    it("lança erro para string vazia", () => {
      expect(() => validators.senha("")).toThrow("Senha deve ter no mínimo 6 caracteres")
    })

    it("lança erro para nao string", () => {
      expect(() => validators.senha(123456)).toThrow("Senha deve ter no mínimo 6 caracteres")
    })
  })

  describe("telefone", () => {
    it("retorna telefone limpo", () => {
      expect(validators.telefone("(11) 99999-9999")).toBe("11999999999")
      expect(validators.telefone("11 99999-9999")).toBe("11999999999")
    })

    it("retorna undefined para valor falsy", () => {
      expect(validators.telefone("")).toBeUndefined()
      expect(validators.telefone(null)).toBeUndefined()
      expect(validators.telefone(undefined)).toBeUndefined()
    })

    it("lança erro para telefone curto", () => {
      expect(() => validators.telefone("123456789")).toThrow("Telefone inválido")
    })

    it("lança erro para telefone longo", () => {
      expect(() => validators.telefone("123456789012")).toThrow("Telefone inválido")
    })
  })

  describe("dataNascimento", () => {
    it("retorna data valida", () => {
      expect(validators.dataNascimento("1990-01-01")).toBe("1990-01-01")
    })

    it("retorna undefined para valor falsy", () => {
      expect(validators.dataNascimento("")).toBeUndefined()
      expect(validators.dataNascimento(null)).toBeUndefined()
      expect(validators.dataNascimento(undefined)).toBeUndefined()
    })

    it("lança erro para formato invalido", () => {
      expect(() => validators.dataNascimento("01/01/1990")).toThrow(
        "Data de nascimento inválida: use YYYY-MM-DD"
      )
    })

    it("lança TypeError para data invalida", () => {
      expect(() => validators.dataNascimento("2024-13-45")).toThrow(TypeError)
    })

    it("lança erro para menor de 13 anos", () => {
      const futuro = new Date()
      futuro.setFullYear(futuro.getFullYear() - 10)
      const data = futuro.toISOString().split("T")[0]
      expect(() => validators.dataNascimento(data)).toThrow("Idade deve ser entre 13 e 120 anos")
    })

    it("lança erro para maior de 120 anos", () => {
      const passado = new Date()
      passado.setFullYear(passado.getFullYear() - 121)
      const data = passado.toISOString().split("T")[0]
      expect(() => validators.dataNascimento(data)).toThrow("Idade deve ser entre 13 e 120 anos")
    })
  })

  describe("cor", () => {
    it("retorna cor em uppercase", () => {
      expect(validators.cor("#ff0000")).toBe("#FF0000")
      expect(validators.cor("#abcdef")).toBe("#ABCDEF")
    })

    it("retorna undefined para valor falsy", () => {
      expect(validators.cor("")).toBeUndefined()
      expect(validators.cor(null)).toBeUndefined()
      expect(validators.cor(undefined)).toBeUndefined()
    })

    it("lança erro para formato invalido", () => {
      expect(() => validators.cor("#ff00")).toThrow("Cor inválida: use formato #RRGGBB")
      expect(() => validators.cor("ff0000")).toThrow("Cor inválida: use formato #RRGGBB")
      expect(() => validators.cor("#gggggg")).toThrow("Cor inválida: use formato #RRGGBB")
    })
  })

  // Casos de borda apontados pelos testes de mutação (#60)
  describe("bordas apontadas pelos testes de mutação", () => {
    it("data e dataNascimento exigem o formato completo, sem texto antes ou depois", () => {
      expect(() => validators.data("x2024-01-15")).toThrow("Data inválida: use formato YYYY-MM-DD")
      expect(() => validators.data("2024-01-15x")).toThrow("Data inválida: use formato YYYY-MM-DD")
    })

    it("recusa ano com menos de 4 dígitos significativos que o Date desloca para 19xx", () => {
      // new Date(50, 0, 1) vira 1950-01-01: só a checagem do ano detecta
      expect(() => validators.data("0050-01-01")).toThrow(TypeError)
    })

    it("usa a mensagem exata de data inexistente", () => {
      expect(() => validators.data("2024-02-30")).toThrow(new TypeError("Data inválida"))
      expect(() => validators.dataNascimento("1990-02-30")).toThrow(
        new TypeError("Data de nascimento inválida")
      )
    })

    it("email recusa texto antes ou depois do endereço", () => {
      expect(() => validators.email("joao silva@email.com")).toThrow("E-mail inválido")
      expect(() => validators.email("joao@email.com x")).toThrow("E-mail inválido")
    })

    it("telefone aceita exatamente 10 dígitos (fixo com DDD)", () => {
      expect(validators.telefone("(84) 3215-3000")).toBe("8432153000")
    })

    it("dataNascimento aceita as idades limite de 13 e 120 anos", () => {
      const ano = new Date().getFullYear()
      expect(validators.dataNascimento(`${ano - 13}-01-01`)).toBe(`${ano - 13}-01-01`)
      expect(validators.dataNascimento(`${ano - 120}-01-01`)).toBe(`${ano - 120}-01-01`)
    })

    it("cor recusa texto antes ou depois do #RRGGBB", () => {
      expect(() => validators.cor("x#FF0000")).toThrow("Cor inválida: use formato #RRGGBB")
      expect(() => validators.cor("#FF0000x")).toThrow("Cor inválida: use formato #RRGGBB")
    })
  })
})
