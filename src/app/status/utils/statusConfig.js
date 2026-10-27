/**
 * Status Configuration - Single Source of Truth
 * All status-related mappings, colors, labels in one place
 */

// Status variant mapping for Badge components
export const statusVariantMap = {
  operational: "success",
  degraded: "warning",
  critical: "error",
  normal: "default",
  warning: "warning",
  error: "error",
  maintenance: "default",
  resolved: "success"
}

// Human-readable status labels
export const statusLabelMap = {
  operational: "Operacional",
  degraded: "Degradado",
  critical: "Crítico",
  normal: "Normal",
  warning: "Alerta",
  error: "Erro",
  maintenance: "Manutenção",
  resolved: "Resolvido"
}

// Status descriptions for tooltips/aria
export const statusDescriptionMap = {
  operational: "Todos os sistemas operacionais",
  degraded: "Desempenho degradado",
  critical: "Interrupção grave",
  normal: "Operação normal",
  warning: "Limite de alerta excedido",
  error: "Estado de erro",
  maintenance: "Manutenção programada",
  resolved: "Incidente resolvido"
}

export const statusTitleMap = {
  operational: "Todos os Sistemas Operacionais",
  degraded: "Desempenho Degradado",
  critical: "Interrupção Grave",
  error: "Status Indisponível"
}

export const statusMessageMap = {
  operational: "Todos os sistemas estão funcionando normalmente",
  degraded: "Alguns sistemas estão com problemas",
  critical: "Sistemas críticos estão fora do ar",
  error: "Não foi possível obter o status do sistema"
}

// Status colors for CSS custom properties
export const statusColorMap = {
  operational: "var(--color-success)",
  degraded: "var(--color-warning)",
  critical: "var(--color-error)",
  normal: "var(--color-info)",
  warning: "var(--color-warning)",
  error: "var(--color-error)",
  maintenance: "var(--color-text-muted)",
  resolved: "var(--color-success)"
}

// Status glow colors for hover effects
export const statusGlowMap = {
  operational: "rgba(0, 212, 170, 0.4)",
  degraded: "rgba(255, 179, 0, 0.4)",
  critical: "rgba(255, 71, 87, 0.4)",
  normal: "rgba(0, 180, 255, 0.4)",
  warning: "rgba(255, 179, 0, 0.4)",
  error: "rgba(255, 71, 87, 0.4)",
  maintenance: "rgba(148, 163, 184, 0.4)",
  resolved: "rgba(0, 212, 170, 0.4)"
}

export const metricConfig = [
  { key: "apiLatency", label: "API Latency (p95)", unit: "ms", valueKey: "p95", icon: "api" },
  { key: "dbLatency", label: "Latência do Banco (p95)", unit: "ms", valueKey: "p95", icon: "db" },
  {
    key: "uptime",
    label: "Disponibilidade (30d)",
    unit: "%",
    valueKey: "uptime",
    isPercentage: true,
    icon: "uptime"
  },
  {
    key: "services",
    label: "Serviços Operacionais",
    unit: "",
    valueKey: "servicesUp",
    totalKey: "servicesTotal",
    icon: "services"
  }
]

export const metricStatusColorMap = {
  normal: "var(--color-success)",
  warning: "var(--color-warning)",
  degraded: "var(--color-warning)",
  error: "var(--color-error)",
  critical: "var(--color-error)"
}

export const metricColorMap = {
  apiLatency: "var(--color-success)",
  dbLatency: "var(--color-success)",
  uptime: "var(--color-success)",
  services: "var(--color-success)"
}

// Service metadata
export const serviceMetadata = {
  database: {
    id: "database",
    name: "Banco de Dados PostgreSQL",
    description: "Banco principal (Supabase Postgres)",
    icon: "database"
  },
  auth: {
    id: "auth",
    name: "Autenticação",
    description: "Supabase Auth (GoTrue)",
    icon: "auth"
  },
  realtime: {
    id: "realtime",
    name: "Motor de Tempo Real",
    description: "Supabase Realtime (Postgres Changes)",
    icon: "realtime"
  },
  storage: {
    id: "storage",
    name: "Armazenamento de Arquivos",
    description: "Supabase Storage (compatível com S3)",
    icon: "storage"
  },
  api: {
    id: "api",
    name: "API Gateway",
    description: "Rotas de API do Next.js",
    icon: "api"
  },
  cdn: {
    id: "cdn",
    name: "CDN / Edge Network",
    description: "Rede Edge da Vercel",
    icon: "cdn"
  }
}

// Severity config for incidents
export const severityConfig = {
  critical: {
    variant: "error",
    label: "Interrupção Grave",
    dotColor: "var(--color-error)",
    bg: "rgba(255, 71, 87, 0.1)",
    border: "rgba(255, 71, 87, 0.2)"
  },
  major: {
    variant: "warning",
    label: "Interrupção Parcial",
    dotColor: "var(--color-warning)",
    bg: "rgba(255, 179, 0, 0.1)",
    border: "rgba(255, 179, 0, 0.2)"
  },
  minor: {
    variant: "info",
    label: "Problema Leve",
    dotColor: "var(--color-info)",
    bg: "rgba(0, 180, 255, 0.1)",
    border: "rgba(0, 180, 255, 0.2)"
  },
  degraded: {
    variant: "warning",
    label: "Degradado",
    dotColor: "var(--color-warning)",
    bg: "rgba(255, 179, 0, 0.1)",
    border: "rgba(255, 179, 0, 0.2)"
  },
  maintenance: {
    variant: "default",
    label: "Manutenção",
    dotColor: "var(--color-text-muted)",
    bg: "var(--color-bg-tertiary)",
    border: "var(--color-border)"
  },
  resolved: {
    variant: "success",
    label: "Resolvido",
    dotColor: "var(--color-success)",
    bg: "rgba(0, 212, 170, 0.1)",
    border: "rgba(0, 212, 170, 0.2)"
  }
}

// Helper functions
export function getStatusVariant(status) {
  return statusVariantMap[status] || "default"
}

export function getStatusLabel(status) {
  return statusLabelMap[status] || status
}

export function getStatusDescription(status) {
  return statusDescriptionMap[status] || ""
}

export function getStatusTitle(status) {
  return statusTitleMap[status] || getStatusLabel(status)
}

export function getStatusMessage(status) {
  return statusMessageMap[status] || getStatusDescription(status)
}

export function getStatusColor(status) {
  return statusColorMap[status] || "var(--color-border)"
}

export function getStatusGlow(status) {
  return statusGlowMap[status] || "rgba(148, 163, 184, 0.4)"
}

export function getMetricStatusColor(status) {
  return metricStatusColorMap[status] || "transparent"
}

export function getMetricColor(metric) {
  return metricColorMap[metric] || "var(--color-text-muted)"
}

export function getSeverityConfig(severity) {
  return severityConfig[severity] || severityConfig.minor
}

export function getOverallStatus(services) {
  const statuses = services.map(s => s.status)
  if (statuses.includes("critical")) return "critical"
  if (statuses.includes("degraded")) return "degraded"
  return "operational"
}

export function calculateUptime(services) {
  const operationalCount = services.filter(s => s.status === "operational").length
  return (operationalCount / services.length) * 100
}

export function calculateLatencies(services) {
  const latencies = services.map(s => s.latency).filter(l => l > 0)
  const avg = latencies.length
    ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
    : 0
  const sorted = [...latencies].sort((a, b) => a - b)
  const p95 = sorted.length ? sorted[Math.floor(sorted.length * 0.95)] : 0
  const p99 = sorted.length ? sorted[Math.floor(sorted.length * 0.99)] : 0
  return { avg, p95, p99 }
}
