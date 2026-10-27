import React from "react"
import { Footer } from "@/components/layout"
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
      <main>
        {/* Hero Section */}
        <Section size="md" className={styles.section_divider}>
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
        <Section size="md" className={styles.section_divider}>
          <Card variant="elevated" className={styles.section_inner}>
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
        <Section size="md" className={styles.section_divider}>
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
              <h3 className={styles.feature_title}>Dashboard Inteligente</h3>
              <p className={styles.feature_text}>
                Agrega dados de receitas e despesas com cálculos dinâmicos de saldo líquido,
                gráficos interativos renderizados via Chart.js e filtros cronológicos para tomada de
                decisão rápida.
              </p>
            </Card>

            <Card hover>
              <div className={styles.featureIcon}>
                <Icon name="credit-card" size={24} />
              </div>
              <h3 className={styles.feature_title}>Transações Simples</h3>
              <p className={styles.feature_text}>
                Lançamentos tipados com validação preventiva de valores positivos, métodos de
                pagamento flexíveis e suporte a histórico auditável com isolamento por usuário.
              </p>
            </Card>

            <Card hover>
              <div className={styles.featureIcon}>
                <Icon name="tag" size={24} />
              </div>
              <h3 className={styles.feature_title}>Categorias Personalizadas</h3>
              <p className={styles.feature_text}>
                Organização intuitiva com cores personalizadas e separação rígida entre receitas e
                despesas, protegidas por constraints de integridade e soft delete.
              </p>
            </Card>

            <Card hover>
              <div className={styles.featureIcon}>
                <Icon name="activity" size={24} />
              </div>
              <h3 className={styles.feature_title}>Status do Sistema</h3>
              <p className={styles.feature_text}>
                Página de status aberta que monitora a saúde das conexões com Supabase Auth,
                PostgreSQL e endpoints de API, oferecendo total transparência.
              </p>
            </Card>
          </div>
        </Section>

        {/* Tech Stack */}
        <Section size="md" className={styles.section_divider}>
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
                <Card hover className={styles.stack_card}>
                  <span className={styles.techName}>{tech.name}</span>
                </Card>
              </a>
            ))}
          </div>
        </Section>

        {/* Architecture */}
        <Section size="md" className={styles.section_divider}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Pilares de Arquitetura</h2>
            <p className={styles.sectionDescription}>
              Princípios de software aplicados para garantir resiliência, manutenibilidade e
              segurança.
            </p>
          </div>

          <div className={styles.archGrid}>
            <Card hover>
              <Badge variant="info" size="sm" className={styles.stack_card_header}>
                services/
              </Badge>
              <h3 className={styles.principle_title}>Camada de Negócio</h3>
              <p className={styles.principle_text}>
                Centralização de validações, tradução de erros e regras de domínio isoladas da
                interface.
              </p>
            </Card>

            <Card hover>
              <Badge variant="info" size="sm" className={styles.stack_card_header}>
                PostgreSQL
              </Badge>
              <h3 className={styles.principle_title}>Row Level Security (RLS)</h3>
              <p className={styles.principle_text}>
                Políticas ativas no banco onde cada usuário só manipula seus próprios registros.
              </p>
            </Card>

            <Card hover>
              <Badge variant="info" size="sm" className={styles.stack_card_header}>
                Audit & Safe
              </Badge>
              <h3 className={styles.principle_title}>Soft Delete</h3>
              <p className={styles.principle_text}>
                Exclusões lógicas via `deleted_at`, preservando integridade referencial.
              </p>
            </Card>

            <Card hover>
              <Badge variant="info" size="sm" className={styles.stack_card_header}>
                Jest Projects
              </Badge>
              <h3 className={styles.principle_title}>Testes Multi-nível</h3>
              <p className={styles.principle_text}>
                4 projetos Jest: unitários com mocks, integração pg-mem, RLS real e testes de
                regressão.
              </p>
            </Card>

            <Card hover>
              <Badge variant="info" size="sm" className={styles.stack_card_header}>
                GitHub Actions
              </Badge>
              <h3 className={styles.principle_title}>CI/CD Automatizado</h3>
              <p className={styles.principle_text}>
                Pipelines contínuos com linting, testes automatizados e análise estática SonarQube.
              </p>
            </Card>

            <Card hover>
              <Badge variant="info" size="sm" className={styles.stack_card_header}>
                Serverless API
              </Badge>
              <h3 className={styles.principle_title}>Operações Privilegiadas</h3>
              <p className={styles.principle_text}>
                Rotas serverless seguras com service role restrito ao servidor para contas e perfis.
              </p>
            </Card>
          </div>
        </Section>

        {/* Team Section */}
        <Section size="md" className={styles.section_divider}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Equipe do Projeto</h2>
            <p className={styles.sectionDescription}>
              Estrutura colaborativa focada em entregas de qualidade.
            </p>
          </div>

          <div className={styles.teamGrid}>
            <Card hover className={styles.team_card}>
              <div className={styles.teamAvatar}>QA</div>
              <h3 className={styles.member_name}>Gerência & QA</h3>
              <span className={styles.member_role}>Garantia da Qualidade</span>
              <p className={styles.member_bio}>
                Planejamento de testes, validação de regras de negócio e regressão.
              </p>
            </Card>

            <Card hover className={styles.team_card}>
              <div className={styles.teamAvatar}>DEV</div>
              <h3 className={styles.member_name}>Desenvolvedor Principal</h3>
              <span className={styles.member_role}>Fullstack & Engenharia</span>
              <p className={styles.member_bio}>
                Implementação fullstack, design tokens, integrações Supabase e suíte Jest.
              </p>
            </Card>
          </div>
        </Section>

        {/* Final CTA */}
        <Section size="lg">
          <Card variant="elevated" className={`${styles.ctaCard} ${styles.cta_section}`}>
            <h2 className={styles.cta_title}>Conheça o Código Aberto</h2>
            <p className={styles.cta_text}>
              O projeto é 100% aberto. Explore os repositórios, documentação de testes e arquitetura
              no GitHub.
            </p>
            <a
              href={siteConfig.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.cta_link}
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
