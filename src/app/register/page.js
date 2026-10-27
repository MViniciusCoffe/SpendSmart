"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { AuthShell, AuthError, AuthField, AuthForm, AuthRow } from "@/components/layout"
import { Button, Input, Label } from "@/components/ui"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/contexts/ToastContext"

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
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
      // Register through the context so the header knows the user right away
      await register({
        email,
        password,
        full_name: fullName,
        birth_date: birthDate,
        phone
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
    <AuthShell
      title="Crie sua conta"
      subtitle="Comece a organizar suas finanças em poucos minutos."
      footer={
        <>
          Já tem conta? <Link href="/login">Entrar</Link>
        </>
      }
    >
      <AuthForm onSubmit={handleRegister}>
        <AuthField>
          <Label htmlFor="full_name" required>
            Nome completo
          </Label>
          <Input
            type="text"
            id="full_name"
            name="full_name"
            autoComplete="name"
            placeholder="Seu nome"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            required
          />
        </AuthField>

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

        <AuthField hint="Mínimo de 6 caracteres">
          <Label htmlFor="password" required>
            Senha
          </Label>
          <Input
            type="password"
            id="password"
            name="password"
            autoComplete="new-password"
            placeholder="Crie uma senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </AuthField>

        <AuthRow>
          <AuthField>
            <Label htmlFor="birth_date" required>
              Data de nascimento
            </Label>
            <Input
              type="date"
              id="birth_date"
              name="birth_date"
              autoComplete="bday"
              value={birthDate}
              onChange={e => setBirthDate(e.target.value)}
              required
            />
          </AuthField>

          <AuthField hint="Opcional">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              type="tel"
              id="phone"
              name="phone"
              autoComplete="tel"
              placeholder="(84) 99999-9999"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </AuthField>
        </AuthRow>

        <AuthError>{errorMessage}</AuthError>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
          disabled={!fullName || !email || !password || !birthDate}
        >
          Criar conta
        </Button>
      </AuthForm>
    </AuthShell>
  )
}
