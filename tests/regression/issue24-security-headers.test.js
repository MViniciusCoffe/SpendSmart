import { buildContentSecurityPolicy, createNonce } from "@/lib/security/csp"

const nextConfig = require("../../next.config.js")

// Regressão da issue #24: as respostas não tinham nenhum header de segurança próprio (só o HSTS que
// a Vercel adiciona). Os estáticos ficam em next.config.js; a CSP, com nonce, em src/proxy.js.

const parseCsp = csp =>
  Object.fromEntries(
    csp.split("; ").map(directive => {
      const [name, ...values] = directive.split(" ")
      return [name, values]
    })
  )

const headersFor = async source => {
  const rules = await nextConfig.headers()
  return Object.fromEntries(
    rules
      .filter(rule => rule.source === source)
      .flatMap(rule => rule.headers.map(h => [h.key, h.value]))
  )
}

describe("Regressão #24 — headers estáticos (next.config.js)", () => {
  it("aplica os headers de segurança a todas as rotas", async () => {
    expect(await headersFor("/:path*")).toEqual({
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy":
        "camera=(), microphone=(), geolocation=(), payment=(), browsing-topics=()"
    })
  })

  it.each([["/dashboard"], ["/transactions"], ["/categories"], ["/settings"]])(
    "%s sai dos buscadores e de cache compartilhado",
    async rota => {
      expect(await headersFor(rota)).toEqual({
        "X-Robots-Tag": "noindex, nofollow",
        "Cache-Control": "private, no-store"
      })
    }
  )

  it("não anuncia o framework no X-Powered-By", () => {
    expect(nextConfig.poweredByHeader).toBe(false)
  })
})

describe("Regressão #24 — Content-Security-Policy com nonce (src/lib/security/csp.js)", () => {
  const SUPABASE_REMOTO = "https://abcdefghij.supabase.co"
  const SUPABASE_LOCAL = "http://127.0.0.1:54321"

  it("só executa script com o nonce da requisição, sem 'unsafe-inline' nem 'unsafe-eval'", () => {
    const csp = parseCsp(buildContentSecurityPolicy("abc123", { supabaseUrl: SUPABASE_REMOTO }))

    expect(csp["script-src"]).toEqual(["'self'", "'nonce-abc123'", "'strict-dynamic'"])
  })

  it("libera 'unsafe-eval' só em desenvolvimento (exigido pelo React)", () => {
    const csp = parseCsp(buildContentSecurityPolicy("abc123", { isDev: true }))

    expect(csp["script-src"]).toContain("'unsafe-eval'")
  })

  it("bloqueia iframe, plugin, troca de base e envio de formulário para outra origem", () => {
    const csp = parseCsp(buildContentSecurityPolicy("abc123", { supabaseUrl: SUPABASE_REMOTO }))

    expect(csp["frame-ancestors"]).toEqual(["'none'"])
    expect(csp["object-src"]).toEqual(["'none'"])
    expect(csp["base-uri"]).toEqual(["'self'"])
    expect(csp["form-action"]).toEqual(["'self'"])
    expect(csp["default-src"]).toEqual(["'self'"])
  })

  it("só conecta na própria origem e na origem do Supabase", () => {
    const csp = parseCsp(
      buildContentSecurityPolicy("abc123", { supabaseUrl: `${SUPABASE_REMOTO}/rest/v1` })
    )

    expect(csp["connect-src"]).toEqual(["'self'", SUPABASE_REMOTO])
  })

  it("não carrega fonte nem estilo de terceiros (o app usa a fonte do sistema)", () => {
    const csp = parseCsp(buildContentSecurityPolicy("abc123", { supabaseUrl: SUPABASE_REMOTO }))

    expect(csp["font-src"]).toEqual(["'self'"])
  })

  it('exige o nonce em <style> e libera só o atributo style="" gerado pelo React', () => {
    const csp = parseCsp(buildContentSecurityPolicy("abc123", { supabaseUrl: SUPABASE_REMOTO }))

    expect(csp["style-src"]).toEqual(["'self'", "'nonce-abc123'"])
    expect(csp["style-src-attr"]).toEqual(["'unsafe-inline'"])
  })

  it("libera <style> inline em desenvolvimento (o hot reload não usa nonce)", () => {
    const csp = parseCsp(buildContentSecurityPolicy("abc123", { isDev: true }))

    expect(csp["style-src"]).toEqual(["'self'", "'unsafe-inline'"])
  })

  it("força HTTPS só quando o Supabase é HTTPS (o CLI local é http)", () => {
    expect(
      parseCsp(buildContentSecurityPolicy("n", { supabaseUrl: SUPABASE_REMOTO }))
    ).toHaveProperty("upgrade-insecure-requests")
    expect(
      parseCsp(buildContentSecurityPolicy("n", { supabaseUrl: SUPABASE_LOCAL }))
    ).not.toHaveProperty("upgrade-insecure-requests")
  })

  it("gera um nonce diferente a cada requisição", () => {
    expect(createNonce()).not.toBe(createNonce())
  })
})
