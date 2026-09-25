import Link from "next/link";
import styles from "./register.module.css";
import { useState } from "react";
import { useRouter } from "next/router";
import { authService } from "../services/authServices";

export default function RegisterPage() {
  const router = useRouter();

  const [nomeCompleto, setNomeCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [telefone, setTelefone] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Função para criar usuário
  const handleRegister = async (e) => {
    e.preventDefault();

    if (!nomeCompleto || !email || !senha || !dataNascimento) {
      setErrorMessage("Preencha todos os campos obrigatórios");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      await authService.registerUser({
        email: email,
        password: senha,
        nomeCompleto: nomeCompleto,
        dataNascimento: dataNascimento,
        telefone: telefone
      });

      alert("Usuário criado com sucesso! Faça login para continuar.");
      router.push("/login");
    } catch (error) {
      setErrorMessage(`Erro ao criar usuário. Tente novamente. ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className={styles.login_content}>
        <div className={styles.login}>
          <Link href="/" className={styles.back_button}>
            Voltar
          </Link>
          <h2>Criar Usuário</h2>
          <form onSubmit={handleRegister}>
            <div>
              <div className={styles.input_group}>
                <label htmlFor="nomeCompleto">Nome Completo:</label>
                <input
                  type="text"
                  id="nomeCompleto"
                  name="nomeCompleto"
                  placeholder="Digite seu nome completo"
                  value={nomeCompleto}
                  onChange={(e) => setNomeCompleto(e.target.value)}
                  required
                />
              </div>

              <div className={styles.input_group}>
                <label htmlFor="email">E-mail:</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Digite seu e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className={styles.input_group}>
                <label htmlFor="password">Senha:</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Digite sua senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                />
              </div>

              <div className={styles.input_group}>
                <label htmlFor="dataNascimento">Data de Nascimento:</label>
                <input
                  type="date"
                  id="dataNascimento"
                  name="dataNascimento"
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  required
                />
              </div>

              <div className={styles.input_group}>
                <label htmlFor="telefone">Telefone:</label>
                <input
                  type="tel"
                  id="telefone"
                  name="telefone"
                  placeholder="Digite seu telefone (opcional)"
                  value={telefone}
                  maxLength={20}
                  onChange={(e) => setTelefone(e.target.value)}
                />
              </div>

              {errorMessage && (
                <p className={styles.error_message}>{errorMessage}</p>
              )}
            </div>

            <div className={styles.button_group}>
              <Link href="/login" className={styles.login_button}>
                Entrar
              </Link>
              <button
                type="submit"
                className={styles.create_button}
                disabled={isLoading || !nomeCompleto || !email || !senha || !dataNascimento}
              >
                {isLoading ? "Criando..." : "Criar conta"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
