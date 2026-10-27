"use client"

import { useEffect, useRef, useMemo } from "react"
import {
  Chart as ChartJS,
  BarController,
  DoughnutController,
  LineController,
  PieController,
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
  BarController,
  DoughnutController,
  LineController,
  PieController,
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

// Canvas can't resolve CSS variables, so design tokens are read at render time
function themeColor(token, fallback) {
  if (typeof window === "undefined") return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(token).trim()
  return value || fallback
}

const RADIAL_TYPES = ["doughnut", "pie", "polarArea", "radar"]

function getDefaultOptions(type) {
  const textColor = themeColor("--color-text-primary", "#ffffff")
  const gridColor = themeColor("--color-border", "#2a2a2a")

  const scaleOptions = {
    grid: {
      color: gridColor,
      drawBorder: false
    },
    ticks: {
      color: textColor,
      font: {
        size: 11
      }
    }
  }

  return {
    responsive: true,
    maintainAspectRatio: false,
    color: textColor,
    plugins: {
      legend: {
        display: false,
        labels: {
          color: textColor
        }
      },
      tooltip: {
        backgroundColor: themeColor("--color-bg-tertiary", "#1a1a1a"),
        titleColor: textColor,
        bodyColor: themeColor("--color-text-secondary", "#a0a0a0"),
        borderColor: gridColor,
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        usePointStyle: true
      }
    },
    scales: RADIAL_TYPES.includes(type)
      ? {}
      : {
          x: scaleOptions,
          y: {
            ...scaleOptions,
            ticks: {
              ...scaleOptions.ticks,
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

  const mergedOptions = useMemo(() => {
    const defaultOptions = getDefaultOptions(type)
    return {
      ...defaultOptions,
      ...options,
      plugins: {
        ...defaultOptions.plugins,
        ...options.plugins,
        legend: { ...defaultOptions.plugins.legend, ...options.plugins?.legend },
        tooltip: { ...defaultOptions.plugins.tooltip, ...options.plugins?.tooltip }
      },
      scales: {
        ...defaultOptions.scales,
        ...options.scales
      }
    }
  }, [type, options])

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
  // Scriptable options receive Chart.js' context, not the canvas 2D context
  const canvasCtx = ctx?.chart?.ctx ?? ctx
  if (!canvasCtx?.createLinearGradient) return color1
  const gradient = canvasCtx.createLinearGradient(0, 0, 0, 300)
  gradient.addColorStop(0, color1)
  gradient.addColorStop(1, color2)
  return gradient
}
