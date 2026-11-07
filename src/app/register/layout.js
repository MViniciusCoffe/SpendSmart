// A página é um Client Component e não pode exportar metadata; o título fica neste layout
/** @type {import('next').Metadata} */
export const metadata = {
  title: "Criar conta"
}

export default function RegisterLayout({ children }) {
  return children
}
