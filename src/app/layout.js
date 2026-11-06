import { connection } from "next/server"
import { Providers } from "./providers"
import "@/styles/globals.css"
import { Header } from "@/components/layout/Header"
import { siteConfig } from "@/lib/config/siteConfig"

/**
 * @typedef {Object} RootLayoutProps
 * @property {React.ReactNode} children
 */

const TITLE = "SpendSmart — Controle Financeiro Pessoal"

/** @type {import('next').Metadata} */
export const metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: TITLE, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "finanças",
    "controle financeiro",
    "despesas",
    "receitas",
    "dashboard",
    "open source",
    "bsi ufrn"
  ],
  authors: [{ name: siteConfig.author }],
  icons: {
    icon: [{ url: "/images/favicon.svg", type: "image/svg+xml" }, { url: "/images/favicon.ico" }]
  },
  openGraph: {
    title: TITLE,
    description: siteConfig.description,
    type: "website",
    locale: "pt_BR",
    siteName: siteConfig.name,
    images: [
      {
        url: "/images/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "SpendSmart Dashboard"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: siteConfig.description,
    images: ["/images/og-default.jpg"]
  }
}

// O meta viewport (width=device-width, initial-scale=1) o Next.js já adiciona sozinho
/** @type {import('next').Viewport} */
export const viewport = {
  themeColor: "#00d4aa"
}

/** @param {RootLayoutProps} param0 */
export default async function RootLayout({ children }) {
  // Renderização dinâmica em todas as rotas: a CSP com nonce (src/proxy.js) só funciona numa
  // página gerada na requisição, onde o Next.js consegue aplicar o nonce aos próprios scripts
  await connection()

  return (
    <html lang="pt-BR" className="h-full">
      <body suppressHydrationWarning>
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  )
}
