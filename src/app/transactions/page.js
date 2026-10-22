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
  { value: "cash", label: "Cash" },
  { value: "credit_card", label: "Credit Card" },
  { value: "debit_card", label: "Debit Card" },
  { value: "pix", label: "PIX" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "other", label: "Other" }
]

function TransactionsContent() {
  const [activeTab, setActiveTab] = useState("list")
  const [categories, setCategories] = useState([])
  const [transactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const expenseCategories = categories.filter(c => c.type === "expense" && !c.deleted_at)
  const incomeCategories = categories.filter(c => c.type === "income" && !c.deleted_at)

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
        setErrorMessage("Failed to load transactions.")
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
      setErrorMessage("Failed to refresh transactions.")
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
      setErrorMessage(error.message || "Failed to delete transaction.")
    }
  }

  const handleFormSubmit = async data => {
    try {
      await transactionService.createTransaction(data)
      handleRefresh()
    } catch (error) {
      console.error("Error creating transaction:", error)
      setErrorMessage(error.message || "Failed to create transaction.")
    }
  }

  const expenseColumns = [
    { key: "title", header: "Title", sortable: true },
    {
      key: "category",
      header: "Category",
      sortable: true,
      render: (_, row) => row.category?.name || "—"
    },
    { key: "amount", header: "Amount", sortable: true, render: value => formatCurrency(value) },
    { key: "occurred_on", header: "Date", sortable: true, render: formatDate },
    { key: "payment_method", header: "Payment", render: value => value || "—" },
    {
      key: "actions",
      header: "Actions",
      render: (_, row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedTransaction(row)
            setShowDeleteConfirm(true)
          }}
          aria-label={`Delete ${row.title}`}
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
    { key: "title", header: "Title", sortable: true },
    {
      key: "category",
      header: "Category",
      sortable: true,
      render: (_, row) => row.category?.name || "—"
    },
    { key: "amount", header: "Amount", sortable: true, render: value => formatCurrency(value) },
    { key: "occurred_on", header: "Date", sortable: true, render: formatDate },
    { key: "payment_method", header: "Payment", render: value => value || "—" },
    {
      key: "actions",
      header: "Actions",
      render: (_, row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedTransaction(row)
            setShowDeleteConfirm(true)
          }}
          aria-label={`Delete ${row.title}`}
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
        <PageHeader title="Transactions" description="Manage your income and expenses" />
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-16)" }}>
          <LoadingSpinner size="lg" ariaLabel="Loading transactions" />
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Transactions"
        description="Manage your income and expenses"
        action={
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <Badge variant="income">Income: {incomeTransactions.length}</Badge>
            <Badge variant="expense">Expenses: {expenseTransactions.length}</Badge>
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

      <Tabs defaultValue="list" onChange={setActiveTab} className={styles.tabs}>
        <TabList>
          <TabTrigger value="list">List</TabTrigger>
          <TabTrigger value="add-expense">Add Expense</TabTrigger>
          <TabTrigger value="add-income">Add Income</TabTrigger>
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
                <h3 style={{ margin: 0, fontSize: "var(--text-lg)" }}>Expenses</h3>
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
                  title="No expenses yet"
                  description="Add your first expense to get started"
                  action={
                    <Button variant="primary" size="sm" onClick={() => setActiveTab("add-expense")}>
                      Add Expense
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
                <h3 style={{ margin: 0, fontSize: "var(--text-lg)" }}>Income</h3>
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
                  title="No income yet"
                  description="Add your first income to get started"
                  action={
                    <Button variant="primary" size="sm" onClick={() => setActiveTab("add-income")}>
                      Add Income
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

        <TabPanel value="add-expense">
          <TransactionForm
            initialData={{ type: "expense" }}
            categories={expenseCategories}
            onSubmit={handleFormSubmit}
            onCancel={() => setActiveTab("list")}
            submitLabel="Save Expense"
          />
        </TabPanel>

        <TabPanel value="add-income">
          <TransactionForm
            initialData={{ type: "income" }}
            categories={incomeCategories}
            onSubmit={handleFormSubmit}
            onCancel={() => setActiveTab("list")}
            submitLabel="Save Income"
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
              Delete Transaction
            </h2>
            <p style={{ margin: "0 0 var(--space-4)", color: "var(--color-text-secondary)" }}>
              Are you sure you want to delete <strong>{selectedTransaction.title}</strong>? This
              action cannot be undone.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)" }}>
              <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDeleteTransaction(selectedTransaction.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}

export default withAuth(TransactionsContent)
