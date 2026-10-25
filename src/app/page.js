"use client"

import React from "react"
import Link from "next/link"
import Navbar from "@/components/layout/Header/navbar"
import sharedStyles from "@/components/layout/Header/public-shared.module.css"
import styles from "./page.module.css"

export default function Home() {
  return (
    <div className={styles.pageWrapper}>
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className={styles.heroSection}>
          <div className={`${sharedStyles.container} ${styles.heroGrid}`}>
            <div className={`${styles.heroContent} ${sharedStyles.slideUp}`}>
              <div className={styles.heroBadge}>
                <span className={styles.heroBadgePulse}></span>
                Plataforma Financeira Inteligente
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
                <Link href="/register" className={`${sharedStyles.btn} ${sharedStyles.btnPrimary}`}>
                  Começar grátis
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </Link>
                <Link href="/about" className={`${sharedStyles.btn} ${sharedStyles.btnSecondary}`}>
                  Ver demonstração
                </Link>
              </div>
            </div>

            <div className={`${styles.heroIllustrationWrapper} ${sharedStyles.fadeIn}`}>
              <div className={styles.heroIllustrationCard}>
                {/* Mercury/Linear style inline SVG dashboard illustration */}
                <svg
                  className={styles.heroSvg}
                  viewBox="0 0 540 360"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  role="img"
                  aria-label="Demonstração visual do dashboard SpendSmart"
                >
                  {/* Background container */}
                  <rect width="540" height="360" rx="12" fill="#0B1115" />
                  <rect
                    x="0.5"
                    y="0.5"
                    width="539"
                    height="359"
                    rx="11.5"
                    stroke="rgba(255,255,255,0.08)"
                  />

                  {/* Top Bar */}
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

                  {/* Left Metric Card: Saldo Atual */}
                  <rect
                    x="20"
                    y="60"
                    width="235"
                    height="85"
                    rx="8"
                    fill="#131B20"
                    stroke="rgba(255,255,255,0.06)"
                  />
                  <rect x="35" y="76" width="70" height="10" rx="5" fill="rgba(255,255,255,0.2)" />
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
                  <circle cx="225" cy="82" r="8" fill="rgba(0,212,170,0.15)" />
                  <path
                    d="M222 84L225 80L228 84"
                    stroke="#00D4AA"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Right Metric Card: Despesas do Mês */}
                  <rect
                    x="275"
                    y="60"
                    width="245"
                    height="85"
                    rx="8"
                    fill="#131B20"
                    stroke="rgba(255,255,255,0.06)"
                  />
                  <rect x="290" y="76" width="80" height="10" rx="5" fill="rgba(255,255,255,0.2)" />
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

                  {/* Chart Area */}
                  <rect
                    x="20"
                    y="160"
                    width="320"
                    height="180"
                    rx="8"
                    fill="#131B20"
                    stroke="rgba(255,255,255,0.06)"
                  />
                  <rect x="35" y="178" width="90" height="10" rx="5" fill="rgba(255,255,255,0.2)" />
                  {/* Subtle Grid Lines */}
                  <line x1="35" y1="230" x2="315" y2="230" stroke="rgba(255,255,255,0.04)" />
                  <line x1="35" y1="270" x2="315" y2="270" stroke="rgba(255,255,255,0.04)" />
                  <line x1="35" y1="310" x2="315" y2="310" stroke="rgba(255,255,255,0.04)" />

                  {/* Chart Waves/Gradient */}
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00D4AA" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#00D4AA" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M35 300C75 285 110 240 155 245C200 250 235 205 275 210C295 212 315 195 315 195V310H35V300Z"
                    fill="url(#chartGrad)"
                  />
                  <path
                    d="M35 300C75 285 110 240 155 245C200 250 235 205 275 210C295 212 315 195 315 195"
                    stroke="#00D4AA"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Right Side Transactions Preview */}
                  <rect
                    x="355"
                    y="160"
                    width="165"
                    height="180"
                    rx="8"
                    fill="#131B20"
                    stroke="rgba(255,255,255,0.06)"
                  />
                  <rect
                    x="370"
                    y="178"
                    width="80"
                    height="10"
                    rx="5"
                    fill="rgba(255,255,255,0.2)"
                  />

                  {/* Transaction row 1 */}
                  <circle cx="380" cy="216" r="10" fill="rgba(0,212,170,0.12)" />
                  <rect x="400" y="212" width="60" height="8" rx="4" fill="rgba(255,255,255,0.3)" />
                  <rect x="475" y="212" width="32" height="8" rx="4" fill="rgba(0,212,170,0.4)" />

                  {/* Transaction row 2 */}
                  <circle cx="380" cy="254" r="10" fill="rgba(239,68,68,0.12)" />
                  <rect x="400" y="250" width="50" height="8" rx="4" fill="rgba(255,255,255,0.3)" />
                  <rect x="475" y="250" width="32" height="8" rx="4" fill="rgba(239,68,68,0.4)" />

                  {/* Transaction row 3 */}
                  <circle cx="380" cy="292" r="10" fill="rgba(0,212,170,0.12)" />
                  <rect x="400" y="288" width="65" height="8" rx="4" fill="rgba(255,255,255,0.3)" />
                  <rect x="475" y="288" width="32" height="8" rx="4" fill="rgba(0,212,170,0.4)" />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className={styles.featuresSection}>
          <div className={sharedStyles.container}>
            <div className={styles.featuresHeader}>
              <h2 className={styles.featuresHeaderTitle}>Recursos projetados para você</h2>
              <p className={styles.featuresHeaderSub}>
                Tudo o que você precisa para manter suas finanças sob controle com facilidade,
                segurança e rapidez.
              </p>
            </div>

            <div className={styles.featuresGrid}>
              {/* Card 1: Dashboard Inteligente */}
              <div className={styles.featureCard}>
                <div className={styles.featureIconBox}>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                  </svg>
                </div>
                <h3 className={styles.featureTitle}>Dashboard Inteligente</h3>
                <p className={styles.featureDescription}>
                  Visão consolidada de saldo, gráficos interativos de pizza e linhas, tendências e
                  as principais transações do mês.
                </p>
              </div>

              {/* Card 2: Transações Simples */}
              <div className={styles.featureCard}>
                <div className={styles.featureIconBox}>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                    <line x1="1" y1="10" x2="23" y2="10"></line>
                  </svg>
                </div>
                <h3 className={styles.featureTitle}>Transações Simples</h3>
                <p className={styles.featureDescription}>
                  Adicione receitas e despesas com categoria, data e forma de pagamento em poucos
                  segundos sem complicações.
                </p>
              </div>

              {/* Card 3: Categorias Personalizadas */}
              <div className={styles.featureCard}>
                <div className={styles.featureIconBox}>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                    <line x1="7" y1="7" x2="7.01" y2="7"></line>
                  </svg>
                </div>
                <h3 className={styles.featureTitle}>Categorias Personalizadas</h3>
                <p className={styles.featureDescription}>
                  Crie e organize categorias com cores exclusivas, tipo (receita ou despesa) e
                  descrições sob medida para seu dia a dia.
                </p>
              </div>

              {/* Card 4: Status do Sistema */}
              <div className={styles.featureCard}>
                <div className={styles.featureIconBox}>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                  </svg>
                </div>
                <h3 className={styles.featureTitle}>Status do Sistema</h3>
                <p className={styles.featureDescription}>
                  Página de status pública e transparente com métricas de uptime, histórico de
                  incidentes e saúde dos serviços em tempo real.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={sharedStyles.container}>
          <div className={styles.footerGrid}>
            <div className={styles.footerBrand}>
              <Link href="/" className={sharedStyles.btn} style={{ padding: 0 }}>
                <span
                  style={{
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "1.125rem",
                    letterSpacing: "-0.02em"
                  }}
                >
                  SpendSmart
                </span>
              </Link>
              <p className={styles.footerBrandDesc}>
                Aplicação de controle financeiro desenvolvida com foco em alta confiabilidade,
                testes automatizados e segurança.
              </p>
            </div>

            <div>
              <h4 className={styles.footerNavTitle}>Navegação</h4>
              <ul className={styles.footerNavList}>
                <li>
                  <Link href="/" className={styles.footerNavLink}>
                    Início
                  </Link>
                </li>
                <li>
                  <Link href="/about" className={styles.footerNavLink}>
                    Sobre
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className={styles.footerNavLink}>
                    Contato
                  </Link>
                </li>
                <li>
                  <Link href="/status" className={styles.footerNavLink}>
                    Status
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className={styles.footerNavTitle}>GitHub & Tecnologias</h4>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--color-text-secondary, #94a3b8)",
                  marginBottom: "1rem"
                }}
              >
                Código aberto no GitHub:{" "}
                <a
                  href="https://github.com/MViniciusCoffe/SpendSmart"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.footerNavLink}
                  style={{ color: "var(--color-mercury, #00d4aa)" }}
                >
                  MViniciusCoffe/SpendSmart
                </a>
              </p>
              <div className={styles.footerTechBadges}>
                <span className={sharedStyles.badgeTech}>Next.js 16</span>
                <span className={sharedStyles.badgeTech}>Supabase</span>
                <span className={sharedStyles.badgeTech}>Chart.js</span>
                <span className={sharedStyles.badgeTech}>React 19</span>
                <span className={sharedStyles.badgeTech}>Jest</span>
              </div>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <div>© 2025 SpendSmart — BSI UFRN, Testes de Software</div>
            <div>Arquitetura Fullstack com RLS & Supabase Auth</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
