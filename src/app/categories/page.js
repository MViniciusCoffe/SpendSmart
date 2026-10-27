"use client"

import { useEffect, useState, useCallback } from "react"
import withAuth from "@/components/withAuth.js"
import { PageContainer, PageHeader } from "@/components/layout"
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
import { ConfirmDialog } from "@/components/feedback"
import { useToast } from "@/contexts/ToastContext"
import { categoryService } from "@/services/categoryService"
import styles from "./page.module.css"

const TYPE_LABELS = { income: "Receita", expense: "Despesa" }

function CategoriesPage() {
  const { error: toastError, success: toastSuccess } = useToast()

  // Includes soft-deleted categories so they can be restored (US-009)
  const [allCategories, setAllCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("add")
  // Bumped after a successful create so the add form remounts empty
  const [addFormKey, setAddFormKey] = useState(0)
  const [editId, setEditId] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  // Transactions using the category picked in the delete tab (null while loading)
  const [deleteUsage, setDeleteUsage] = useState(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  // Set when an edit changes the type of a category that already has transactions
  const [pendingTypeChange, setPendingTypeChange] = useState(null)

  const categories = allCategories.filter(c => !c.deleted_at)
  const deletedCategories = allCategories.filter(c => c.deleted_at)
  const editCategory = categories.find(c => c.id === editId) || null
  const deleteCategory = categories.find(c => c.id === deleteId) || null
  const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }))

  const fetchCategories = useCallback(async () => {
    try {
      const data = await categoryService.getCategories({ includeDeleted: true })
      setAllCategories(data)
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

  const saveEdit = async (formData, updateTransactionsType = false) => {
    const ok = await runAction(
      () => categoryService.updateCategory({ ...formData, id: editId, updateTransactionsType }),
      "Categoria atualizada com sucesso",
      "Não foi possível atualizar a categoria"
    )
    if (ok) setEditId(null)
  }

  const handleEdit = async formData => {
    if (formData.type !== editCategory.type) {
      try {
        const transactionCount = await categoryService.countTransactions(editId)
        if (transactionCount > 0) {
          setPendingTypeChange({ formData, transactionCount })
          return
        }
      } catch (err) {
        toastError(err.message)
        return
      }
    }
    await saveEdit(formData)
  }

  const confirmTypeChange = async () => {
    const { formData } = pendingTypeChange
    setPendingTypeChange(null)
    await saveEdit(formData, true)
  }

  const selectDeleteCategory = async id => {
    setDeleteId(id)
    setDeleteUsage(null)
    if (!id) return
    try {
      setDeleteUsage(await categoryService.countTransactions(id))
    } catch (err) {
      toastError(err.message)
    }
  }

  const confirmDelete = async () => {
    setShowDeleteDialog(false)
    const ok = await runAction(
      () => categoryService.deleteCategory(deleteId),
      "Categoria excluída com sucesso",
      "Não foi possível excluir a categoria"
    )
    if (ok) selectDeleteCategory(null)
  }

  // Categories in use can be deleted too (US-009), but the user sees the impact first
  const handleDelete = async event => {
    event.preventDefault()
    if (!deleteId) return
    if (deleteUsage > 0) {
      setShowDeleteDialog(true)
      return
    }
    await confirmDelete()
  }

  const handleRestore = id =>
    runAction(
      () => categoryService.restoreCategory(id),
      "Categoria restaurada com sucesso",
      "Não foi possível restaurar a categoria"
    )

  const emptyMessage = categories.length === 0 && (
    <p className={styles.empty_message}>
      Você ainda não tem categorias. Crie uma na aba &quot;Adicionar&quot;.
    </p>
  )

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Categorias" description="Organize suas receitas e despesas" />
        <LoadingSpinner size="lg" ariaLabel="Carregando categorias" />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader title="Categorias" description="Organize suas receitas e despesas" />
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
              <h2 className={styles.content_h1}>Editar Categoria</h2>
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
                <h2 className={styles.content_h1}>Excluir Categoria</h2>
                {emptyMessage}
                <div className={styles.form_group}>
                  <Label htmlFor="category_delete">Selecionar Categoria</Label>
                  <Dropdown
                    id="category_delete"
                    name="category_delete"
                    options={categoryOptions}
                    value={deleteId || ""}
                    onChange={value => selectDeleteCategory(value ? Number(value) : null)}
                    placeholder="Selecione uma categoria"
                  />
                </div>

                {deleteCategory && (
                  <div className={styles.category_details}>
                    <h3>Detalhes da Categoria</h3>
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
                    <p>
                      <strong>Quantidade de usos:</strong>{" "}
                      {deleteUsage === null ? "…" : deleteUsage}
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

            {deletedCategories.length > 0 && (
              <Card variant="default" className={`${styles.formCard} ${styles.stacked_card}`}>
                <h2 className={styles.section_title}>Categorias excluídas</h2>
                <p className={styles.section_hint}>
                  Restaurar uma categoria faz ela voltar à lista e ao formulário de novas
                  transações.
                </p>
                <ul className={styles.deleted_list}>
                  {deletedCategories.map(category => (
                    <li key={category.id} className={styles.deleted_item}>
                      <span
                        className={styles.color_swatch}
                        style={{ backgroundColor: category.color }}
                      />
                      <span className={styles.deleted_name}>{category.name}</span>
                      <span className={styles.deleted_type}>{TYPE_LABELS[category.type]}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(category.id)}
                        disabled={isSaving}
                      >
                        Restaurar
                      </Button>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </TabPanel>
        </Tabs>
      </div>

      <ConfirmDialog
        open={showDeleteDialog && Boolean(deleteCategory)}
        title={`Excluir "${deleteCategory?.name}"?`}
        confirmLabel="Excluir categoria"
        loading={isSaving}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
      >
        <p>
          {deleteUsage === 1
            ? "1 transação usa esta categoria."
            : `${deleteUsage} transações usam esta categoria.`}{" "}
          Elas não serão apagadas: continuam no histórico e nos totais do dashboard, com a categoria
          exibida como &quot;{deleteCategory?.name} (deletada)&quot;.
        </p>
        <p>A categoria deixa de aparecer na lista e não poderá ser usada em novas transações.</p>
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(pendingTypeChange)}
        title="Mudar tipo da categoria?"
        confirmLabel="Mudar categoria e transações"
        variant="primary"
        loading={isSaving}
        onConfirm={confirmTypeChange}
        onCancel={() => setPendingTypeChange(null)}
      >
        {pendingTypeChange && (
          <p>
            Esta categoria tem {pendingTypeChange.transactionCount}{" "}
            {pendingTypeChange.transactionCount === 1 ? "transação" : "transações"}. Para manter os
            totais corretos, {pendingTypeChange.transactionCount === 1 ? "ela" : "elas"} também
            passar{pendingTypeChange.transactionCount === 1 ? "á" : "ão"} a ser{" "}
            {TYPE_LABELS[pendingTypeChange.formData.type].toLowerCase()}.
          </p>
        )}
      </ConfirmDialog>
    </PageContainer>
  )
}

export default withAuth(CategoriesPage)
