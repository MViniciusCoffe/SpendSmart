"use client"

import { useEffect, useState, useCallback } from "react"
import withAuth from "@/components/withAuth.js"
import { PageContainer } from "@/components/layout"
import { Button, Input, Textarea, Label, Dropdown, Card } from "@/components/ui"
import { useToast } from "@/contexts/ToastContext"
import { categoryService } from "@/services/categoryService"
import styles from "./page.module.css"

const TYPE_OPTIONS = [
  { value: "income", label: "Receita" },
  { value: "expense", label: "Despesa" }
]

function CategoriesPage() {
  const { toast, error: toastError, success: toastSuccess } = useToast()

  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Add category form state
  const [addForm, setAddForm] = useState({
    name: "",
    type: "income",
    description: "",
    color: "#FFFFFF"
  })

  // Edit category form state
  const [editForm, setEditForm] = useState({
    id: null,
    name: "",
    type: "income",
    description: "",
    color: "#FFFFFF"
  })

  // Delete category state
  const [deleteId, setDeleteId] = useState(null)
  const [deleteDetails, setDeleteDetails] = useState(null)

  // Active tab
  const [activeTab, setActiveTab] = useState("add")

  // Error messages
  const [errors, setErrors] = useState({})

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await categoryService.getCategories()
      setCategories(data)
    } catch (err) {
      console.error("[Fetch Categories Error]", err)
      toastError("Erro ao carregar categorias")
    } finally {
      setIsLoading(false)
    }
  }, [toastError])

  useEffect(() => {
    const timer = setTimeout(() => void fetchCategories(), 0)
    return () => clearTimeout(timer)
  }, [fetchCategories])

  const validateAddForm = () => {
    const newErrors = {}
    if (!addForm.name.trim()) newErrors.name = "Nome é obrigatório"
    if (addForm.name.trim().length > 50) newErrors.name = "Nome deve ter no máximo 50 caracteres"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateEditForm = () => {
    const newErrors = {}
    if (!editForm.name.trim()) newErrors.name = "Nome é obrigatório"
    if (editForm.name.trim().length > 50) newErrors.name = "Nome deve ter no máximo 50 caracteres"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddSubmit = async e => {
    e.preventDefault()
    if (!validateAddForm()) return

    try {
      await categoryService.createCategory(addForm)
      toastSuccess("Categoria adicionada com sucesso")
      setAddForm({ name: "", type: "income", description: "", color: "#FFFFFF" })
      await fetchCategories()
    } catch (err) {
      toastError(err.message || "Não foi possível adicionar a categoria")
    }
  }

  const handleEditSubmit = async e => {
    e.preventDefault()
    if (!validateEditForm() || !editForm.id) return

    try {
      await categoryService.updateCategory(editForm)
      toastSuccess("Categoria atualizada com sucesso")
      setEditForm({ id: null, name: "", type: "income", description: "", color: "#FFFFFF" })
      await fetchCategories()
    } catch (err) {
      toastError(err.message || "Não foi possível atualizar a categoria")
    }
  }

  const handleDeleteSubmit = async e => {
    e.preventDefault()
    if (!deleteId) return

    try {
      await categoryService.deleteCategory(deleteId)
      toastSuccess("Categoria excluída com sucesso")
      setDeleteId(null)
      setDeleteDetails(null)
      await fetchCategories()
    } catch (err) {
      toastError(err.message || "Não foi possível excluir a categoria")
    }
  }

  const handleEditSelect = id => {
    const category = categories.find(c => c.id === Number(id))
    if (category) {
      setEditForm({
        id: category.id,
        name: category.name,
        type: category.type,
        description: category.description || "",
        color: category.color || "#FFFFFF"
      })
    }
  }

  const handleDeleteSelect = id => {
    const category = categories.find(c => c.id === Number(id))
    if (category) {
      setDeleteId(category.id)
      setDeleteDetails(category)
    } else {
      setDeleteId(null)
      setDeleteDetails(null)
    }
  }

  const incomeCategories = categories.filter(c => c.type === "income" && !c.deleted_at)
  const expenseCategories = categories.filter(c => c.type === "expense" && !c.deleted_at)

  if (isLoading) {
    return (
      <>
        <PageContainer>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner} />
          </div>
        </PageContainer>
      </>
    )
  }

  return (
    <>
      <PageContainer>
        <div className={styles.app_content}>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab_button} ${activeTab === "add" ? styles.active_tab : ""}`}
              onClick={() => setActiveTab("add")}
            >
              Adicionar
            </button>
            <button
              className={`${styles.tab_button} ${activeTab === "edit" ? styles.active_tab : ""}`}
              onClick={() => setActiveTab("edit")}
            >
              Editar
            </button>
            <button
              className={`${styles.tab_button} ${activeTab === "delete" ? styles.active_tab : ""}`}
              onClick={() => setActiveTab("delete")}
            >
              Excluir
            </button>
          </div>

          {/* --- ABA ADICIONAR --- */}
          {activeTab === "add" && (
            <div style={{ width: "100%" }}>
              <Card variant="default" className={styles.formCard}>
                <form onSubmit={handleAddSubmit}>
                  <h1 className={styles.content_h1}>Adicionar Categoria</h1>

                  <div className={styles.form_group}>
                    <Label htmlFor="name" required>
                      Nome da Categoria
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={addForm.name}
                      onChange={e => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nome da categoria"
                      maxLength={50}
                      error={errors.name}
                    />
                    {errors.name && <p className={styles.error_message}>{errors.name}</p>}
                  </div>

                  <div className={styles.form_group}>
                    <Label htmlFor="type" required>
                      Tipo
                    </Label>
                    <Dropdown
                      id="type"
                      name="type"
                      options={TYPE_OPTIONS}
                      value={addForm.type}
                      onChange={value => setAddForm(prev => ({ ...prev, type: value }))}
                      required
                    />
                  </div>

                  <div className={styles.form_group}>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={addForm.description}
                      onChange={e => setAddForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição opcional"
                      rows={3}
                    />
                  </div>

                  <div className={styles.form_group}>
                    <Label htmlFor="color">Cor</Label>
                    <div className={styles.color_picker_container}>
                      <input
                        type="color"
                        id="color"
                        name="color"
                        value={addForm.color}
                        onChange={e => setAddForm(prev => ({ ...prev, color: e.target.value }))}
                        className={styles.color_input}
                      />
                      <div
                        className={styles.color_display}
                        style={{ backgroundColor: addForm.color }}
                      />
                      <span className={styles.hex_value}>{addForm.color}</span>
                    </div>
                  </div>

                  <div className={styles.button_group}>
                    <Button type="submit" variant="primary" disabled={!addForm.name.trim()}>
                      Salvar Categoria
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          )}
          {/* --- ABA EDITAR --- */}
          {activeTab === "edit" && (
            <div style={{ maxWidth: 700, margin: "0 auto" }}>
              <Card variant="default" className={styles.formCard}>
                <form onSubmit={handleEditSubmit}>
                  <h1 className={styles.content_h1}>Editar Categoria</h1>

                  {categories.length === 0 && (
                    <p className={styles.empty_message}>
                      Você ainda não tem categorias. Crie uma na aba &quot;Adicionar&quot;.
                    </p>
                  )}

                  <div className={styles.form_group}>
                    <Label htmlFor="categoria_edit">Selecionar Categoria</Label>
                    <Dropdown
                      id="categoria_edit"
                      name="categoria_edit"
                      options={categories.map(c => ({ value: c.id, label: c.name }))}
                      value={editForm.id || ""}
                      onChange={value => {
                        if (value) handleEditSelect(value)
                        else
                          setEditForm({
                            id: null,
                            name: "",
                            type: "income",
                            description: "",
                            color: "#FFFFFF"
                          })
                      }}
                      placeholder="Selecione uma categoria"
                    />
                  </div>

                  <div className={styles.form_group}>
                    <Label htmlFor="edit_name" required>
                      Nome da Categoria
                    </Label>
                    <Input
                      id="edit_name"
                      name="edit_name"
                      type="text"
                      value={editForm.name}
                      onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nome da categoria"
                      maxLength={50}
                      error={errors.name}
                      disabled={!editForm.id}
                    />
                    {errors.name && <p className={styles.error_message}>{errors.name}</p>}
                  </div>

                  <div className={styles.form_group}>
                    <Label htmlFor="edit_type" required>
                      Tipo
                    </Label>
                    <Dropdown
                      id="edit_type"
                      name="edit_type"
                      options={TYPE_OPTIONS}
                      value={editForm.type}
                      onChange={value => setEditForm(prev => ({ ...prev, type: value }))}
                      disabled={!editForm.id}
                    />
                  </div>

                  <div className={styles.form_group}>
                    <Label htmlFor="edit_description">Descrição</Label>
                    <Textarea
                      id="edit_description"
                      name="edit_description"
                      value={editForm.description}
                      onChange={e =>
                        setEditForm(prev => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="Descrição opcional"
                      rows={3}
                      disabled={!editForm.id}
                    />
                  </div>

                  <div className={styles.form_group}>
                    <Label htmlFor="edit_color">Cor</Label>
                    <input
                      type="color"
                      id="edit_color"
                      name="edit_color"
                      value={editForm.color}
                      onChange={e => setEditForm(prev => ({ ...prev, color: e.target.value }))}
                      className={styles.color_input}
                      disabled={!editForm.id}
                    />
                  </div>

                  <div className={styles.button_group}>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={!editForm.id || !editForm.name.trim()}
                    >
                      Atualizar Categoria
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          )}
          {/* --- ABA EXCLUIR --- */}
          {activeTab === "delete" && (
            <div style={{ maxWidth: 700, margin: "0 auto" }}>
              <Card variant="default" className={styles.formCard}>
                <form onSubmit={handleDeleteSubmit}>
                  <h1 className={styles.content_h1}>Excluir Categoria</h1>

                  {categories.length === 0 && (
                    <p className={styles.empty_message}>
                      Você ainda não tem categorias. Crie uma na aba &quot;Adicionar&quot;.
                    </p>
                  )}

                  <div className={styles.form_group}>
                    <Label htmlFor="category_delete">Selecionar Categoria</Label>
                    <Dropdown
                      id="category_delete"
                      name="category_delete"
                      options={categories.map(c => ({ value: c.id, label: c.name }))}
                      value={deleteId || ""}
                      onChange={value => {
                        if (value) handleDeleteSelect(value)
                        else {
                          setDeleteId(null)
                          setDeleteDetails(null)
                        }
                      }}
                      placeholder="Selecione uma categoria"
                    />
                  </div>

                  {deleteDetails && (
                    <div className={styles.category_details}>
                      <h2>Detalhes da Categoria</h2>
                      <p>
                        <strong>Nome:</strong> {deleteDetails.name}
                      </p>
                      <p>
                        <strong>Tipo:</strong>{" "}
                        {deleteDetails.type === "income" ? "Receita" : "Despesa"}
                      </p>
                      <p>
                        <strong>Descrição:</strong>{" "}
                        {deleteDetails.description || "Nenhuma descrição informada."}
                      </p>
                      <p>
                        <strong>Cor:</strong>
                        <span
                          style={{
                            display: "inline-block",
                            width: "20px",
                            height: "20px",
                            backgroundColor: deleteDetails.color,
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-sm)",
                            verticalAlign: "middle",
                            marginLeft: "var(--space-2)"
                          }}
                        />
                        {deleteDetails.color}
                      </p>
                    </div>
                  )}

                  <div className={styles.button_group}>
                    <Button type="submit" variant="danger" disabled={!deleteId}>
                      Excluir Categoria
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          )}
        </div>
      </PageContainer>
    </>
  )
}

export default withAuth(CategoriesPage)
