"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import styles from "./login.module.css"
import { useEffect, useState } from "react"
import { authService } from "../../services/authServices"

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Redirect to "/dashboard" when a Supabase session already exists
  useEffect(() => {
    const checkSession = async () => {
      const session = await authService.getSession()
      if (session) {
        router.push("/dashboard")
      }
    }
    checkSession()
  }, [router])

  const handleLogin = async e => {
    e.preventDefault()

    if (!email || !password) {
      setErrorMessage("Preencha todos os campos obrigatórios")
      return
    }

    setIsLoading(true)
    setErrorMessage("")

    try {
      // Supabase valida credenciais
      await authService.loginUser({ email, password: password })

      // On success go to the dashboard; Supabase already persisted the session
      router.push("/dashboard")
    } catch (error) {
      setErrorMessage(error.message)
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
          <h2>Fazer Login</h2>
          <form onSubmit={handleLogin}>
            <div>
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
                  required
                />
              </div>

              {errorMessage && <p className={styles.error_message}>{errorMessage}</p>}
            </div>

            <div className={styles.button_group}>
              <button
                type="submit"
                className={styles.login_button}
                disabled={isLoading || !email || !password}
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </button>
              <Link href="/register" className={styles.create_button}>
                Criar conta
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
