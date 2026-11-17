import { supabase } from "@/lib/supabase"
import validators from "@/services/utils/validators"

export const authService = {
  // O perfil vai nos metadados do signUp e é criado pelo trigger on_auth_user_created, na mesma
  // transação do usuário do Auth (#75): se o perfil falhar, a conta também não é criada. Por isso
  // os campos são validados aqui, antes do signUp; o trigger grava o que receber. E-mail e senha
  // também, para a regra não depender só da página (#82): o Auth teria outra mensagem, em inglês.
  async registerUser({ email, password, full_name, birth_date, phone }) {
    const credentials = {
      email: validators.email(email),
      password: validators.senha(password)
    }
    const profile = {
      full_name: validators.nome(full_name),
      birth_date: validators.dataNascimento(birth_date),
      phone: validators.telefone(phone)
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      ...credentials,
      options: { data: profile }
    })

    if (authError) {
      // E-mail já cadastrado é caso esperado, com mensagem própria: não vai para o console (#82)
      if (authError.message.includes("already registered")) {
        throw new Error("E-mail já cadastrado")
      }
      console.error("[Supabase Register Error]", authError.message)
      throw new Error("Erro ao registrar usuário. Verifique os dados e tente novamente")
    }

    // Com confirmação de e-mail ligada o signUp não abre sessão: a conta e o perfil já existem, e a
    // página de cadastro manda para o login
    if (!authData.session) throw new Error("Sessão não iniciada após cadastro.")

    return authData.user
  },

  async loginUser({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      let mensagemAmigavel = "Ocorreu um erro inesperado. Tente novamente mais tarde."

      if (error.message === "Invalid login credentials") {
        mensagemAmigavel = "E-mail ou senha incorretos."
      } else if (error.status === 429) {
        mensagemAmigavel = "Muitas tentativas. Aguarde um momento e tente novamente."
      } else if (error.message.includes("Email not confirmed")) {
        mensagemAmigavel = "Por favor, confirme seu e-mail antes de entrar."
      } else {
        // Falhas estruturais ou de banco apenas no console
        console.error("[Supabase Login Error]:", error.message)
      }

      throw new Error(mensagemAmigavel)
    }

    return data.user
  },

  async getSession() {
    const { data } = await supabase.auth.getSession()
    return data.session
  },

  // Avisa a cada mudança de sessão, inclusive as vindas de outra aba (logout, login de outro
  // usuário, token renovado). Devolve a função que cancela a inscrição. O callback não pode esperar
  // outra chamada do Supabase dentro dele: o cliente segura um lock enquanto avisa, e a chamada
  // travaria. Quem precisa buscar algo agenda a busca para depois.
  onAuthChange(callback) {
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => callback(event, session))
    return () => subscription.unsubscribe()
  },

  async logoutUser() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("[Supabase Logout Error]", error.message)
      throw new Error("Erro ao sair. Tente novamente.")
    }
  }
}
