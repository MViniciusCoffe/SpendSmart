"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import withAuth from "@/components/withAuth.js"
import { PageContainer } from "@/components/layout"
import { Button, Input, Label, Card, Badge } from "@/components/ui"
import { useToast } from "@/contexts/ToastContext"
import { profileService } from "@/services/profileService"
import { authService } from "@/services/authServices"
import styles from "./page.module.css"

function SettingsPage() {
  const router = useRouter()
  const { error: toastError, success: toastSuccess } = useToast()

  const [nome, setNome] = useState("")
  const [senha, setSenha] = useState("")
  const [dataNascimento, setDataNascimento] = useState("")
  const [telefone, setTelefone] = useState("")

  const [errorMessage, setErrorMessage] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const isSaveDisabled = !nome && !senha && !dataNascimento && !telefone

  const handleEdit = async e => {
    e.preventDefault()

    try {
      await profileService.updateProfile({
        full_name: nome,
        password: senha,
        birth_date: dataNascimento,
        phone: telefone
      })

      setErrorMessage("")
      toastSuccess("Alterações salvas com sucesso!")

      // Limpar os campos para o usuário saber que foi salvo
      setNome("")
      setSenha("")
      setDataNascimento("")
      setTelefone("")
    } catch (error) {
      setErrorMessage(error.message)
      toastError(error.message)
    }
  }

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch("/api/deleteAccount", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${(await authService.getSession()).access_token}`
        }
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Não foi possível excluir a conta.")
      }
    } catch (error) {
      toastError(error.message)
      return
    }

    toastSuccess("Conta excluída com sucesso.")

    try {
      await authService.logoutUser()
    } catch (error) {
      console.error("[Supabase Logout Error]", error.message)
    }

    router.replace("/login")
  }

  const handleLogout = async () => {
    try {
      await authService.logoutUser()
      router.replace("/login")
    } catch (error) {
      toastError(error.message)
    }
  }

  return (
    <>
      <PageContainer>
        <div className={styles.app_content}>
          <Card variant="default" className={styles.formCard}>
            <form onSubmit={handleEdit}>
              <h1 className={styles.content_h1}>Configurações da Conta</h1>

              <div className={styles.form_group}>
                <Label htmlFor="nome_completo">Nome Completo</Label>
                <Input
                  id="nome_completo"
                  name="nome_completo"
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Seu nome completo"
                />
              </div>

              <div className={styles.form_group}>
                <Label htmlFor="senha">Nova Senha</Label>
                <Input
                  id="senha"
                  name="senha"
                  type="password"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="Sua nova senha"
                  autoComplete="new-password"
                />
                <p className={styles.help_text}>Deixe em branco para manter a senha atual</p>
              </div>

              <div className={styles.form_group}>
                <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                <Input
                  id="data_nascimento"
                  name="data_nascimento"
                  type="date"
                  value={dataNascimento}
                  onChange={e => setDataNascimento(e.target.value)}
                />
              </div>

              <div className={styles.form_group}>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  name="telefone"
                  type="tel"
                  value={telefone}
                  onChange={e => setTelefone(e.target.value)}
                  placeholder="Seu telefone"
                  maxLength={20}
                />
              </div>

              {errorMessage && (
                <div className={styles.error_banner} role="alert">
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className={styles.button_group}>
                <Button type="submit" variant="primary" disabled={isSaveDisabled}>
                  Salvar Alterações
                </Button>
              </div>

              <div className={styles.divider} />

              <div className={styles.danger_zone}>
                <h2 className={styles.danger_title}>Zona de Perigo</h2>
                <p className={styles.danger_description}>
                  As ações abaixo são irreversíveis. Por favor, tenha certeza antes de prosseguir.
                </p>

                <div className={styles.danger_actions}>
                  <Button variant="ghost" onClick={handleLogout}>
                    Sair da Conta
                  </Button>
                  <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
                    Excluir Conta
                  </Button>
                </div>
              </div>
            </form>
          </Card>

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div
              className={styles.modal_overlay}
              onClick={() => setShowDeleteConfirm(false)}
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-confirm-title"
            >
              <div className={styles.modal_content} onClick={e => e.stopPropagation()}>
                <h2 id="delete-confirm-title" className={styles.modal_title}>
                  Excluir Conta
                </h2>
                <p className={styles.modal_description}>
                  Tem certeza que deseja excluir sua conta? Todos os seus dados serão apagados para
                  sempre. Esta ação não pode ser desfeita.
                </p>
                <div className={styles.modal_actions}>
                  <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
                    Cancelar
                  </Button>
                  <Button variant="danger" onClick={handleDeleteConfirm}>
                    Excluir Minha Conta
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </PageContainer>
    </>
  )
}

export default withAuth(SettingsPage)
