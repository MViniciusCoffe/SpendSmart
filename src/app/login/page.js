"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AuthShell, AuthError, AuthField, AuthForm } from "@/components/layout"
import { Button, Input, Label } from "@/components/ui"
import { useAuth } from "@/contexts/AuthContext"
import { authService } from "@/services/authServices"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Redirect to "/dashboard" when a Supabase session already exists
  useEffect(() => {
    const checkSession = async () => {
      const session = await authService.getSession()
      if (session) router.replace("/dashboard")
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
      // Login through the context so the header knows the user right away
      await login(email, password)
      router.push("/dashboard")
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell
      title="Bem-vindo de volta"
      subtitle="Entre para acompanhar suas receitas e despesas."
      footer={
        <>
          Ainda não tem conta? <Link href="/register">Criar conta</Link>
        </>
      }
    >
      <AuthForm onSubmit={handleLogin}>
        <AuthField>
          <Label htmlFor="email" required>
            E-mail
          </Label>
          <Input
            type="email"
            id="email"
            name="email"
            autoComplete="email"
            placeholder="voce@exemplo.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </AuthField>

        <AuthField>
          <Label htmlFor="password" required>
            Senha
          </Label>
          <Input
            type="password"
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder="Sua senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </AuthField>

        <AuthError>{errorMessage}</AuthError>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
          disabled={!email || !password}
        >
          Entrar
        </Button>
      </AuthForm>
    </AuthShell>
  )
}
