/**
 * Global Site Configuration & Metadata
 */
export const siteConfig = {
  name: "SpendSmart",
  tagline: "Organize suas finanças, realize seus sonhos",
  description:
    "Dashboard financeiro com receitas, despesas, categorias e status de sistema. Open source, Next.js + Supabase.",
  url: "https://spendsmart.vercel.app",
  author: "SpendSmart Team",
  links: {
    github: "https://github.com/MViniciusCoffe/SpendSmart",
    githubIssues: "https://github.com/MViniciusCoffe/SpendSmart/issues",
    linkedin: "https://www.linkedin.com/in/devmarquinhos/",
    email: "infobasicifrn2017marcusv@gmail.com"
  },
  publicNav: [
    { href: "/", label: "Início" },
    { href: "/about", label: "Sobre" },
    { href: "/contact", label: "Contato" },
    { href: "/status", label: "Status" }
  ],
  appNav: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/transactions", label: "Transações" },
    { href: "/categories", label: "Categorias" },
    { href: "/settings", label: "Configurações" }
  ],
  techBadges: [
    { name: "Next.js 16", url: "https://nextjs.org" },
    { name: "Supabase", url: "https://supabase.com" },
    { name: "Chart.js", url: "https://www.chartjs.org" },
    { name: "React 19", url: "https://react.dev" },
    { name: "Jest", url: "https://jestjs.io" }
  ],
  academicNotice: "© 2025 SpendSmart — BSI UFRN, Testes de Software"
}
