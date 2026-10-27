"use client"

import { useState, useEffect, useCallback } from "react"
import withAuth from "@/components/withAuth.js"
import { formatCurrency, formatDate, formatCategoryName } from "@/lib/utils/format"
import { PageContainer, PageHeader } from "@/components/layout"
import {
  Card,
  Button,
  Input,
  Textarea,
  Label,
  Badge,
  EmptyState,
  LoadingSpinner,
  Tabs,
  TabList,
  TabTrigger,
  TabPanel,
  Table,
  Dropdown
} from "@/components/ui"
import { TransactionForm } from "@/components/forms"
import { useToast } from "@/contexts/ToastContext"
import { transactionService } from "@/services/transactionService"
import { categoryService } from "@/services/categoryService"
import styles from "./page.module.css"

const PAYMENT_METHOD_OPTIONS = [
  { value: "cash", label: "Dinheiro" },
  { value: "credit_card", label: "Cartão de Crédito" },
  { value: "debit_card", label: "Cartão de Débito" },
  { value: "pix", label: "PIX" },
  { value: "bank_transfer", label: "Transferência Bancária" },
  { value: "other", label: "Outro" }
]

function EditIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function DeleteIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

const EMPTY_STATES = {
  expense: {
    icon: <path d="M21 12H3M18 6l-6 6 6 6" />,
    title: "Sem despesas ainda",
    description: "Adicione sua primeira despesa para começar",
    action: "Adicionar Despesa",
    noun: "despesa"
  },
  income: {
    icon: <path d="M12 5v14M19 12H5" />,
    title: "Sem receitas ainda",
    description: "Adicione sua primeira receita para começar",
    action: "Adicionar Receita",
    noun: "receita"
  }
}

function TransactionTableCard({
  title,
  variant,
  rows,
  columns,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  onAdd
}) {
  const empty = EMPTY_STATES[variant]
  const selected = rows.find(row => row.id === selectedId) || null

  return (
    <Card variant="default">
      <div className={styles.table_card_header}>
        <div className={styles.table_heading}>
          <h3 className={styles.table_title}>{title}</h3>
          <Badge variant={variant}>{rows.length}</Badge>
        </div>
        {rows.length > 0 && (
          <div className={styles.table_toolbar}>
            <span className={styles.toolbar_hint} aria-live="polite">
              {selected ? selected.title : `Selecione uma ${empty.noun}`}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!selected}
              onClick={() => onEdit(selected)}
            >
              <EditIcon />
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={styles.action_delete}
              disabled={!selected}
              onClick={() => onDelete(selected)}
            >
              <DeleteIcon />
              Excluir
            </Button>
          </div>
        )}
      </div>
      {rows.length === 0 ? (
        <EmptyState
          icon={
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              {empty.icon}
            </svg>
          }
          title={empty.title}
          description={empty.description}
          action={
            <Button variant="primary" size="sm" onClick={onAdd}>
              {empty.action}
            </Button>
          }
        />
      ) : (
        <Table
          columns={columns}
          data={rows}
          keyField="id"
          sortable
          stickyHeader
          selectedKey={selectedId}
          onSelectRow={onSelect}
        />
      )}
    </Card>
  )
}

function TransactionsContent() {
  const { error: toastError, success: toastSuccess } = useToast()
  const [activeTab, setActiveTab] = useState("list")
  const [categories, setCategories] = useState([])
  const [transactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [initialType, setInitialType] = useState("expense")
  const [editingTransaction, setEditingTransaction] = useState(null)
  // One selected row per table; actions in the card header act on it
  const [selectedIds, setSelectedIds] = useState({ expense: null, income: null })

  const categoryById = new Map(categories.map(c => [String(c.id), c]))
  // New transactions may only use active categories (US-009, CA-009.04)
  const activeCategories = categories.filter(c => !c.deleted_at)
  const rows = transactions.map(t => ({
    ...t,
    category_name: formatCategoryName(categoryById.get(String(t.category_id)))
  }))

  const expenseTransactions = rows.filter(t => t.type === "expense")
  const incomeTransactions = rows.filter(t => t.type === "income")

  const loadData = useCallback(async () => {
    try {
      const [allCategories, allTransactions] = await Promise.all([
        categoryService.getCategories({ includeDeleted: true }),
        transactionService.getTransactions()
      ])
      setCategories(allCategories)
      setTransactions(allTransactions)
      setErrorMessage("")
    } catch (error) {
      console.error("Error fetching data:", error)
      setErrorMessage("Não foi possível carregar as transações.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => void loadData(), 0)
    return () => clearTimeout(timer)
  }, [loadData])

  const handleDeleteTransaction = async id => {
    try {
      await transactionService.deleteTransaction(id)
      setTransactions(prev => prev.filter(t => t.id !== id))
      setShowDeleteConfirm(false)
      setSelectedTransaction(null)
      clearSelection()
      toastSuccess("Transação excluída com sucesso")
    } catch (error) {
      console.error("Error deleting transaction:", error)
      toastError(error.message || "Não foi possível excluir a transação.")
    }
  }

  const selectRow = (type, row) => setSelectedIds(prev => ({ ...prev, [type]: row?.id ?? null }))
  const clearSelection = () => setSelectedIds({ expense: null, income: null })

  const askDelete = transaction => {
    setSelectedTransaction(transaction)
    setShowDeleteConfirm(true)
  }

  const handleEditTransaction = transaction => {
    setEditingTransaction(transaction)
    setActiveTab("edit-transaction")
  }

  const handleCreateSubmit = async data => {
    try {
      await transactionService.createTransaction(data)
      toastSuccess("Transação adicionada com sucesso")
      await loadData()
      setActiveTab("list")
    } catch (error) {
      toastError(error.message || "Não foi possível salvar a transação.")
    }
  }

  const handleUpdateSubmit = async data => {
    try {
      await transactionService.updateTransaction({
        id: editingTransaction.id,
        ...data
      })
      setEditingTransaction(null)
      clearSelection()
      toastSuccess("Transação atualizada com sucesso")
      await loadData()
      setActiveTab("list")
    } catch (error) {
      toastError(error.message || "Não foi possível salvar a transação.")
    }
  }

  const transactionColumns = [
    { key: "title", header: "Título", sortable: true },
    {
      key: "category_name",
      header: "Categoria",
      sortable: true,
      render: value => value || "—"
    },
    { key: "amount", header: "Valor", sortable: true, render: value => formatCurrency(value) },
    { key: "occurred_on", header: "Data", sortable: true, render: formatDate },
    {
      key: "payment_method",
      header: "Pagamento",
      render: value =>
        PAYMENT_METHOD_OPTIONS.find(option => option.value === value)?.label || value || "—"
    }
  ]

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Transações" description="Gerencie suas receitas e despesas" />
        <div className={styles.loading_wrapper}>
          <LoadingSpinner size="lg" ariaLabel="Carregando transações" />
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Transações"
        description="Gerencie suas receitas e despesas"
        action={
          <div className={styles.header_badges}>
            <Badge variant="income">Receitas: {incomeTransactions.length}</Badge>
            <Badge variant="expense">Despesas: {expenseTransactions.length}</Badge>
          </div>
        }
      />

      {errorMessage && (
        <div className={styles.error_banner} role="alert">
          {errorMessage}
        </div>
      )}

      <Tabs value={activeTab} onChange={setActiveTab} className={styles.tabs}>
        <TabList>
          <TabTrigger value="list">Lista</TabTrigger>
          <TabTrigger value="add-transaction">Adicionar Transação</TabTrigger>
          {editingTransaction && (
            <TabTrigger value="edit-transaction">Atualizar Transação</TabTrigger>
          )}
        </TabList>

        <TabPanel value="list">
          <div className={styles.tables_grid}>
            <TransactionTableCard
              title="Despesas"
              variant="expense"
              rows={expenseTransactions}
              columns={transactionColumns}
              selectedId={selectedIds.expense}
              onSelect={row => selectRow("expense", row)}
              onEdit={handleEditTransaction}
              onDelete={askDelete}
              onAdd={() => {
                setInitialType("expense")
                setActiveTab("add-transaction")
              }}
            />
            <TransactionTableCard
              title="Receitas"
              variant="income"
              rows={incomeTransactions}
              columns={transactionColumns}
              selectedId={selectedIds.income}
              onSelect={row => selectRow("income", row)}
              onEdit={handleEditTransaction}
              onDelete={askDelete}
              onAdd={() => {
                setInitialType("income")
                setActiveTab("add-transaction")
              }}
            />
          </div>
        </TabPanel>

        <TabPanel value="add-transaction">
          <TransactionForm
            key={`add-${initialType}`}
            initialData={{ type: initialType }}
            categories={activeCategories}
            onSubmit={handleCreateSubmit}
            onCancel={() => setActiveTab("list")}
            submitLabel="Salvar Transação"
          />
        </TabPanel>

        {editingTransaction && (
          <TabPanel value="edit-transaction">
            <TransactionForm
              key={`edit-${editingTransaction.id}`}
              initialData={{
                id: editingTransaction.id,
                type: editingTransaction.type,
                category_id: String(editingTransaction.category_id),
                amount: String(editingTransaction.amount).replace(".", ","),
                title: editingTransaction.title,
                occurred_on: editingTransaction.occurred_on,
                description: editingTransaction.description || "",
                payment_method: editingTransaction.payment_method || ""
              }}
              categories={categories.filter(
                c => !c.deleted_at || c.id === editingTransaction.category_id
              )}
              onSubmit={handleUpdateSubmit}
              onCancel={() => {
                setActiveTab("list")
                setEditingTransaction(null)
              }}
              submitLabel="Atualizar Transação"
            />
          </TabPanel>
        )}
      </Tabs>

      {showDeleteConfirm && selectedTransaction && (
        <div
          className={styles.modal_overlay}
          onClick={() => setShowDeleteConfirm(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-confirm-title"
        >
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 id="delete-confirm-title" className={styles.modal_title}>
              Excluir Transação
            </h2>
            <p className={styles.modal_text}>
              Tem certeza que deseja excluir <strong>{selectedTransaction.title}</strong>? Esta ação
              não pode ser desfeita.
            </p>
            <div className={styles.modal_actions}>
              <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDeleteTransaction(selectedTransaction.id)}
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}

export default withAuth(TransactionsContent)
