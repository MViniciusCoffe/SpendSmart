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
    if (!valor) return undefined
    const regex = /^\d{4}-\d{2}-\d{2}$/
    if (!regex.test(valor)) {
      throw new Error("Data inválida: use formato YYYY-MM-DD")
    }
    const data = new Date(valor)
    if (Number.isNaN(data.getTime())) {
      throw new Error("Data inválida")
    }
    return valor
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
    if (
      !valor ||
      !/^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(
        valor
      )
    ) {
      throw new Error("E-mail inválido")
    }
    return valor.toLowerCase().trim()
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
    if (!valor) return undefined
    const regex = /^\d{4}-\d{2}-\d{2}$/
    if (!regex.test(valor)) {
      throw new Error("Data de nascimento inválida: use YYYY-MM-DD")
    }
    const data = new Date(valor)
    if (Number.isNaN(data.getTime())) {
      throw new Error("Data de nascimento inválida")
    }
    const hoje = new Date()
    const idade = hoje.getFullYear() - data.getFullYear()
    if (idade < 13 || idade > 120) {
      throw new Error("Idade deve ser entre 13 e 120 anos")
    }
    return valor
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
