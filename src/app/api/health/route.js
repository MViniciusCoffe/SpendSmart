import { NextResponse } from "next/server"
import { version } from "../../../../package.json"

/**
 * Health check endpoint for monitoring
 * Used by status page to verify API Gateway is operational and by external uptime monitors (#56). Público e sem I/O: não toca no banco. A versão vem do package.json,
 * que o release-please atualiza a cada release.
 */
export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      version,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development"
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Content-Type-Options": "nosniff"
      }
    }
  )
}
