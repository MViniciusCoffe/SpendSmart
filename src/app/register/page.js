"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import styles from "./register.module.css"
import { useState } from "react"
import { authService } from "../../services/authServices"
import { useToast } from "../../contexts/ToastContext"

export default function RegisterPage() {
  const router = useRouter()
  const { success } = useToast()

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [phone, setPhone] = useState("")

  const [errorMessage, setErrorMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleRegister = async e => {
    e.preventDefault()

    if (!fullName || !email || !password || !birthDate) {
      setErrorMessage("Preencha todos os campos obrigatórios")
      return
    }

    if (password.length < 6) {
      setErrorMessage("A senha deve ter pelo menos 6 caracteres")
      return
    }

    setIsLoading(true)
    setErrorMessage("")

    try {
      await authService.registerUser({
        email,
        password: password,
        full_name: fullName,
        birth_date: birthDate,
        phone: phone
      })

      router.push("/dashboard")
    } catch (error) {
      if (error.message === "Sessão não iniciada após cadastro.") {
        success("Conta criada! Faça login para continuar.")
        router.push("/login")
      } else {
        setErrorMessage(`Erro ao criar usuário. Tente novamente. ${error.message}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

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
                <label htmlFor="full_name">Nome Completo:</label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  placeholder="Digite seu nome completo"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
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
                  onChange={e => setEmail(e.target.value)}
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
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>

              <div className={styles.input_group}>
                <label htmlFor="birth_date">Data de Nascimento:</label>
                <input
                  type="date"
                  id="birth_date"
                  name="birth_date"
                  value={birthDate}
                  onChange={e => setBirthDate(e.target.value)}
                  required
                />
              </div>

              <div className={styles.input_group}>
                <label htmlFor="phone">Telefone:</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  placeholder="Digite seu telefone (opcional)"
                  value={phone}
                  maxLength={20}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>

              {errorMessage && <p className={styles.error_message}>{errorMessage}</p>}
            </div>

            <div className={styles.button_group}>
              <Link href="/login" className={styles.login_button}>
                Entrar
              </Link>
              <button
                type="submit"
                className={styles.create_button}
                disabled={
                  isLoading || !fullName || !email || !password || password.length < 6 || !birthDate
                }
              >
                {isLoading ? "Criando..." : "Criar conta"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
