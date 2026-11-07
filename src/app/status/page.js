/**
 * Status Page - System Health Monitor
 * - Renderizada a cada requisição: o `await connection()` do layout raiz já torna todas as páginas
 *   dinâmicas (nonce da CSP), e os dados vêm do /api/status, buscado no navegador a cada 30 s
 * - loading.js enquanto carrega e error.js como error boundary
 */

import { StatusPageContent } from "./components/StatusPageContent"

/** @type {import("next").Metadata} */
export const metadata = {
  title: "Status do sistema",
  description: "Monitoramento em tempo real da saúde dos serviços do SpendSmart",
  robots: "noindex, nofollow"
}

export const dynamic = "force-dynamic"

export default async function StatusPage() {
  return <StatusPageContent />
}
