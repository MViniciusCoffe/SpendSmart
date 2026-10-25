import React from "react"
import Link from "next/link"
import Navbar from "@/components/layout/Header/navbar"
import sharedStyles from "@/components/layout/Header/public-shared.module.css"
import styles from "./about.module.css"

export const metadata = {
  title: "Sobre o SpendSmart — Controle Financeiro Pessoal",
  description:
    "Conheça a história, arquitetura, stack tecnológica e equipe por trás do projeto SpendSmart (BSI UFRN)."
}

export default function AboutPage() {
  return (
    <div className={styles.pageWrapper}>
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className={styles.heroSection}>
          <div className={sharedStyles.container}>
            <div className={`${styles.heroContent} ${sharedStyles.slideUp}`}>
              <span className={styles.badge}>Contexto Acadêmico — BSI UFRN 2026</span>
              <h1 className={styles.heroTitle}>Sobre o SpendSmart</h1>
              <p className={styles.heroSub}>
                Uma plataforma moderna de gestão financeira pessoal desenvolvida no contexto da
                disciplina de Testes de Software com foco rigoroso em engenharia de qualidade.
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className={styles.sectionBlock}>
          <div className={sharedStyles.container}>
            <div className={styles.missionCard}>
              <div className={styles.missionHighlight}>
                &ldquo;Projeto acadêmico da disciplina Testes de Software (BSI UFRN 2026) — Controle
                financeiro pessoal com arquitetura moderna e testes automatizados.&rdquo;
              </div>
              <p className={styles.missionDetails}>
                O SpendSmart nasceu para ir além de um simples gerenciador de despesas: o objetivo é
                demonstrar na prática os pilares de uma aplicação escalável e segura. Desenvolvido
                com arquitetura em camadas, separação clara de responsabilidades, cobertura de
                testes unitários de 100% na camada de negócio (services) e políticas ativas de RLS
                (Row Level Security) no banco de dados PostgreSQL.
              </p>
            </div>
          </div>
        </section>

        {/* Detailed Features */}
        <section className={styles.sectionBlock}>
          <div className={sharedStyles.container}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Recursos em Detalhes</h2>
              <p className={styles.sectionDescription}>
                Conheça como cada módulo foi planejado para fornecer uma experiência fluida e
                confiável.
              </p>
            </div>

            <div className={styles.featuresGrid}>
              <div className={styles.featureDetailCard}>
                <div className={styles.featureIcon}>
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
                <p className={styles.featureText}>
                  Agrega dados de receitas e despesas com cálculos dinâmicos de saldo líquido,
                  gráficos interativos renderizados via Chart.js e filtros cronológicos para tomada
                  de decisão rápida.
                </p>
              </div>

              <div className={styles.featureDetailCard}>
                <div className={styles.featureIcon}>
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
                <p className={styles.featureText}>
                  Lançamentos tipados com validação preventiva de valores positivos
                  (`numeric(12,2)`), métodos de pagamento flexíveis e suporte a histórico auditável
                  com isolamento por usuário.
                </p>
              </div>

              <div className={styles.featureDetailCard}>
                <div className={styles.featureIcon}>
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
                <p className={styles.featureText}>
                  Organização intuitiva com cores personalizadas e separação rígida entre receitas e
                  despesas, protegidas por constraints de integridade e soft delete para impedir
                  perda involuntária de dados.
                </p>
              </div>

              <div className={styles.featureDetailCard}>
                <div className={styles.featureIcon}>
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
                <p className={styles.featureText}>
                  Página de status aberta que monitora a saúde das conexões com Supabase Auth,
                  PostgreSQL e endpoints de API, oferecendo total transparência e histórico de
                  incidentes em tempo real.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Tech Stack */}
        <section className={styles.sectionBlock}>
          <div className={sharedStyles.container}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Tecnologias Utilizadas</h2>
              <p className={styles.sectionDescription}>
                Stack moderna construída com as ferramentas mais sólidas do ecossistema JavaScript.
              </p>
            </div>

            <div className={styles.techGrid}>
              <a
                href="https://nextjs.org"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.techCard}
              >
                <span className={styles.techName}>Next.js 16</span>
                <span className={styles.techRole}>Framework React</span>
              </a>

              <a
                href="https://supabase.com"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.techCard}
              >
                <span className={styles.techName}>Supabase</span>
                <span className={styles.techRole}>Auth + Postgres RLS</span>
              </a>

              <a
                href="https://react.dev"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.techCard}
              >
                <span className={styles.techName}>React 19</span>
                <span className={styles.techRole}>Interface Declarativa</span>
              </a>

              <a
                href="https://www.chartjs.org"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.techCard}
              >
                <span className={styles.techName}>Chart.js</span>
                <span className={styles.techRole}>Visualização de Dados</span>
              </a>

              <a
                href="https://jestjs.io"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.techCard}
              >
                <span className={styles.techName}>Jest</span>
                <span className={styles.techRole}>Suíte de Testes</span>
              </a>

              <a
                href="https://eslint.org"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.techCard}
              >
                <span className={styles.techName}>ESLint 9</span>
                <span className={styles.techRole}>Qualidade Estática</span>
              </a>
            </div>
          </div>
        </section>

        {/* Architecture */}
        <section className={styles.sectionBlock}>
          <div className={sharedStyles.container}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Pilares de Arquitetura</h2>
              <p className={styles.sectionDescription}>
                Princípios de software aplicados para garantir resiliência, manutenibilidade e
                segurança.
              </p>
            </div>

            <div className={styles.archGrid}>
              <div className={styles.archCard}>
                <span className={styles.archTag}>services/</span>
                <h3 className={styles.archTitle}>Camada de Negócio</h3>
                <p className={styles.archDesc}>
                  Centralização de validações, tradução de erros e regras de domínio isoladas da
                  interface, facilitando cobertura de testes automatizados e independência de
                  framework.
                </p>
              </div>

              <div className={styles.archCard}>
                <span className={styles.archTag}>PostgreSQL</span>
                <h3 className={styles.archTitle}>Row Level Security (RLS)</h3>
                <p className={styles.archDesc}>
                  Políticas ativas a nível de banco de dados onde cada usuário só acessa e manipula
                  seus próprios dados, eliminando riscos de vazamento entre tenants.
                </p>
              </div>

              <div className={styles.archCard}>
                <span className={styles.archTag}>Audit & Safe</span>
                <h3 className={styles.archTitle}>Soft Delete</h3>
                <p className={styles.archDesc}>
                  Exclusões lógicas por meio de `deleted_at`, garantindo rastreabilidade histórica e
                  preservando a integridade referencial com tabelas dependentes.
                </p>
              </div>

              <div className={styles.archCard}>
                <span className={styles.archTag}>Jest Projects</span>
                <h3 className={styles.archTitle}>Testes Multi-nível</h3>
                <p className={styles.archDesc}>
                  Suíte completa com 4 projetos Jest: testes de unidade com mocks, integração em
                  memória com pg-mem, testes reais de RLS e suíte de regressão nomeada por issues.
                </p>
              </div>

              <div className={styles.archCard}>
                <span className={styles.archTag}>GitHub Actions</span>
                <h3 className={styles.archTitle}>CI/CD Automatizado</h3>
                <p className={styles.archDesc}>
                  Pipelines contínuos executando linting, testes com thresholds de cobertura e
                  análise de código estático no SonarQube a cada commit e pull request.
                </p>
              </div>

              <div className={styles.archCard}>
                <span className={styles.archTag}>Serverless API</span>
                <h3 className={styles.archTitle}>Operações Privilegiadas</h3>
                <p className={styles.archDesc}>
                  Rotas serverless seguras com service role restrito exclusivamente ao servidor para
                  criação de perfis e exclusão auditada de contas.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className={styles.sectionBlock}>
          <div className={sharedStyles.container}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Equipe do Projeto</h2>
              <p className={styles.sectionDescription}>
                Estrutura de papéis colaborativa focada em entregas de qualidade.
              </p>
            </div>

            <div className={styles.teamGrid}>
              <div className={styles.teamCard}>
                <div className={styles.teamAvatar}>QA</div>
                <h3 className={styles.teamName}>Gerência & QA</h3>
                <span className={styles.teamRole}>Garantia da Qualidade</span>
                <p className={styles.teamBio}>
                  Planejamento de casos de teste, validação de regras de negócio, testes de
                  regressão e conformidade com requisitos da disciplina.
                </p>
              </div>

              <div className={styles.teamCard}>
                <div className={styles.teamAvatar}>DEV</div>
                <h3 className={styles.teamName}>Desenvolvedor Principal</h3>
                <span className={styles.teamRole}>Fullstack & Engenharia</span>
                <p className={styles.teamBio}>
                  Implementação fullstack, design tokens Mercury, migrações de banco de dados,
                  integrações com Supabase e suíte de testes Jest.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className={styles.sectionBlock}>
          <div className={sharedStyles.container}>
            <div className={styles.ctaCard}>
              <h2 className={styles.ctaTitle}>Conheça o Código Aberto</h2>
              <p className={styles.ctaDesc}>
                O projeto é 100% aberto. Explore os repositórios, documentação de testes, relatórios
                de cobertura e arquitetura no GitHub.
              </p>
              <a
                href="https://github.com/MViniciusCoffe/SpendSmart"
                target="_blank"
                rel="noopener noreferrer"
                className={`${sharedStyles.btn} ${sharedStyles.btnPrimary}`}
              >
                Ver no GitHub
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
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", padding: "3rem 0 2rem" }}>
        <div className={sharedStyles.container}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
              fontSize: "0.875rem",
              color: "var(--color-text-secondary, #94a3b8)"
            }}
          >
            <div>© 2025 SpendSmart — BSI UFRN, Testes de Software</div>
            <div style={{ display: "flex", gap: "1.5rem" }}>
              <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>
                Início
              </Link>
              <Link href="/contact" style={{ color: "inherit", textDecoration: "none" }}>
                Contato
              </Link>
              <Link href="/status" style={{ color: "inherit", textDecoration: "none" }}>
                Status
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
