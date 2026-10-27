"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import styles from "./page.module.css"
import { PageContainer, PageHeader } from "@/components/layout"
import { Card, Badge, EmptyState, LoadingSpinner } from "@/components/ui"
import { ChartContainer, createGradient } from "@/components/ui"
import { transactionService } from "@/services/transactionService"
import { categoryService } from "@/services/categoryService"
import withAuth from "@/components/withAuth.js"
import { formatCurrency, formatCategoryName } from "@/lib/utils/format"

function DoughnutCard({ title, data, emptyTitle, emptyDescription, emptyIcon }) {
  const values = data?.datasets?.[0]?.data || []
  const total = values.reduce((sum, value) => sum + value, 0)

  return (
    <Card variant="default">
      <h3 className={styles.chart_title}>{title}</h3>
      <div className={styles.chart_body}>
        {data ? (
          <ChartContainer
            type="doughnut"
            data={data}
            options={{
              plugins: {
                tooltip: {
                  callbacks: {
                    label: context => {
                      const percentage = ((context.raw / total) * 100).toFixed(1)
                      return `${context.label}: ${formatCurrency(context.raw)} (${percentage}%)`
                    }
                  }
                }
              }
            }}
            showLegend
            legendData={values.map((value, index) => ({
              label: data.labels[index],
              value,
              color: data.datasets[0].backgroundColor[index]
            }))}
          />
        ) : (
          <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
        )}
      </div>
    </Card>
  )
}

function DashboardContent() {
  const [summary, setSummary] = useState({
    balance: 0,
    totalIncome: 0,
    totalExpenses: 0
  })
  const [expenses, setExpenses] = useState([])
  const [incomes, setIncomes] = useState([])
  const [categories, setCategories] = useState([])
  const [errorMessage, setErrorMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const allCategories = await categoryService.getCategories({ includeDeleted: true })
        setCategories(allCategories)

        const allTransactions = await transactionService.getTransactions()

        const fetchedIncomes = allTransactions.filter(t => t.type === "income")
        const fetchedExpenses = allTransactions.filter(t => t.type === "expense")

        setIncomes(fetchedIncomes)
        setExpenses(fetchedExpenses)

        const totalIncome = fetchedIncomes.reduce((acc, item) => acc + Number(item.amount || 0), 0)

        const totalExpenses = fetchedExpenses.reduce(
          (acc, item) => acc + Number(item.amount || 0),
          0
        )

        const balance = totalIncome - totalExpenses

        setSummary({
          balance,
          totalIncome,
          totalExpenses
        })

        setErrorMessage("")
      } catch (error) {
        console.error("Error loading dashboard:", error)
        setErrorMessage("Não foi possível carregar os dados do dashboard.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const buildExpensesCategoryChart = () => {
    if (categories.length === 0 || summary.totalExpenses === 0) return null

    const expensesByCategory = categories.map(category => {
      const totalValue = expenses
        .filter(expense => expense.category_id === category.id)
        .reduce((acc, expense) => acc + Number(expense.amount), 0)

      return {
        name: formatCategoryName(category),
        value: totalValue || 0,
        color: category.color || "#FFFFFF"
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
    if (expenses.length === 0 || summary.totalExpenses === 0) return null

    const expensesWithCategory = expenses.map(expense => {
      const category = categories.find(cat => cat.id === expense.category_id)
      return {
        name: expense.title || "Sem nome",
        value: Number(expense.amount),
        color: category?.color || "#FFFFFF"
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
    if (categories.length === 0 || summary.totalIncome === 0) return null

    const incomesByCategory = categories.map(category => {
      const totalValue = incomes
        .filter(income => income.category_id === category.id)
        .reduce((acc, income) => acc + Number(income.amount), 0)

      return {
        name: formatCategoryName(category),
        value: totalValue || 0,
        color: category.color || "#FFFFFF"
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
    if (incomes.length === 0 || summary.totalIncome === 0) return null

    const incomesWithCategory = incomes.map(income => {
      const category = categories.find(cat => cat.id === income.category_id)
      return {
        name: income.title || "Sem nome",
        value: Number(income.amount),
        color: category?.color || "#FFFFFF"
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
    if (expenses.length === 0 && incomes.length === 0) return null

    const combinedData = [
      ...expenses.map(expense => ({
        name: expense.title || "Sem nome",
        value: Number(expense.amount),
        type: "expense"
      })),
      ...incomes.map(income => ({
        name: income.title || "Sem nome",
        value: Number(income.amount),
        type: "income"
      }))
    ]

    combinedData.sort((a, b) => b.value - a.value)
    const top10 = combinedData.slice(0, 10)
    const overflow = combinedData.slice(10)

    const overflowSum = overflow.reduce((acc, item) => acc + item.value, 0)
    if (overflowSum > 0) {
      top10.push({ name: "Outros", value: overflowSum, type: "other" })
    }

    return {
      labels: top10.map(item => item.name),
      datasets: [
        {
          label: "Valores",
          data: top10.map(item => item.value),
          borderColor: "rgb(0, 212, 170)",
          backgroundColor: ctx =>
            createGradient(ctx, "rgba(0, 212, 170, 0.3)", "rgba(0, 212, 170, 0)"),
          tension: 0.3,
          fill: true,
          pointBackgroundColor: top10.map(item => (item.type === "income" ? "#00d4aa" : "#ff4757"))
        }
      ]
    }
  }

  if (isLoading) {
    return (
      <PageContainer>
        <div className={styles.loading_wrapper}>
          <LoadingSpinner size="lg" ariaLabel="Carregando dashboard" />
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
        description="Visão geral da sua saúde financeira"
        action={
          <div className={styles.header_badges}>
            <Badge variant="income">Receitas: {formatCurrency(summary.totalIncome)}</Badge>
            <Badge variant="expense">Despesas: {formatCurrency(summary.totalExpenses)}</Badge>
          </div>
        }
      />

      {errorMessage && (
        <div className={styles.error_banner} role="alert">
          {errorMessage}
        </div>
      )}

      <div className={styles.summary_grid}>
        <Card variant="elevated">
          <div className={styles.summary_card_body}>
            <div className={styles.summary_icon_balance}>
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
              <h3 className={styles.summary_label}>Saldo Atual</h3>
              <p className={styles.summary_value}>
                {summary.balance !== 0 ? formatCurrency(summary.balance) : "Sem dados"}
              </p>
            </div>
          </div>
        </Card>

        <Card variant="elevated">
          <div className={styles.summary_card_body}>
            <div className={styles.summary_icon_income}>
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
              <h3 className={styles.summary_label}>Total de Receitas</h3>
              <p className={styles.summary_value_income}>
                {summary.totalIncome !== 0 ? formatCurrency(summary.totalIncome) : "Sem dados"}
              </p>
            </div>
          </div>
        </Card>

        <Card variant="elevated">
          <div className={styles.summary_card_body}>
            <div className={styles.summary_icon_expense}>
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
              <h3 className={styles.summary_label}>Total de Despesas</h3>
              <p className={styles.summary_value_expense}>
                {summary.totalExpenses !== 0 ? formatCurrency(summary.totalExpenses) : "Sem dados"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className={styles.charts_grid}>
        <DoughnutCard
          title="Despesas por Categoria"
          data={expensesCategoryData}
          emptyTitle="Sem dados de despesas"
          emptyDescription="Adicione despesas para ver a divisão por categoria"
          emptyIcon={
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
        />

        <DoughnutCard
          title="Despesas por Transação"
          data={expensesData}
          emptyTitle="Sem transações de despesa"
          emptyDescription="Adicione transações de despesa para ver a divisão"
          emptyIcon={
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
        />
      </div>

      <div className={styles.charts_grid}>
        <DoughnutCard
          title="Receitas por Categoria"
          data={incomesCategoryData}
          emptyTitle="Sem dados de receitas"
          emptyDescription="Adicione receitas para ver a divisão por categoria"
          emptyIcon={
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
        />

        <DoughnutCard
          title="Receitas por Origem"
          data={incomesData}
          emptyTitle="Sem transações de receita"
          emptyDescription="Adicione transações de receita para ver a divisão"
          emptyIcon={
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
        />
      </div>

      <Card variant="default">
        <h3 className={styles.chart_heading}>Top 10 Transações (Receitas e Despesas)</h3>
        <div className={styles.line_chart_body}>
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
              title="Sem dados de transações"
              description="Adicione transações para ver a comparação do top 10"
            />
          )}
        </div>
      </Card>
    </PageContainer>
  )
}

export default withAuth(DashboardContent)
