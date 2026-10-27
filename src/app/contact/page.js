import React from "react"
import { Footer } from "@/components/layout"
import { Card, Icon, Section, Accordion } from "@/components/ui"
import { siteConfig } from "@/lib/config/siteConfig"
import { ContactForm } from "./ContactForm"
import styles from "./contact.module.css"

export const metadata = {
  title: "Contato — SpendSmart",
  description: "Entre em contato com a equipe SpendSmart para dúvidas, sugestões ou suporte."
}

export default function ContactPage() {
  const faqItems = [
    {
      title: "É gratuito?",
      content:
        "Sim, 100% gratuito e open source. O SpendSmart é um projeto de código aberto desenvolvido com propósitos acadêmicos e educacionais no BSI UFRN."
    },
    {
      title: "Como funciona a segurança e o isolamento dos dados?",
      content:
        "Toda a autenticação é gerenciada pelo Supabase Auth. Além das validações na camada de negócio (services/), o PostgreSQL aplica políticas ativas de RLS (Row Level Security), garantindo isolamento total por usuário."
    },
    {
      title: "Posso contribuir com o projeto?",
      content:
        "Com certeza! Contribuições são muito bem-vindas. Confira nosso repositório no GitHub, siga as orientações de commits convencionais em português e abra um Pull Request."
    }
  ]

  return (
    <div className={styles.pageWrapper}>
      <main>
        {/* Hero Section */}
        <Section size="md" style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
          <div className={`${styles.heroContent} animate-slide-up`}>
            <h1 className={styles.heroTitle}>Entre em Contato</h1>
            <p className={styles.heroSub}>
              Tem dúvidas sobre o projeto, sugestões de funcionalidades ou feedbacks técnicos? Fale
              conosco diretamente ou abra uma issue no repositório.
            </p>
          </div>
        </Section>

        {/* Form and Direct Channels */}
        <Section size="lg">
          <div className={styles.contactGrid}>
            {/* Form Card */}
            <Card variant="elevated" style={{ padding: "2rem" }}>
              <div style={{ marginBottom: "1.5rem" }}>
                <h2
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "700",
                    color: "#ffffff",
                    margin: "0 0 0.25rem 0"
                  }}
                >
                  Envie uma Mensagem
                </h2>
                <p
                  style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", margin: 0 }}
                >
                  Preencha o formulário para abrir seu aplicativo de e-mail com a mensagem
                  pré-formatada.
                </p>
              </div>

              <ContactForm />
            </Card>

            {/* Direct Channels */}
            <div className={styles.directChannels}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#ffffff", margin: 0 }}>
                Canais Diretos
              </h3>

              <a
                href={siteConfig.links.githubIssues}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none" }}
              >
                <Card hover className={styles.channelCard}>
                  <div className={styles.channelIcon}>
                    <Icon name="github" size={20} />
                  </div>
                  <div className={styles.channelInfo}>
                    <h4
                      style={{ fontSize: "1rem", fontWeight: "600", color: "#ffffff", margin: 0 }}
                    >
                      GitHub Issues
                    </h4>
                    <p
                      style={{
                        fontSize: "0.8125rem",
                        color: "var(--color-text-secondary)",
                        margin: 0
                      }}
                    >
                      Reporte bugs ou solicite novas funcionalidades no repositório.
                    </p>
                  </div>
                </Card>
              </a>

              <a href={`mailto:${siteConfig.links.email}`} style={{ textDecoration: "none" }}>
                <Card hover className={styles.channelCard}>
                  <div className={styles.channelIcon}>
                    <Icon name="mail" size={20} />
                  </div>
                  <div className={styles.channelInfo}>
                    <h4
                      style={{ fontSize: "1rem", fontWeight: "600", color: "#ffffff", margin: 0 }}
                    >
                      E-mail Direto
                    </h4>
                    <p
                      style={{
                        fontSize: "0.8125rem",
                        color: "var(--color-text-secondary)",
                        margin: 0
                      }}
                    >
                      {siteConfig.links.email} — Contato acadêmico e geral.
                    </p>
                  </div>
                </Card>
              </a>

              <a
                href={siteConfig.links.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none" }}
              >
                <Card hover className={styles.channelCard}>
                  <div className={styles.channelIcon}>
                    <Icon name="linkedin" size={20} />
                  </div>
                  <div className={styles.channelInfo}>
                    <h4
                      style={{ fontSize: "1rem", fontWeight: "600", color: "#ffffff", margin: 0 }}
                    >
                      LinkedIn do Desenvolvedor
                    </h4>
                    <p
                      style={{
                        fontSize: "0.8125rem",
                        color: "var(--color-text-secondary)",
                        margin: 0
                      }}
                    >
                      Conecte-se com a equipe de engenharia do SpendSmart.
                    </p>
                  </div>
                </Card>
              </a>
            </div>
          </div>
        </Section>

        {/* FAQ Section */}
        <Section size="lg" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
          <div className={styles.faqHeader}>
            <h2 style={{ fontSize: "2rem", fontWeight: "700", color: "#ffffff", margin: 0 }}>
              Perguntas Frequentes (FAQ)
            </h2>
            <p style={{ fontSize: "1rem", color: "var(--color-text-secondary)", margin: 0 }}>
              Respostas rápidas para as principais dúvidas sobre o SpendSmart.
            </p>
          </div>

          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <Accordion items={faqItems} />
          </div>
        </Section>
      </main>

      <Footer />
    </div>
  )
}
