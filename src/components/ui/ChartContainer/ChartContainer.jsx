"use client"

import { useEffect, useRef, useMemo } from "react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js"
import styles from "./ChartContainer.module.css"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: "var(--color-bg-tertiary)",
      titleColor: "var(--color-text-primary)",
      bodyColor: "var(--color-text-secondary)",
      borderColor: "var(--color-border)",
      borderWidth: 1,
      padding: 12,
      displayColors: true,
      usePointStyle: true
    }
  },
  scales: {
    x: {
      grid: {
        color: "var(--color-border)",
        drawBorder: false
      },
      ticks: {
        color: "var(--color-text-muted)",
        font: {
          size: 11
        }
      }
    },
    y: {
      grid: {
        color: "var(--color-border)",
        drawBorder: false
      },
      ticks: {
        color: "var(--color-text-muted)",
        font: {
          size: 11
        },
        callback: function (value) {
          return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL"
          }).format(value)
        }
      }
    }
  },
  interaction: {
    intersect: false,
    mode: "index"
  }
}

const CHART_COLORS = {
  income: "rgba(0, 212, 170, 0.8)",
  expense: "rgba(255, 71, 87, 0.8)",
  incomeLight: "rgba(0, 212, 170, 0.1)",
  expenseLight: "rgba(255, 71, 87, 0.1)",
  grid: "rgba(42, 42, 42, 0.5)"
}

export function ChartContainer({
  type = "line",
  data,
  options = {},
  className = "",
  height = 300,
  showLegend = false,
  legendData = [],
  ...props
}) {
  const canvasRef = useRef(null)
  const chartRef = useRef(null)

  const mergedOptions = useMemo(
    () => ({
      ...defaultOptions,
      ...options,
      plugins: {
        ...defaultOptions.plugins,
        ...options.plugins
      },
      scales: {
        ...defaultOptions.scales,
        ...options.scales
      }
    }),
    [options]
  )

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) return

    if (chartRef.current) {
      chartRef.current.destroy()
    }

    chartRef.current = new ChartJS(ctx, {
      type,
      data,
      options: mergedOptions
    })

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
        chartRef.current = null
      }
    }
  }, [type, data, mergedOptions])

  return (
    <div className={`${styles.wrapper} ${className}`} style={{ height }} {...props}>
      <canvas ref={canvasRef} className={styles.canvas} />
      {showLegend && legendData.length > 0 && (
        <div className={styles.legend} role="list" aria-label="Chart legend">
          {legendData.map((item, index) => (
            <div key={index} className={styles.legendItem} role="listitem">
              <span
                className={styles.legendColor}
                style={{ backgroundColor: item.color }}
                aria-hidden="true"
              />
              <span className={styles.legendLabel}>{item.label}</span>
              {item.value !== undefined && (
                <span className={styles.legendValue}>
                  {typeof item.value === "number"
                    ? new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL"
                      }).format(item.value)
                    : item.value}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function createGradient(ctx, color1, color2) {
  if (!ctx) return color1
  const gradient = ctx.createLinearGradient(0, 0, 0, 300)
  gradient.addColorStop(0, color1)
  gradient.addColorStop(1, color2)
  return gradient
}
