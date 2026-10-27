import Link from "next/link"
import { Icon } from "@/components/ui/Icon/Icon"
import { siteConfig } from "@/lib/config/siteConfig"
import styles from "./AuthShell.module.css"

const FEATURES = [
  "Dashboard com saldo e gráficos em tempo real",
  "Receitas e despesas organizadas por categoria",
  "Seus dados isolados por usuário com RLS"
]

// Heights (%) of the decorative bar chart in the showcase panel
const BARS = [38, 62, 45, 80, 56, 92, 70]

// Full-screen layout shared by the login and register pages
export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <main className={styles.page}>
      <div className={styles.backdrop} aria-hidden="true">
        <span className={`${styles.orb} ${styles.orbMercury}`} />
        <span className={`${styles.orb} ${styles.orbBlue}`} />
        <span className={styles.scanline} />
      </div>

      <aside className={styles.showcase} aria-hidden="true">
        <Link href="/" className={styles.brand} tabIndex={-1}>
          <Icon name="logo" size={28} />
          {siteConfig.name}
        </Link>

        <h2 className={styles.headline}>
          Suas finanças, <span className={styles.accent}>sob controle</span>.
        </h2>

        <ul className={styles.features}>
          {FEATURES.map((feature, index) => (
            <li key={feature} className={styles.feature} style={{ "--i": index }}>
              <span className={styles.featureDot} />
              {feature}
            </li>
          ))}
        </ul>

        <div className={styles.preview}>
          <div className={`${styles.floatCard} ${styles.balanceCard}`}>
            <span className={styles.floatLabel}>Saldo do mês</span>
            <strong className={styles.floatValue}>R$ 12.430,00</strong>
            <span className={styles.trend}>▲ 8,2%</span>
          </div>
          <div className={`${styles.floatCard} ${styles.chartCard}`}>
            <div className={styles.bars}>
              {BARS.map((height, index) => (
                <span
                  key={index}
                  className={styles.bar}
                  style={{ "--h": `${height}%`, "--i": index }}
                />
              ))}
            </div>
          </div>
        </div>
      </aside>

      <section className={styles.panel} aria-labelledby="auth-title">
        <div className={styles.card}>
          <Link href="/" className={`${styles.brand} ${styles.cardBrand}`}>
            <Icon name="logo" size={24} />
            {siteConfig.name}
          </Link>
          <header className={styles.header}>
            <h1 id="auth-title" className={styles.title}>
              {title}
            </h1>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </header>
          {children}
          {footer && <footer className={styles.footer}>{footer}</footer>}
        </div>
        <Link href="/" className={styles.backLink}>
          ← Voltar para o início
        </Link>
      </section>
    </main>
  )
}

export function AuthError({ children }) {
  if (!children) return null
  return (
    <div className={styles.error} role="alert">
      {children}
    </div>
  )
}

export function AuthField({ children, hint }) {
  return (
    <div className={styles.field}>
      {children}
      {hint && <span className={styles.hint}>{hint}</span>}
    </div>
  )
}

export function AuthForm({ onSubmit, children }) {
  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      {children}
    </form>
  )
}

export function AuthRow({ children }) {
  return <div className={styles.row}>{children}</div>
}
