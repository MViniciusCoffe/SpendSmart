"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import styles from "./page.module.css"
import { ClientOnly } from "@/components/ui"
import { PageContainer, PageHeader } from "@/components/layout"
import { Card, Badge, Avatar, EmptyState, LoadingSpinner } from "@/components/ui"
import { ChartContainer, createGradient } from "@/components/ui"
import { transactionService } from "@/services/transactionService"
import { categoryService } from "@/services/categoryService"
import withAuth from "@/components/withAuth.js"

function DashboardContent() {
  const [dados, setDados] = useState({
    saldo: 0,
    totalReceitas: 0,
    totalGastos: 0
  })
  const [spends, setSpends] = useState([])
  const [incomes, setIncomes] = useState([])
  const [categories, setCategories] = useState([])
  const [nomeUsuario, setNomeUsuario] = useState("User")
  const [errorMessage, setErrorMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const {
          data: { user }
        } = await window.supabase?.auth?.getUser?.()
        if (user) {
          const { data: profile } = await window.supabase
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .single()

          if (profile?.full_name) {
            setNomeUsuario(profile.full_name)
          }
        }
      } catch (error) {
        console.error("Erro ao buscar perfil:", error)
      }
    }

    fetchUserProfile()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const allCategories = await categoryService.getCategories()
        setCategories(allCategories)

        const allTransactions = await transactionService.getTransactions()

        const fetchedIncomes = allTransactions.filter(t => t.type === "income")
        const fetchedSpends = allTransactions.filter(t => t.type === "expense")

        setIncomes(fetchedIncomes)
        setSpends(fetchedSpends)

        const totalReceitas = fetchedIncomes.reduce(
          (acc, item) => acc + Number(item.amount || 0),
          0
        )

        const totalGastos = fetchedSpends.reduce((acc, item) => acc + Number(item.amount || 0), 0)

        const saldo = totalReceitas - totalGastos

        setDados({
          saldo,
          totalReceitas,
          totalGastos
        })

        setErrorMessage("")
      } catch (error) {
        console.error("Erro no Dashboard:", error)
        setErrorMessage("Failed to load dashboard data.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const formatCurrency = value => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(value)
  }

  const buildExpensesCategoryChart = () => {
    if (categories.length === 0 || dados.totalGastos === 0) return null

    const expensesByCategory = categories.map(categoria => {
      const totalValue = spends
        .filter(gasto => gasto.category_id === categoria.id)
        .reduce((acc, gasto) => acc + Number(gasto.amount), 0)

      return {
        name: categoria.name,
        value: totalValue || 0,
        color: categoria.color || "#FFFFFF"
      }
    })

    const filtered = expensesByCategory.filter(cat => cat.value > 0)

    return {
      labels: filtered.map(cat => cat.name),
      datasets: [
        {
          data: filtered.map(cat => cat.value),
          backgroundColor: filtered.map(cat => cat.color),
          hoverOffset: 4
        }
      ]
    }
  }

  const buildExpensesChart = () => {
    if (spends.length === 0 || dados.totalGastos === 0) return null

    const expensesWithCategory = spends.map(gasto => {
      const categoria = categories.find(cat => cat.id === gasto.category_id)
      return {
        name: gasto.title || "Unnamed",
        value: Number(gasto.amount),
        color: categoria?.color || "#FFFFFF"
      }
    })

    const filtered = expensesWithCategory.filter(g => g.value > 0)

    return {
      labels: filtered.map(g => g.name),
      datasets: [
        {
          data: filtered.map(g => g.value),
          backgroundColor: filtered.map(g => g.color),
          hoverOffset: 4
        }
      ]
    }
  }

  const buildIncomesCategoryChart = () => {
    if (categories.length === 0 || dados.totalReceitas === 0) return null

    const incomesByCategory = categories.map(categoria => {
      const totalValue = incomes
        .filter(receita => receita.category_id === categoria.id)
        .reduce((acc, receita) => acc + Number(receita.amount), 0)

      return {
        name: categoria.name,
        value: totalValue || 0,
        color: categoria.color || "#FFFFFF"
      }
    })

    const filtered = incomesByCategory.filter(cat => cat.value > 0)

    return {
      labels: filtered.map(cat => cat.name),
      datasets: [
        {
          data: filtered.map(cat => cat.value),
          backgroundColor: filtered.map(cat => cat.color),
          hoverOffset: 4
        }
      ]
    }
  }

  const buildIncomesChart = () => {
    if (incomes.length === 0 || dados.totalReceitas === 0) return null

    const incomesWithCategory = incomes.map(receita => {
      const categoria = categories.find(cat => cat.id === receita.category_id)
      return {
        name: receita.title || "Unnamed",
        value: Number(receita.amount),
        color: categoria?.color || "#FFFFFF"
      }
    })

    const filtered = incomesWithCategory.filter(r => r.value > 0)

    return {
      labels: filtered.map(r => r.name),
      datasets: [
        {
          data: filtered.map(r => r.value),
          backgroundColor: filtered.map(r => r.color),
          hoverOffset: 4
        }
      ]
    }
  }

  const buildLineChart = () => {
    if (spends.length === 0 && incomes.length === 0) return null

    const combinedData = [
      ...spends.map(gasto => ({
        name: gasto.title || "Unnamed",
        value: Number(gasto.amount),
        type: "Expense"
      })),
      ...incomes.map(receita => ({
        name: receita.title || "Unnamed",
        value: Number(receita.amount),
        type: "Income"
      }))
    ]

    combinedData.sort((a, b) => b.value - a.value)
    const top10 = combinedData.slice(0, 10)
    const overflow = combinedData.slice(10)

    const overflowSum = overflow.reduce((acc, item) => acc + item.value, 0)
    if (overflowSum > 0) {
      top10.push({ name: "Others", value: overflowSum, type: "Others" })
    }

    return {
      labels: top10.map(item => item.name),
      datasets: [
        {
          label: "Values",
          data: top10.map(item => item.value),
          borderColor: "rgb(0, 212, 170)",
          backgroundColor: ctx =>
            createGradient(ctx, "rgba(0, 212, 170, 0.3)", "rgba(0, 212, 170, 0)"),
          tension: 0.3,
          fill: true,
          pointBackgroundColor: top10.map(item =>
            item.type === "Income" ? "var(--color-income)" : "var(--color-expense)"
          )
        }
      ]
    }
  }

  if (isLoading) {
    return (
      <PageContainer>
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-16)" }}>
          <LoadingSpinner size="lg" ariaLabel="Loading dashboard" />
        </div>
      </PageContainer>
    )
  }

  const expensesCategoryData = buildExpensesCategoryChart()
  const expensesData = buildExpensesChart()
  const incomesCategoryData = buildIncomesCategoryChart()
  const incomesData = buildIncomesChart()
  const lineData = buildLineChart()

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="Overview of your financial health"
        action={
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <Badge variant="income">Income: {formatCurrency(dados.totalReceitas)}</Badge>
            <Badge variant="expense">Expense: {formatCurrency(dados.totalGastos)}</Badge>
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "var(--space-4)",
          marginBottom: "var(--space-6)"
        }}
      >
        <Card variant="elevated">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "var(--radius-lg)",
                background: "var(--color-mercury-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-mercury)"
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div>
              <h3
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-weight-medium)",
                  color: "var(--color-text-secondary)",
                  margin: 0
                }}
              >
                Current Balance
              </h3>
              <p
                style={{
                  fontSize: "var(--text-2xl)",
                  fontWeight: "var(--font-weight-bold)",
                  color: "var(--color-text-primary)",
                  margin: "var(--space-1) 0 0"
                }}
              >
                {dados.saldo !== 0 ? formatCurrency(dados.saldo) : "No data"}
              </p>
            </div>
          </div>
        </Card>

        <Card variant="elevated">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "var(--radius-lg)",
                background: "rgba(0, 212, 170, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-income)"
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 5v14M19 12H5" />
              </svg>
            </div>
            <div>
              <h3
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-weight-medium)",
                  color: "var(--color-text-secondary)",
                  margin: 0
                }}
              >
                Total Income
              </h3>
              <p
                style={{
                  fontSize: "var(--text-2xl)",
                  fontWeight: "var(--font-weight-bold)",
                  color: "var(--color-income)",
                  margin: "var(--space-1) 0 0"
                }}
              >
                {dados.totalReceitas !== 0 ? formatCurrency(dados.totalReceitas) : "No data"}
              </p>
            </div>
          </div>
        </Card>

        <Card variant="elevated">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "var(--radius-lg)",
                background: "rgba(255, 71, 87, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-expense)"
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 12H3M18 6l-6 6 6 6" />
              </svg>
            </div>
            <div>
              <h3
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-weight-medium)",
                  color: "var(--color-text-secondary)",
                  margin: 0
                }}
              >
                Total Expenses
              </h3>
              <p
                style={{
                  fontSize: "var(--text-2xl)",
                  fontWeight: "var(--font-weight-bold)",
                  color: "var(--color-expense)",
                  margin: "var(--space-1) 0 0"
                }}
              >
                {dados.totalGastos !== 0 ? formatCurrency(dados.totalGastos) : "No data"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "var(--space-4)",
          marginBottom: "var(--space-6)"
        }}
      >
        <Card variant="default">
          <h3 style={{ margin: "0 0 var(--space-4)", fontSize: "var(--text-lg)" }}>
            Expenses by Category
          </h3>
          <div style={{ height: "300px" }}>
            {expensesCategoryData ? (
              <ChartContainer
                type="doughnut"
                data={expensesCategoryData}
                options={{
                  plugins: {
                    tooltip: {
                      callbacks: {
                        label: context => {
                          const value = context.raw
                          const total = context.dataset.data.reduce((a, b) => a + b, 0)
                          const percentage = ((value / total) * 100).toFixed(1)
                          return `${context.label}: ${formatCurrency(value)} (${percentage}%)`
                        }
                      }
                    }
                  }
                }}
                showLegend
                legendData={
                  expensesCategoryData?.datasets?.[0]?.data?.map((value, index) => ({
                    label: expensesCategoryData.labels[index],
                    value,
                    color: expensesCategoryData.datasets[0].backgroundColor[index]
                  })) || []
                }
              />
            ) : (
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
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6a6 6 0 0 1 6 6H6a6 6 0 0 1 6-6z" />
                  </svg>
                }
                title="No expense data"
                description="Add expenses to see the breakdown by category"
              />
            )}
          </div>
        </Card>

        <Card variant="default">
          <h3 style={{ margin: "0 0 var(--space-4)", fontSize: "var(--text-lg)" }}>
            Expenses by Transaction
          </h3>
          <div style={{ height: "300px" }}>
            {expensesData ? (
              <ChartContainer
                type="doughnut"
                data={expensesData}
                options={{
                  plugins: {
                    tooltip: {
                      callbacks: {
                        label: context => {
                          const value = context.raw
                          const total = context.dataset.data.reduce((a, b) => a + b, 0)
                          const percentage = ((value / total) * 100).toFixed(1)
                          return `${context.label}: ${formatCurrency(value)} (${percentage}%)`
                        }
                      }
                    }
                  }
                }}
                showLegend
                legendData={
                  expensesData?.datasets?.[0]?.data?.map((value, index) => ({
                    label: expensesData.labels[index],
                    value,
                    color: expensesData.datasets[0].backgroundColor[index]
                  })) || []
                }
              />
            ) : (
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
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                }
                title="No expense transactions"
                description="Add expense transactions to see the breakdown"
              />
            )}
          </div>
        </Card>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "var(--space-4)",
          marginBottom: "var(--space-6)"
        }}
      >
        <Card variant="default">
          <h3 style={{ margin: "0 0 var(--space-4)", fontSize: "var(--text-lg)" }}>
            Income by Category
          </h3>
          <div style={{ height: "300px" }}>
            {incomesCategoryData ? (
              <ChartContainer
                type="doughnut"
                data={incomesCategoryData}
                options={{
                  plugins: {
                    tooltip: {
                      callbacks: {
                        label: context => {
                          const value = context.raw
                          const total = context.dataset.data.reduce((a, b) => a + b, 0)
                          const percentage = ((value / total) * 100).toFixed(1)
                          return `${context.label}: ${formatCurrency(value)} (${percentage}%)`
                        }
                      }
                    }
                  }
                }}
                showLegend
                legendData={
                  incomesCategoryData?.datasets?.[0]?.data?.map((value, index) => ({
                    label: incomesCategoryData.labels[index],
                    value,
                    color: incomesCategoryData.datasets[0].backgroundColor[index]
                  })) || []
                }
              />
            ) : (
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
                title="No income data"
                description="Add income to see the breakdown by category"
              />
            )}
          </div>
        </Card>

        <Card variant="default">
          <h3 style={{ margin: "0 0 var(--space-4)", fontSize: "var(--text-lg)" }}>
            Income by Source
          </h3>
          <div style={{ height: "300px" }}>
            {incomesData ? (
              <ChartContainer
                type="doughnut"
                data={incomesData}
                options={{
                  plugins: {
                    tooltip: {
                      callbacks: {
                        label: context => {
                          const value = context.raw
                          const total = context.dataset.data.reduce((a, b) => a + b, 0)
                          const percentage = ((value / total) * 100).toFixed(1)
                          return `${context.label}: ${formatCurrency(value)} (${percentage}%)`
                        }
                      }
                    }
                  }
                }}
                showLegend
                legendData={
                  incomesData?.datasets?.[0]?.data?.map((value, index) => ({
                    label: incomesData.labels[index],
                    value,
                    color: incomesData.datasets[0].backgroundColor[index]
                  })) || []
                }
              />
            ) : (
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
                title="No income transactions"
                description="Add income transactions to see the breakdown"
              />
            )}
          </div>
        </Card>
      </div>

      <Card variant="default">
        <h3 style={{ margin: "0 0 var(--space-4)", fontSize: "var(--text-lg)" }}>
          Top 10 Transactions (Income & Expenses)
        </h3>
        <div style={{ height: "350px" }}>
          {lineData ? (
            <ChartContainer type="line" data={lineData} />
          ) : (
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
                  <path d="M3 3h18v18H3z" />
                  <path d="M3 9h18" />
                  <path d="M9 3v18" />
                </svg>
              }
              title="No transaction data"
              description="Add transactions to see the top 10 comparison"
            />
          )}
        </div>
      </Card>
    </PageContainer>
  )
}

export default withAuth(DashboardContent)
