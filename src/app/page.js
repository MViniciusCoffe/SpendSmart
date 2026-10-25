import React from "react"
import Link from "next/link"
import { Navbar, Footer } from "@/components/layout"
import { Button, Card, Badge, Icon, Section } from "@/components/ui"
import styles from "./page.module.css"

export const metadata = {
  title: "SpendSmart — Organize suas finanças, realize seus sonhos",
  description:
    "Controle receitas, despesas e categorias com dashboard em tempo real, gráficos interativos e página de status pública."
}

export default function Home() {
  return (
    <div className={styles.pageWrapper}>
      <Navbar variant="public" />

      <main>
        {/* Hero Section */}
        <Section size="lg" className={styles.heroSection}>
          <div className={styles.heroGrid}>
            <div className={`${styles.heroContent} animate-slide-up`}>
              <div className={styles.heroBadge}>
                <Badge variant="success" dot size="sm">
                  Plataforma Financeira Inteligente
                </Badge>
              </div>
              <h1 className={styles.heroHeadline}>
                Organize suas finanças,{" "}
                <span className={styles.heroHeadlineGradient}>realize seus sonhos</span>
              </h1>
              <p className={styles.heroSubheadline}>
                Controle receitas, despesas e categorias com dashboard em tempo real, gráficos
                interativos e página de status pública.
              </p>
              <div className={styles.heroActions}>
                <Link href="/register" style={{ textDecoration: "none" }}>
                  <Button variant="primary" size="lg">
                    Começar grátis
                    <Icon name="chevron-right" size={16} />
                  </Button>
                </Link>
                <Link href="/about" style={{ textDecoration: "none" }}>
                  <Button variant="secondary" size="lg">
                    Ver demonstração
                  </Button>
                </Link>
              </div>
            </div>

            <div className={`${styles.heroIllustrationWrapper} animate-fade-in`}>
              <div className={styles.heroIllustrationCard}>
                <svg
                  className={styles.heroSvg}
                  viewBox="0 0 540 360"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  role="img"
                  aria-label="Demonstração visual do dashboard SpendSmart"
                >
                  <rect width="540" height="360" rx="12" fill="#0B1115" />
                  <rect
                    x="0.5"
                    y="0.5"
                    width="539"
                    height="359"
                    rx="11.5"
                    stroke="rgba(255,255,255,0.08)"
                  />
                  <circle cx="24" cy="24" r="4" fill="#EF4444" opacity="0.8" />
                  <circle cx="38" cy="24" r="4" fill="#F59E0B" opacity="0.8" />
                  <circle cx="52" cy="24" r="4" fill="#10B981" opacity="0.8" />
                  <rect
                    x="80"
                    y="18"
                    width="120"
                    height="12"
                    rx="6"
                    fill="rgba(255,255,255,0.06)"
                  />
                  <line x1="0" y1="44" x2="540" y2="44" stroke="rgba(255,255,255,0.08)" />
                  <rect
                    x="20"
                    y="60"
                    width="235"
                    height="85"
                    rx="8"
                    fill="#131B20"
                    stroke="rgba(255,255,255,0.06)"
                  />
                  <text
                    x="35"
                    y="118"
                    fill="#FFFFFF"
                    fontFamily="sans-serif"
                    fontSize="22"
                    fontWeight="bold"
                  >
                    R$ 14.850,00
                  </text>
                  <rect
                    x="275"
                    y="60"
                    width="245"
                    height="85"
                    rx="8"
                    fill="#131B20"
                    stroke="rgba(255,255,255,0.06)"
                  />
                  <text
                    x="290"
                    y="118"
                    fill="#00D4AA"
                    fontFamily="sans-serif"
                    fontSize="22"
                    fontWeight="bold"
                  >
                    + R$ 3.240,50
                  </text>
                  <rect
                    x="20"
                    y="160"
                    width="320"
                    height="180"
                    rx="8"
                    fill="#131B20"
                    stroke="rgba(255,255,255,0.06)"
                  />
                  <path
                    d="M35 300C75 285 110 240 155 245C200 250 235 205 275 210C295 212 315 195 315 195"
                    stroke="#00D4AA"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <rect
                    x="355"
                    y="160"
                    width="165"
                    height="180"
                    rx="8"
                    fill="#131B20"
                    stroke="rgba(255,255,255,0.06)"
                  />
                  <circle cx="380" cy="216" r="10" fill="rgba(0,212,170,0.12)" />
                  <rect x="400" y="212" width="60" height="8" rx="4" fill="rgba(255,255,255,0.3)" />
                  <circle cx="380" cy="254" r="10" fill="rgba(239,68,68,0.12)" />
                  <rect x="400" y="250" width="50" height="8" rx="4" fill="rgba(255,255,255,0.3)" />
                </svg>
              </div>
            </div>
          </div>
        </Section>

        {/* Features Section */}
        <Section size="lg">
          <div className={styles.featuresHeader}>
            <h2 className={styles.featuresHeaderTitle}>Recursos projetados para você</h2>
            <p className={styles.featuresHeaderSub}>
              Tudo o que você precisa para manter suas finanças sob controle com facilidade,
              segurança e rapidez.
            </p>
          </div>

          <div className={styles.featuresGrid}>
            <Card hover>
              <div className={styles.featureIconBox}>
                <Icon name="chart-bar" size={24} />
              </div>
              <h3 className={styles.featureTitle}>Dashboard Inteligente</h3>
              <p className={styles.featureDescription}>
                Visão consolidada de saldo, gráficos interativos de pizza e linhas, tendências e as
                principais transações do mês.
              </p>
            </Card>

            <Card hover>
              <div className={styles.featureIconBox}>
                <Icon name="credit-card" size={24} />
              </div>
              <h3 className={styles.featureTitle}>Transações Simples</h3>
              <p className={styles.featureDescription}>
                Adicione receitas e despesas com categoria, data e forma de pagamento em poucos
                segundos sem complicações.
              </p>
            </Card>

            <Card hover>
              <div className={styles.featureIconBox}>
                <Icon name="tag" size={24} />
              </div>
              <h3 className={styles.featureTitle}>Categorias Personalizadas</h3>
              <p className={styles.featureDescription}>
                Crie e organize categorias com cores exclusivas, tipo (receita ou despesa) e
                descrições sob medida para seu dia a dia.
              </p>
            </Card>

            <Card hover>
              <div className={styles.featureIconBox}>
                <Icon name="activity" size={24} />
              </div>
              <h3 className={styles.featureTitle}>Status do Sistema</h3>
              <p className={styles.featureDescription}>
                Página de status pública e transparente com métricas de uptime, histórico de
                incidentes e saúde dos serviços em tempo real.
              </p>
            </Card>
          </div>
        </Section>
      </main>

      <Footer />
    </div>
  )
}
