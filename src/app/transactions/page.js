"use client"

import { useState, useEffect } from "react"
import withAuth from "@/components/withAuth.js"
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
  const [activeTab, setActiveTab] = useState("list")
  const [categories, setCategories] = useState([])
  const [transactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const expenseTransactions = transactions.filter(t => t.type === "expense")
  const incomeTransactions = transactions.filter(t => t.type === "income")

  const formatCurrency = value => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(value)
  }

  const formatDate = dateString => {
    if (!dateString) return "—"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
  }

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const allCategories = await categoryService.getCategories()
        setCategories(allCategories)

        const allTransactions = await transactionService.getTransactions()
        setTransactions(allTransactions)

        setErrorMessage("")
      } catch (error) {
        console.error("Error fetching data:", error)
        setErrorMessage("Não foi possível carregar as transações.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleRefresh = async () => {
    try {
      const allCategories = await categoryService.getCategories()
      setCategories(allCategories)

      const allTransactions = await transactionService.getTransactions()
      setTransactions(allTransactions)

      setErrorMessage("")
    } catch (error) {
      console.error("Error refreshing data:", error)
      setErrorMessage("Não foi possível atualizar as transações.")
    }
  }

  const handleDeleteTransaction = async id => {
    try {
      await transactionService.deleteTransaction(id)
      setTransactions(prev => prev.filter(t => t.id !== id))
      setShowDeleteConfirm(false)
      setSelectedTransaction(null)
    } catch (error) {
      console.error("Error deleting transaction:", error)
      setErrorMessage(error.message || "Não foi possível excluir a transação.")
    }
  }

  const handleFormSubmit = async data => {
    try {
      await transactionService.createTransaction(data)
      handleRefresh()
    } catch (error) {
      console.error("Error creating transaction:", error)
      setErrorMessage(error.message || "Não foi possível criar a transação.")
    }
  }

  const expenseColumns = [
    { key: "title", header: "Título", sortable: true },
    {
      key: "category",
      header: "Categoria",
      sortable: true,
      render: (_, row) => row.category?.name || "—"
    },
    { key: "amount", header: "Valor", sortable: true, render: value => formatCurrency(value) },
    { key: "occurred_on", header: "Data", sortable: true, render: formatDate },
    { key: "payment_method", header: "Pagamento", render: value => value || "—" },
    {
      key: "actions",
      header: "Ações",
      render: (_, row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedTransaction(row)
            setShowDeleteConfirm(true)
          }}
          aria-label={`Excluir ${row.title}`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </Button>
      )
    }
  ]

  const incomeColumns = [
    { key: "title", header: "Título", sortable: true },
    {
      key: "category",
      header: "Categoria",
      sortable: true,
      render: (_, row) => row.category?.name || "—"
    },
    { key: "amount", header: "Valor", sortable: true, render: value => formatCurrency(value) },
    { key: "occurred_on", header: "Data", sortable: true, render: formatDate },
    { key: "payment_method", header: "Pagamento", render: value => value || "—" },
    {
      key: "actions",
      header: "Ações",
      render: (_, row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedTransaction(row)
            setShowDeleteConfirm(true)
          }}
          aria-label={`Excluir ${row.title}`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </Button>
      )
    }
  ]

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Transações" description="Gerencie suas receitas e despesas" />
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-16)" }}>
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
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <Badge variant="income">Receitas: {incomeTransactions.length}</Badge>
            <Badge variant="expense">Despesas: {expenseTransactions.length}</Badge>
          </div>
        }
      />

      {errorMessage && (
        <div
          style={{
            padding: "var(--space-4)",
            background: "rgba(255, 71, 87, 0.1)",
            border: "1px solid var(--color-error)",
            borderRadius: "var(--radius-md)",
            color: "var(--color-error)",
            marginBottom: "var(--space-4)"
          }}
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      <Tabs value={activeTab} onChange={setActiveTab} className={styles.tabs}>
        <TabList>
          <TabTrigger value="list">Lista</TabTrigger>
          <TabTrigger value="add-transaction">Adicionar Transação</TabTrigger>
        </TabList>

        <TabPanel value="list">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))",
              gap: "var(--space-4)"
            }}
          >
            <Card variant="default">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "var(--space-4)"
                }}
              >
                <h3 style={{ margin: 0, fontSize: "var(--text-lg)" }}>Despesas</h3>
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
                      onClick={() => setActiveTab("add-transaction")}
                    >
                      Adicionar Despesa
                    </Button>
                  }
                />
              ) : (
                <Table
                  columns={expenseColumns}
                  data={expenseTransactions}
                  keyField="id"
                  sortable
                  stickyHeader
                />
              )}
            </Card>

            <Card variant="default">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "var(--space-4)"
                }}
              >
                <h3 style={{ margin: 0, fontSize: "var(--text-lg)" }}>Receitas</h3>
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
                      onClick={() => setActiveTab("add-transaction")}
                    >
                      Adicionar Receita
                    </Button>
                  }
                />
              ) : (
                <Table
                  columns={incomeColumns}
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
            initialData={{ type: "expense" }}
            categories={categories}
            onSubmit={handleFormSubmit}
            onCancel={() => setActiveTab("list")}
            submitLabel="Salvar Transação"
          />
        </TabPanel>
      </Tabs>

      {showDeleteConfirm && selectedTransaction && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "var(--color-overlay)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-4)",
            zIndex: "var(--z-modal)",
            animation: "fadeIn 0.2s ease-out"
          }}
          onClick={() => setShowDeleteConfirm(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-confirm-title"
        >
          <div
            style={{
              background: "var(--color-bg-secondary)",
              borderRadius: "var(--radius-xl)",
              padding: "var(--space-6)",
              maxWidth: "400px",
              width: "100%",
              boxShadow: "var(--shadow-lg)",
              border: "1px solid var(--color-border)"
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2
              id="delete-confirm-title"
              style={{ margin: "0 0 var(--space-2)", fontSize: "var(--text-lg)" }}
            >
              Excluir Transação
            </h2>
            <p style={{ margin: "0 0 var(--space-4)", color: "var(--color-text-secondary)" }}>
              Tem certeza que deseja excluir <strong>{selectedTransaction.title}</strong>? Esta ação
              não pode ser desfeita.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)" }}>
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
