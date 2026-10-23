"use client"

import { Card } from "@/components/ui"
import { Badge } from "@/components/ui"

export function StatusCard({
  title,
  value,
  unit = "",
  trend,
  trendValue,
  status = "normal",
  className = ""
}) {
  const statusVariantMap = {
    normal: "default",
    warning: "warning",
    critical: "error",
    degraded: "warning",
    operational: "success"
  }

  const trendDirection = trend === "up" ? "up" : trend === "down" ? "down" : "neutral"

  return (
    <Card variant="default" className="status-card">
      <div className="status-card-header">
        <h3 className="status-card-title">{title}</h3>
        {status !== "normal" && (
          <Badge variant={statusVariantMap[status] || "default"}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        )}
      </div>
      <div className="status-card-value-wrapper">
        <span className="status-card-value">
          {value}
          {unit && <span className="status-card-unit">{unit}</span>}
        </span>
        {trend !== undefined && trendValue !== undefined && (
          <span className={`status-card-trend trend-${trendDirection}`}>
            <span className="status-card-trend-icon">
              {trendDirection === "up" ? "↑" : trendDirection === "down" ? "↓" : "→"}
            </span>
            <span className="status-card-trend-value">
              {trendValue > 0 ? "+" : ""}
              {trendValue}%
            </span>
          </span>
        )}
      </div>
    </Card>
  )
}
