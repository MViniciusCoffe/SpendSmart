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
        <Section size="md" className={styles.section_divider}>
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
            <Card variant="elevated" className={styles.card_padding}>
              <div className={styles.card_header}>
                <h2 className={styles.card_title}>Envie uma Mensagem</h2>
                <p className={styles.card_subtitle}>
                  Preencha o formulário para abrir seu aplicativo de e-mail com a mensagem
                  pré-formatada.
                </p>
              </div>

              <ContactForm />
            </Card>

            {/* Direct Channels */}
            <div className={styles.directChannels}>
              <h3 className={styles.channels_title}>Canais Diretos</h3>

              <a
                href={siteConfig.links.githubIssues}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.plain_link}
              >
                <Card hover className={styles.channelCard}>
                  <div className={styles.channelIcon}>
                    <Icon name="github" size={20} />
                  </div>
                  <div className={styles.channelInfo}>
                    <h4 className={styles.channel_title}>GitHub Issues</h4>
                    <p className={styles.channel_text}>
                      Reporte bugs ou solicite novas funcionalidades no repositório.
                    </p>
                  </div>
                </Card>
              </a>

              <a href={`mailto:${siteConfig.links.email}`} className={styles.plain_link}>
                <Card hover className={styles.channelCard}>
                  <div className={styles.channelIcon}>
                    <Icon name="mail" size={20} />
                  </div>
                  <div className={styles.channelInfo}>
                    <h4 className={styles.channel_title}>E-mail Direto</h4>
                    <p className={styles.channel_text}>
                      {siteConfig.links.email} — Contato acadêmico e geral.
                    </p>
                  </div>
                </Card>
              </a>

              <a
                href={siteConfig.links.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.plain_link}
              >
                <Card hover className={styles.channelCard}>
                  <div className={styles.channelIcon}>
                    <Icon name="linkedin" size={20} />
                  </div>
                  <div className={styles.channelInfo}>
                    <h4 className={styles.channel_title}>LinkedIn do Desenvolvedor</h4>
                    <p className={styles.channel_text}>
                      Conecte-se com a equipe de engenharia do SpendSmart.
                    </p>
                  </div>
                </Card>
              </a>
            </div>
          </div>
        </Section>

        {/* FAQ Section */}
        <Section size="lg" className={styles.section_top_divider}>
          <div className={styles.faqHeader}>
            <h2 className={styles.faq_title}>Perguntas Frequentes (FAQ)</h2>
            <p className={styles.faq_subtitle}>
              Respostas rápidas para as principais dúvidas sobre o SpendSmart.
            </p>
          </div>

          <div className={styles.faq_list}>
            <Accordion items={faqItems} />
          </div>
        </Section>
      </main>

      <Footer />
    </div>
  )
}
