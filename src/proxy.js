import { NextResponse } from "next/server"
import { buildContentSecurityPolicy, createNonce } from "@/lib/security/csp"

/**
 * Proxy do Next.js 16 (antigo middleware): aplica a Content-Security-Policy com nonce em cada
 * página (issue #24). Os demais headers de segurança, que não mudam por requisição, estão em
 * next.config.js.
 *
 * O nonce vai em dois lugares:
 * - no header da requisição, para o Next.js extraí-lo durante a renderização e marcar os próprios
 *   scripts (e para um Server Component ler, via `headers().get("x-nonce")`, se precisar);
 * - no header da resposta, que é o que o navegador aplica.
 *
 * Não protege rotas: a sessão do Supabase fica no localStorage e não chega ao servidor.
 */
export function proxy(request) {
  const nonce = createNonce()
  const csp = buildContentSecurityPolicy(nonce, {
    isDev: process.env.NODE_ENV === "development",
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
  })

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-nonce", nonce)
  requestHeaders.set("Content-Security-Policy", csp)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set("Content-Security-Policy", csp)
  return response
}

export const config = {
  matcher: [
    {
      // Só páginas: rotas de API devolvem JSON, e arquivos estáticos não executam nada que a CSP
      // controle. Prefetch do next/link também fica de fora (não renderiza HTML).
      source:
        "/((?!api|_next/static|_next/image|images/|favicon.ico|robots.txt|sitemap.xml|opengraph-image|twitter-image).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" }
      ]
    }
  ]
}
