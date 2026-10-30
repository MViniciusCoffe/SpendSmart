const validarData = (valor, mensagens) => {
  if (!valor) return undefined

  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    throw new Error(mensagens.formato)
  }

  const [ano, mes, dia] = valor.split("-").map(Number)
  const data = new Date(ano, mes - 1, dia)
  if (
    Number.isNaN(data.getTime()) ||
    data.getFullYear() !== ano ||
    data.getMonth() !== mes - 1 ||
    data.getDate() !== dia
  ) {
    throw new TypeError(mensagens.invalida)
  }

  return { valor, data }
}

const validators = {
  titulo: valor => {
    if (!valor || typeof valor !== "string" || valor.trim() === "") {
      throw new Error("Título é obrigatório")
    }
    return valor.trim()
  },

  valor: valor => {
    const num = Number(valor)
    if (!Number.isFinite(num)) {
      throw new TypeError("Valor inválido: deve ser um número válido")
    }
    if (num <= 0) {
      throw new Error("Valor deve ser maior que zero")
    }
    return num
  },

  tipo: valor => {
    const validos = ["income", "expense"]
    if (!validos.includes(valor)) {
      throw new Error("Tipo inválido: deve ser 'income' ou 'expense'")
    }
    return valor
  },

  categoriaId: valor => {
    const num = Number(valor)
    if (!Number.isInteger(num) || num <= 0) {
      throw new Error("Categoria inválida")
    }
    return num
  },

  data: valor => {
    const resultado = validarData(valor, {
      formato: "Data inválida: use formato YYYY-MM-DD",
      invalida: "Data inválida"
    })
    return resultado?.valor
  },

  descricao: valor => {
    if (valor === undefined || valor === null) return ""
    return String(valor).trim()
  },

  formaPagamento: valor => {
    if (!valor) return undefined
    return String(valor).trim()
  },

  nome: valor => {
    if (!valor || typeof valor !== "string" || valor.trim() === "") {
      throw new Error("Nome é obrigatório")
    }
    return valor.trim()
  },

  email: valor => {
    if (typeof valor !== "string") throw new Error("E-mail inválido")
    // Normaliza antes de validar: espaço nas pontas (comum ao colar) não torna o e-mail inválido
    const normalizado = valor.trim().toLowerCase()
    if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(normalizado)) {
      throw new Error("E-mail inválido")
    }
    return normalizado
  },

  senha: valor => {
    if (!valor || typeof valor !== "string" || valor.length < 6) {
      throw new Error("Senha deve ter no mínimo 6 caracteres")
    }
    return valor
  },

  telefone: valor => {
    if (!valor) return undefined
    const limpo = String(valor).replaceAll(/\D/g, "")
    if (limpo.length < 10 || limpo.length > 11) {
      throw new Error("Telefone inválido")
    }
    return limpo
  },

  dataNascimento: valor => {
    const resultado = validarData(valor, {
      formato: "Data de nascimento inválida: use YYYY-MM-DD",
      invalida: "Data de nascimento inválida"
    })
    if (!resultado) return undefined

    const { data } = resultado
    const hoje = new Date()
    const idade = hoje.getFullYear() - data.getFullYear()
    if (idade < 13 || idade > 120) {
      throw new Error("Idade deve ser entre 13 e 120 anos")
    }
    return resultado.valor
  },

  cor: valor => {
    if (!valor) return undefined
    if (!/^#[0-9A-Fa-f]{6}$/.test(valor)) {
      throw new Error("Cor inválida: use formato #RRGGBB")
    }
    return valor.toUpperCase()
  }
}

export default validators
