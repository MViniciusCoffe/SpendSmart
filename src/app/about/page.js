import React from "react"
import { Navbar, Footer } from "@/components/layout"
import { Button, Card, Badge, Icon, Section } from "@/components/ui"
import { siteConfig } from "@/lib/config/siteConfig"
import styles from "./about.module.css"

export const metadata = {
  title: "Sobre o SpendSmart — Controle Financeiro Pessoal",
  description:
    "Conheça a história, arquitetura, stack tecnológica e equipe por trás do projeto SpendSmart (BSI UFRN)."
}

export default function AboutPage() {
  return (
    <div className={styles.pageWrapper}>
      <Navbar variant="public" />

      <main>
        {/* Hero Section */}
        <Section size="md" style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
          <div className={`${styles.heroContent} animate-slide-up`}>
            <Badge variant="success" dot size="sm">
              Contexto Acadêmico — BSI UFRN 2026
            </Badge>
            <h1 className={styles.heroTitle}>Sobre o SpendSmart</h1>
            <p className={styles.heroSub}>
              Uma plataforma moderna de gestão financeira pessoal desenvolvida no contexto da
              disciplina de Testes de Software com foco rigoroso em engenharia de qualidade.
            </p>
          </div>
        </Section>

        {/* Mission Section */}
        <Section size="md" style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
          <Card
            variant="elevated"
            style={{ maxWidth: "900px", margin: "0 auto", padding: "2.5rem 2rem" }}
          >
            <div className={styles.missionHighlight}>
              &ldquo;Projeto acadêmico da disciplina Testes de Software (BSI UFRN 2026) — Controle
              financeiro pessoal com arquitetura moderna e testes automatizados.&rdquo;
            </div>
            <p className={styles.missionDetails}>
              O SpendSmart nasceu para ir além de um simples gerenciador de despesas: o objetivo é
              demonstrar na prática os pilares de uma aplicação escalável e segura. Desenvolvido com
              arquitetura em camadas, separação clara de responsabilidades, cobertura de testes
              unitários de 100% na camada de negócio (services) e políticas ativas de RLS (Row Level
              Security) no banco de dados PostgreSQL.
            </p>
          </Card>
        </Section>

        {/* Detailed Features */}
        <Section size="md" style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Recursos em Detalhes</h2>
            <p className={styles.sectionDescription}>
              Conheça como cada módulo foi planejado para fornecer uma experiência fluida e
              confiável.
            </p>
          </div>

          <div className={styles.featuresGrid}>
            <Card hover>
              <div className={styles.featureIcon}>
                <Icon name="chart-bar" size={24} />
              </div>
              <h3
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "600",
                  color: "#ffffff",
                  marginBottom: "0.5rem"
                }}
              >
                Dashboard Inteligente
              </h3>
              <p
                style={{
                  fontSize: "0.875rem",
                  lineHeight: "1.55",
                  color: "var(--color-text-secondary)"
                }}
              >
                Agrega dados de receitas e despesas com cálculos dinâmicos de saldo líquido,
                gráficos interativos renderizados via Chart.js e filtros cronológicos para tomada de
                decisão rápida.
              </p>
            </Card>

            <Card hover>
              <div className={styles.featureIcon}>
                <Icon name="credit-card" size={24} />
              </div>
              <h3
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "600",
                  color: "#ffffff",
                  marginBottom: "0.5rem"
                }}
              >
                Transações Simples
              </h3>
              <p
                style={{
                  fontSize: "0.875rem",
                  lineHeight: "1.55",
                  color: "var(--color-text-secondary)"
                }}
              >
                Lançamentos tipados com validação preventiva de valores positivos, métodos de
                pagamento flexíveis e suporte a histórico auditável com isolamento por usuário.
              </p>
            </Card>

            <Card hover>
              <div className={styles.featureIcon}>
                <Icon name="tag" size={24} />
              </div>
              <h3
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "600",
                  color: "#ffffff",
                  marginBottom: "0.5rem"
                }}
              >
                Categorias Personalizadas
              </h3>
              <p
                style={{
                  fontSize: "0.875rem",
                  lineHeight: "1.55",
                  color: "var(--color-text-secondary)"
                }}
              >
                Organização intuitiva com cores personalizadas e separação rígida entre receitas e
                despesas, protegidas por constraints de integridade e soft delete.
              </p>
            </Card>

            <Card hover>
              <div className={styles.featureIcon}>
                <Icon name="activity" size={24} />
              </div>
              <h3
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "600",
                  color: "#ffffff",
                  marginBottom: "0.5rem"
                }}
              >
                Status do Sistema
              </h3>
              <p
                style={{
                  fontSize: "0.875rem",
                  lineHeight: "1.55",
                  color: "var(--color-text-secondary)"
                }}
              >
                Página de status aberta que monitora a saúde das conexões com Supabase Auth,
                PostgreSQL e endpoints de API, oferecendo total transparência.
              </p>
            </Card>
          </div>
        </Section>

        {/* Tech Stack */}
        <Section size="md" style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Tecnologias Utilizadas</h2>
            <p className={styles.sectionDescription}>
              Stack moderna construída com as ferramentas mais sólidas do ecossistema JavaScript.
            </p>
          </div>

          <div className={styles.techGrid}>
            {siteConfig.techBadges.map(tech => (
              <a
                key={tech.name}
                href={tech.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.techCard}
              >
                <Card hover style={{ width: "100%", padding: "1.25rem 1rem" }}>
                  <span className={styles.techName}>{tech.name}</span>
                </Card>
              </a>
            ))}
          </div>
        </Section>

        {/* Architecture */}
        <Section size="md" style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Pilares de Arquitetura</h2>
            <p className={styles.sectionDescription}>
              Princípios de software aplicados para garantir resiliência, manutenibilidade e
              segurança.
            </p>
          </div>

          <div className={styles.archGrid}>
            <Card hover>
              <Badge variant="info" size="sm" style={{ marginBottom: "0.75rem" }}>
                services/
              </Badge>
              <h3
                style={{
                  fontSize: "1.125rem",
                  fontWeight: "600",
                  color: "#ffffff",
                  marginBottom: "0.5rem"
                }}
              >
                Camada de Negócio
              </h3>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--color-text-secondary)",
                  lineHeight: "1.55"
                }}
              >
                Centralização de validações, tradução de erros e regras de domínio isoladas da
                interface.
              </p>
            </Card>

            <Card hover>
              <Badge variant="info" size="sm" style={{ marginBottom: "0.75rem" }}>
                PostgreSQL
              </Badge>
              <h3
                style={{
                  fontSize: "1.125rem",
                  fontWeight: "600",
                  color: "#ffffff",
                  marginBottom: "0.5rem"
                }}
              >
                Row Level Security (RLS)
              </h3>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--color-text-secondary)",
                  lineHeight: "1.55"
                }}
              >
                Políticas ativas no banco onde cada usuário só manipula seus próprios registros.
              </p>
            </Card>

            <Card hover>
              <Badge variant="info" size="sm" style={{ marginBottom: "0.75rem" }}>
                Audit & Safe
              </Badge>
              <h3
                style={{
                  fontSize: "1.125rem",
                  fontWeight: "600",
                  color: "#ffffff",
                  marginBottom: "0.5rem"
                }}
              >
                Soft Delete
              </h3>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--color-text-secondary)",
                  lineHeight: "1.55"
                }}
              >
                Exclusões lógicas via `deleted_at`, preservando integridade referencial.
              </p>
            </Card>

            <Card hover>
              <Badge variant="info" size="sm" style={{ marginBottom: "0.75rem" }}>
                Jest Projects
              </Badge>
              <h3
                style={{
                  fontSize: "1.125rem",
                  fontWeight: "600",
                  color: "#ffffff",
                  marginBottom: "0.5rem"
                }}
              >
                Testes Multi-nível
              </h3>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--color-text-secondary)",
                  lineHeight: "1.55"
                }}
              >
                4 projetos Jest: unitários com mocks, integração pg-mem, RLS real e testes de
                regressão.
              </p>
            </Card>

            <Card hover>
              <Badge variant="info" size="sm" style={{ marginBottom: "0.75rem" }}>
                GitHub Actions
              </Badge>
              <h3
                style={{
                  fontSize: "1.125rem",
                  fontWeight: "600",
                  color: "#ffffff",
                  marginBottom: "0.5rem"
                }}
              >
                CI/CD Automatizado
              </h3>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--color-text-secondary)",
                  lineHeight: "1.55"
                }}
              >
                Pipelines contínuos com linting, testes automatizados e análise estática SonarQube.
              </p>
            </Card>

            <Card hover>
              <Badge variant="info" size="sm" style={{ marginBottom: "0.75rem" }}>
                Serverless API
              </Badge>
              <h3
                style={{
                  fontSize: "1.125rem",
                  fontWeight: "600",
                  color: "#ffffff",
                  marginBottom: "0.5rem"
                }}
              >
                Operações Privilegiadas
              </h3>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--color-text-secondary)",
                  lineHeight: "1.55"
                }}
              >
                Rotas serverless seguras com service role restrito ao servidor para contas e perfis.
              </p>
            </Card>
          </div>
        </Section>

        {/* Team Section */}
        <Section size="md" style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Equipe do Projeto</h2>
            <p className={styles.sectionDescription}>
              Estrutura colaborativa focada em entregas de qualidade.
            </p>
          </div>

          <div className={styles.teamGrid}>
            <Card hover style={{ textAlign: "center", padding: "2rem" }}>
              <div className={styles.teamAvatar}>QA</div>
              <h3
                style={{
                  fontSize: "1.125rem",
                  fontWeight: "600",
                  color: "#ffffff",
                  marginBottom: "0.25rem"
                }}
              >
                Gerência & QA
              </h3>
              <span
                style={{ fontSize: "0.875rem", color: "var(--color-mercury)", fontWeight: "500" }}
              >
                Garantia da Qualidade
              </span>
              <p
                style={{
                  fontSize: "0.8125rem",
                  lineHeight: "1.5",
                  color: "var(--color-text-secondary)",
                  marginTop: "0.75rem"
                }}
              >
                Planejamento de testes, validação de regras de negócio e regressão.
              </p>
            </Card>

            <Card hover style={{ textAlign: "center", padding: "2rem" }}>
              <div className={styles.teamAvatar}>DEV</div>
              <h3
                style={{
                  fontSize: "1.125rem",
                  fontWeight: "600",
                  color: "#ffffff",
                  marginBottom: "0.25rem"
                }}
              >
                Desenvolvedor Principal
              </h3>
              <span
                style={{ fontSize: "0.875rem", color: "var(--color-mercury)", fontWeight: "500" }}
              >
                Fullstack & Engenharia
              </span>
              <p
                style={{
                  fontSize: "0.8125rem",
                  lineHeight: "1.5",
                  color: "var(--color-text-secondary)",
                  marginTop: "0.75rem"
                }}
              >
                Implementação fullstack, design tokens, integrações Supabase e suíte Jest.
              </p>
            </Card>
          </div>
        </Section>

        {/* Final CTA */}
        <Section size="lg">
          <Card variant="elevated" className={styles.ctaCard} style={{ padding: "3.5rem 2rem" }}>
            <h2 style={{ fontSize: "2rem", fontWeight: "700", color: "#ffffff", margin: 0 }}>
              Conheça o Código Aberto
            </h2>
            <p
              style={{
                fontSize: "1rem",
                color: "var(--color-text-secondary)",
                maxWidth: "500px",
                margin: 0
              }}
            >
              O projeto é 100% aberto. Explore os repositórios, documentação de testes e arquitetura
              no GitHub.
            </p>
            <a
              href={siteConfig.links.github}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none", marginTop: "0.5rem" }}
            >
              <Button variant="primary" size="lg">
                Ver no GitHub
                <Icon name="github" size={18} />
              </Button>
            </a>
          </Card>
        </Section>
      </main>

      <Footer />
    </div>
  )
}
