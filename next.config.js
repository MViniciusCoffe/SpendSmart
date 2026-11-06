// Headers de segurança que não mudam por requisição (issue #24). A Content-Security-Policy tem um
// nonce por requisição e por isso fica em src/proxy.js. O Strict-Transport-Security já vem da Vercel.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Navegadores antigos, que não entendem o frame-ancestors da CSP
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), browsing-topics=()"
  }
]

// Páginas que só fazem sentido com sessão: fora dos buscadores e de qualquer cache compartilhado
const PRIVATE_ROUTES = ["/dashboard", "/transactions", "/categories", "/settings"]
const privateHeaders = [
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
  { key: "Cache-Control", value: "private, no-store" }
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: __dirname,

  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      ...PRIVATE_ROUTES.map(route => ({ source: route, headers: privateHeaders }))
    ]
  }
}

module.exports = nextConfig
