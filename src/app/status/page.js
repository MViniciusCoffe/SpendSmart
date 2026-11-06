/**
 * Status Page - System Health Monitor
 * Optimized with Next.js 13+ features:
 * - Static Generation with ISR (revalidate: 60)
 * - Streaming with Suspense + loading.js
 * - Error Boundary with error.js
 * - Server Components by default
 */

import { Metadata } from "next"
import { StatusPageContent } from "./components/StatusPageContent"

/** @type {Metadata} */
export const metadata = {
  title: "Status do sistema",
  description: "Monitoramento em tempo real da saúde dos serviços do SpendSmart",
  robots: "noindex, nofollow"
}

export const dynamic = "force-dynamic"
export const revalidate = 60 // ISR: revalidate every 60 seconds

export default async function StatusPage() {
  return <StatusPageContent />
}
