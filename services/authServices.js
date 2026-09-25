import { supabase } from '../infra/supabase';

export const authService = {
  async registerUser({ email, password, nomeCompleto, dataNascimento, telefone }) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        console.error("[Supabase Register Error]", authError.message);

        if (authError.message.includes("already registered")) {
          throw new Error("E-mail já cadastrado");
        }
        throw new Error("Erro ao registrar usuário. Verifique os dados e tente novamente");
      }

      const response = await fetch('/api/createProfile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: authData.user.id,
          nome_completo: nomeCompleto,
          data_nascimento: dataNascimento,
          telefone: telefone
        })
      });

      if (!response.ok) {
        throw new Error("Conta criada, mas houve um problema ao salvar dados adicionais");
      }

      return authData.user;
    } catch (error) {
      throw error;
    };
  },

  async loginUser({ email, password }) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        let mensagemAmigavel = "Ocorreu um erro inesperado. Tente novamente mais tarde.";

        if (error.message === "Invalid login credentials") {
          mensagemAmigavel = "E-mail ou senha incorretos.";
        } else if (error.status === 429) {
          mensagemAmigavel = "Muitas tentativas. Aguarde um momento e tente novamente.";
        } else if (error.message.includes("Email not confirmed")) {
          mensagemAmigavel = "Por favor, confirme seu e-mail antes de entrar.";
        } else {

          // Falhas estruturais ou de banco apenas no console
          console.error("[Supabase Login Error]:", error.message);
        }

        throw new Error(mensagemAmigavel);
      }

      return data.user;
    } catch (error) {
      throw error;
    }
  },

  async getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  async logoutUser() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("[Supabase Logout Error]", error.message);
      throw new Error("Erro ao sair. Tente novamente.");
    }
  }
};