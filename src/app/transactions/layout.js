// A página é um Client Component e não pode exportar metadata; o título fica neste layout
/** @type {import('next').Metadata} */
export const metadata = {
  title: "Transações",
  // Página privada: também recebe X-Robots-Tag e Cache-Control: private, no-store (next.config.js)
  robots: { index: false, follow: false }
}

export default function TransactionsLayout({ children }) {
  return children
}
