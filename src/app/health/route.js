import { NextResponse } from "next/server"
import { version } from "../../../package.json"
import { supabaseConfig, getPublicClient, checkDatabase, checkAuth } from "@/lib/health/checks"

/**
 * Checagem de prontidão (readiness): 200 só quando o banco e o Auth do Supabase respondem, 503
 * quando qualquer um falha, estoura o tempo ou falta configuração. É o alvo do smoke test
 * pós-deploy (deploy.yml) e a URL de integridade da entrega da T4/P5.
 *
 * O /api/health continua sendo a checagem de vida (liveness), sem I/O: responde 200 enquanto o
 * processo estiver no ar, e a página de status o usa como "API Gateway".
 *
 * Pública de propósito: as checagens usam só a chave pública, o banco é consultado pela RPC
 * health_check(), que só lê o catálogo, e a resposta nunca carrega mensagem de erro interna.
 */
export const dynamic = "force-dynamic"

const toCheck = ({ status }) => (status === "operational" ? "ok" : "fail")

export async function GET() {
  const config = supabaseConfig()
  const [database, auth] = await Promise.all([
    checkDatabase(getPublicClient(config)),
    checkAuth(config)
  ])

  const checks = { database: toCheck(database), auth: toCheck(auth) }
  const healthy = Object.values(checks).every(check => check === "ok")

  return NextResponse.json(
    {
      status: healthy ? "ok" : "error",
      checks,
      version,
      timestamp: new Date().toISOString()
    },
    {
      status: healthy ? 200 : 503,
      headers: {
        // Nem a CDN nem o navegador podem guardar: o smoke test precisa do estado de agora
        "Cache-Control": "no-store, max-age=0",
        "X-Content-Type-Options": "nosniff"
      }
    }
  )
}
