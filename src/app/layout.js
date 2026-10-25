import { Providers } from "./providers"
import "@/styles/globals.css"

/**
 * @typedef {Object} RootLayoutProps
 * @property {React.ReactNode} children
 */

/** @type {import('next').Metadata} */
export const metadata = {
  title: "SpendSmart — Controle Financeiro Pessoal",
  description:
    "Dashboard financeiro com receitas, despesas, categorias e status de sistema. Open source, Next.js + Supabase.",
  keywords: [
    "finanças",
    "controle financeiro",
    "despesas",
    "receitas",
    "dashboard",
    "open source",
    "bsi ufrn"
  ],
  authors: [{ name: "SpendSmart Team" }],
  openGraph: {
    title: "SpendSmart — Controle Financeiro Pessoal",
    description:
      "Dashboard financeiro com receitas, despesas, categorias e status de sistema. Open source, Next.js + Supabase.",
    type: "website",
    locale: "pt_BR",
    siteName: "SpendSmart",
    images: [
      {
        url: "/images/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "SpendSmart Dashboard"
      }
    ]
  }
}

/** @param {RootLayoutProps} param0 */
export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className="h-full">
      <head>
        <link rel="icon" href="/images/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/images/favicon.ico" />
        <meta name="theme-color" content="#00d4aa" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] antialiased"
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
