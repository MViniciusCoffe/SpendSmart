import { Providers } from "./providers"
import "@/styles/globals.css"

/**
 * @typedef {Object} RootLayoutProps
 * @property {React.ReactNode} children
 */

/** @type {import('next').Metadata} */
export const metadata = {
  title: "SpendSmart - Personal Finance Manager",
  description:
    "Manage your finances with intelligence. Track expenses, income, and visualize your financial health.",
  keywords: ["finance", "budget", "expenses", "income", "dashboard", "personal finance"],
  authors: [{ name: "SpendSmart Team" }],
  openGraph: {
    title: "SpendSmart - Personal Finance Manager",
    description: "Manage your finances with intelligence",
    type: "website",
    locale: "en_US",
    siteName: "SpendSmart"
  }
}

/** @param {RootLayoutProps} param0 */
export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="icon" href="/images/favicon.ico" />
        <meta name="theme-color" content="#00d4aa" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
