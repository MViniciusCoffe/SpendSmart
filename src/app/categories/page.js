"use client"

import { useEffect, useState, useCallback } from "react"
import withAuth from "@/components/withAuth.js"
import { PageContainer } from "@/components/layout"
import {
  Button,
  Label,
  Dropdown,
  Card,
  LoadingSpinner,
  Tabs,
  TabList,
  TabTrigger,
  TabPanel
} from "@/components/ui"
import { CategoryForm } from "@/components/forms"
import { useToast } from "@/contexts/ToastContext"
import { categoryService } from "@/services/categoryService"
import styles from "./page.module.css"

const TYPE_LABELS = { income: "Receita", expense: "Despesa" }

function CategoriesPage() {
  const { error: toastError, success: toastSuccess } = useToast()

  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("add")
  // Bumped after a successful create so the add form remounts empty
  const [addFormKey, setAddFormKey] = useState(0)
  const [editId, setEditId] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const editCategory = categories.find(c => c.id === editId) || null
  const deleteCategory = categories.find(c => c.id === deleteId) || null
  const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }))

  const fetchCategories = useCallback(async () => {
    try {
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

  // Runs a service call with shared saving state, toast feedback and list refresh
  const runAction = async (action, successMessage, fallbackError) => {
    setIsSaving(true)
    try {
      await action()
      toastSuccess(successMessage)
      await fetchCategories()
      return true
    } catch (err) {
      toastError(err.message || fallbackError)
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const handleAdd = async formData => {
    const ok = await runAction(
      () => categoryService.createCategory(formData),
      "Categoria adicionada com sucesso",
      "Não foi possível adicionar a categoria"
    )
    if (ok) setAddFormKey(key => key + 1)
  }

  const handleEdit = async formData => {
    const ok = await runAction(
      () => categoryService.updateCategory({ ...formData, id: editId }),
      "Categoria atualizada com sucesso",
      "Não foi possível atualizar a categoria"
    )
    if (ok) setEditId(null)
  }

  const handleDelete = async event => {
    event.preventDefault()
    if (!deleteId) return
    const ok = await runAction(
      () => categoryService.deleteCategory(deleteId),
      "Categoria excluída com sucesso",
      "Não foi possível excluir a categoria"
    )
    if (ok) setDeleteId(null)
  }

  const emptyMessage = categories.length === 0 && (
    <p className={styles.empty_message}>
      Você ainda não tem categorias. Crie uma na aba &quot;Adicionar&quot;.
    </p>
  )

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingSpinner size="lg" ariaLabel="Carregando categorias" />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className={styles.app_content}>
        <Tabs value={activeTab} onChange={setActiveTab}>
          <TabList className={styles.tab_list}>
            <TabTrigger value="add">Adicionar</TabTrigger>
            <TabTrigger value="edit">Editar</TabTrigger>
            <TabTrigger value="delete">Excluir</TabTrigger>
          </TabList>

          <TabPanel value="add">
            <CategoryForm
              key={addFormKey}
              title="Adicionar Categoria"
              onSubmit={handleAdd}
              isLoading={isSaving}
            />
          </TabPanel>

          <TabPanel value="edit">
            <Card variant="default" className={styles.formCard}>
              <h1 className={styles.content_h1}>Editar Categoria</h1>
              {emptyMessage}
              <div className={styles.form_group}>
                <Label htmlFor="category_edit">Selecionar Categoria</Label>
                <Dropdown
                  id="category_edit"
                  name="category_edit"
                  options={categoryOptions}
                  value={editId || ""}
                  onChange={value => setEditId(value ? Number(value) : null)}
                  placeholder="Selecione uma categoria"
                />
              </div>
            </Card>

            {editCategory && (
              <CategoryForm
                key={editCategory.id}
                className={styles.stacked_card}
                initialData={{
                  name: editCategory.name,
                  type: editCategory.type,
                  description: editCategory.description || "",
                  color: editCategory.color || "#FFFFFF"
                }}
                onSubmit={handleEdit}
                onCancel={() => setEditId(null)}
                isLoading={isSaving}
                submitLabel="Atualizar Categoria"
              />
            )}
          </TabPanel>

          <TabPanel value="delete">
            <Card variant="default" className={styles.formCard}>
              <form onSubmit={handleDelete}>
                <h1 className={styles.content_h1}>Excluir Categoria</h1>
                {emptyMessage}
                <div className={styles.form_group}>
                  <Label htmlFor="category_delete">Selecionar Categoria</Label>
                  <Dropdown
                    id="category_delete"
                    name="category_delete"
                    options={categoryOptions}
                    value={deleteId || ""}
                    onChange={value => setDeleteId(value ? Number(value) : null)}
                    placeholder="Selecione uma categoria"
                  />
                </div>

                {deleteCategory && (
                  <div className={styles.category_details}>
                    <h2>Detalhes da Categoria</h2>
                    <p>
                      <strong>Nome:</strong> {deleteCategory.name}
                    </p>
                    <p>
                      <strong>Tipo:</strong> {TYPE_LABELS[deleteCategory.type]}
                    </p>
                    <p>
                      <strong>Descrição:</strong>{" "}
                      {deleteCategory.description || "Nenhuma descrição informada."}
                    </p>
                    <p>
                      <strong>Cor:</strong>
                      <span
                        className={styles.color_swatch}
                        style={{ backgroundColor: deleteCategory.color }}
                      />
                      {deleteCategory.color}
                    </p>
                  </div>
                )}

                <div className={styles.button_group}>
                  <Button type="submit" variant="danger" disabled={!deleteId} loading={isSaving}>
                    Excluir Categoria
                  </Button>
                </div>
              </form>
            </Card>
          </TabPanel>
        </Tabs>
      </div>
    </PageContainer>
  )
}

export default withAuth(CategoriesPage)
