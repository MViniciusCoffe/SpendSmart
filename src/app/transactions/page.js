"use client"

import { useState, useEffect, useCallback } from "react"
import withAuth from "@/components/withAuth.js"
import { formatCurrency, formatDate } from "@/lib/utils/format"
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

  const categoryNameById = new Map(categories.map(c => [String(c.id), c.name]))
  const rows = transactions.map(t => ({
    ...t,
    category_name: categoryNameById.get(String(t.category_id)) || ""
  }))

  const expenseTransactions = rows.filter(t => t.type === "expense")
  const incomeTransactions = rows.filter(t => t.type === "income")

  const loadData = useCallback(async () => {
    try {
      const [allCategories, allTransactions] = await Promise.all([
        categoryService.getCategories(),
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
      toastSuccess("Transação excluída com sucesso")
    } catch (error) {
      console.error("Error deleting transaction:", error)
      toastError(error.message || "Não foi possível excluir a transação.")
    }
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
      toastSuccess("Transação atualizada com sucesso")
      await loadData()
      setActiveTab("list")
    } catch (error) {
      toastError(error.message || "Não foi possível salvar a transação.")
    }
  }

  const EditIcon = () => (
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

  const DeleteIcon = () => (
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
    },
    {
      key: "actions",
      header: "Ações",
      render: (_, row) => (
        <div className={styles.row_actions}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEditTransaction(row)}
            aria-label={`Editar ${row.title}`}
          >
            <EditIcon />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={styles.action_delete}
            onClick={() => {
              setSelectedTransaction(row)
              setShowDeleteConfirm(true)
            }}
            aria-label={`Excluir ${row.title}`}
          >
            <DeleteIcon />
            Excluir
          </Button>
        </div>
      )
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
            <Card variant="default">
              <div className={styles.table_card_header}>
                <h3 className={styles.table_title}>Despesas</h3>
                <Badge variant="expense">{expenseTransactions.length}</Badge>
              </div>
              {expenseTransactions.length === 0 ? (
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
                      <path d="M21 12H3M18 6l-6 6 6 6" />
                    </svg>
                  }
                  title="Sem despesas ainda"
                  description="Adicione sua primeira despesa para começar"
                  action={
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setInitialType("expense")
                        setActiveTab("add-transaction")
                      }}
                    >
                      Adicionar Despesa
                    </Button>
                  }
                />
              ) : (
                <Table
                  columns={transactionColumns}
                  data={expenseTransactions}
                  keyField="id"
                  sortable
                  stickyHeader
                />
              )}
            </Card>

            <Card variant="default">
              <div className={styles.table_card_header}>
                <h3 className={styles.table_title}>Receitas</h3>
                <Badge variant="income">{incomeTransactions.length}</Badge>
              </div>
              {incomeTransactions.length === 0 ? (
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
                      <path d="M12 5v14M19 12H5" />
                    </svg>
                  }
                  title="Sem receitas ainda"
                  description="Adicione sua primeira receita para começar"
                  action={
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setInitialType("income")
                        setActiveTab("add-transaction")
                      }}
                    >
                      Adicionar Receita
                    </Button>
                  }
                />
              ) : (
                <Table
                  columns={transactionColumns}
                  data={incomeTransactions}
                  keyField="id"
                  sortable
                  stickyHeader
                />
              )}
            </Card>
          </div>
        </TabPanel>

        <TabPanel value="add-transaction">
          <TransactionForm
            key={`add-${initialType}`}
            initialData={{ type: initialType }}
            categories={categories}
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
              categories={categories}
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
