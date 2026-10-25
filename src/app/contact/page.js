"use client"

import React, { useState } from "react"
import Link from "next/link"
import Navbar from "@/components/layout/Header/navbar"
import sharedStyles from "@/components/layout/Header/public-shared.module.css"
import styles from "./contact.module.css"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "Dúvida Geral",
    message: ""
  })

  const handleChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = e => {
    e.preventDefault()
    const emailTo = "mviniciuscoffe@gmail.com"
    const subjectEncoded = encodeURIComponent(
      `[SpendSmart Contact] ${formData.subject} - ${formData.name}`
    )
    const bodyEncoded = encodeURIComponent(
      `Nome: ${formData.name}\nEmail: ${formData.email}\nAssunto: ${formData.subject}\n\nMensagem:\n${formData.message}`
    )

    // Open native email client with prefilled data
    window.location.href = `mailto:${emailTo}?subject=${subjectEncoded}&body=${bodyEncoded}`
  }

  return (
    <div className={styles.pageWrapper}>
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className={styles.heroSection}>
          <div className={sharedStyles.container}>
            <div className={`${styles.heroContent} ${sharedStyles.slideUp}`}>
              <h1 className={styles.heroTitle}>Entre em Contato</h1>
              <p className={styles.heroSub}>
                Tem dúvidas sobre o projeto, sugestões de funcionalidades ou feedbacks técnicos?
                Fale conosco diretamente ou abra uma issue no repositório.
              </p>
            </div>
          </div>
        </section>

        {/* Form and Direct Channels */}
        <section>
          <div className={`${sharedStyles.container} ${styles.contactGrid}`}>
            {/* mailto Form */}
            <div className={styles.formCard}>
              <div>
                <h2 className={styles.formHeaderTitle}>Envie uma Mensagem</h2>
                <p className={styles.formHeaderDesc}>
                  Preencha o formulário abaixo para abrir diretamente seu cliente de e-mail com a
                  mensagem pré-formatada.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
              >
                <div className={styles.formGroup}>
                  <label htmlFor="name" className={styles.formLabel}>
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    placeholder="Seu nome"
                    value={formData.name}
                    onChange={handleChange}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.formLabel}>
                    E-mail para Retorno
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    placeholder="seu.email@exemplo.com"
                    value={formData.email}
                    onChange={handleChange}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="subject" className={styles.formLabel}>
                    Assunto
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className={styles.formSelect}
                  >
                    <option value="Dúvida Geral">Dúvida Geral</option>
                    <option value="Reportar Bug">Reportar Bug / Defeito</option>
                    <option value="Sugestão de Recurso">Sugestão de Recurso</option>
                    <option value="Parceria / Acadêmico">Parceria / Acadêmico</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="message" className={styles.formLabel}>
                    Mensagem
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows="5"
                    placeholder="Escreva sua mensagem com detalhes..."
                    value={formData.message}
                    onChange={handleChange}
                    className={styles.formTextarea}
                  ></textarea>
                  <span className={styles.formNote}>
                    Ao clicar em enviar, seu aplicativo padrão de e-mail será aberto
                    automaticamente.
                  </span>
                </div>

                <button
                  type="submit"
                  className={`${sharedStyles.btn} ${sharedStyles.btnPrimary}`}
                  style={{ alignSelf: "flex-start", marginTop: "0.5rem" }}
                >
                  Enviar via E-mail
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
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </form>
            </div>

            {/* Direct Links */}
            <div className={styles.directChannels}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#ffffff", margin: 0 }}>
                Canais Diretos
              </h3>

              <a
                href="https://github.com/MViniciusCoffe/SpendSmart/issues"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.channelCard}
              >
                <div className={styles.channelIcon}>
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </div>
                <div className={styles.channelInfo}>
                  <h4 className={styles.channelTitle}>GitHub Issues</h4>
                  <p className={styles.channelDesc}>
                    Reporte bugs encontrados ou solicite novas funcionalidades no repositório
                    oficial.
                  </p>
                </div>
              </a>

              <a href="mailto:mviniciuscoffe@gmail.com" className={styles.channelCard}>
                <div className={styles.channelIcon}>
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </div>
                <div className={styles.channelInfo}>
                  <h4 className={styles.channelTitle}>E-mail Direto</h4>
                  <p className={styles.channelDesc}>
                    mviniciuscoffe@gmail.com — Resposta para dúvidas acadêmicas e contato geral.
                  </p>
                </div>
              </a>

              <a
                href="https://www.linkedin.com/in/marcus-vinicius-coffe/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.channelCard}
              >
                <div className={styles.channelIcon}>
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                    <rect x="2" y="9" width="4" height="12"></rect>
                    <circle cx="4" cy="4" r="2"></circle>
                  </svg>
                </div>
                <div className={styles.channelInfo}>
                  <h4 className={styles.channelTitle}>LinkedIn do Desenvolvedor</h4>
                  <p className={styles.channelDesc}>
                    Conecte-se profissionalmente com a equipe técnica do projeto.
                  </p>
                </div>
              </a>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className={styles.faqSection}>
          <div className={sharedStyles.container}>
            <div className={styles.faqHeader}>
              <h2 className={styles.faqTitle}>Perguntas Frequentes (FAQ)</h2>
              <p className={styles.faqSub}>
                Respostas rápidas para as principais dúvidas sobre o SpendSmart.
              </p>
            </div>

            <div className={styles.faqList}>
              <details className={styles.faqItem} open>
                <summary className={styles.faqSummary}>
                  <span>É gratuito?</span>
                  <span>↓</span>
                </summary>
                <div className={styles.faqAnswer}>
                  Sim, 100% gratuito e open source. O SpendSmart é um projeto de código aberto sob
                  licença livre, desenvolvido com propósitos acadêmicos e educacionais.
                </div>
              </details>

              <details className={styles.faqItem}>
                <summary className={styles.faqSummary}>
                  <span>Como funciona a segurança e o isolamento dos dados?</span>
                  <span>↓</span>
                </summary>
                <div className={styles.faqAnswer}>
                  Toda a autenticação é gerenciada pelo Supabase Auth. Além das validações rigorosas
                  na camada de negócio (`services/`), o PostgreSQL aplica políticas ativas de RLS
                  (Row Level Security), garantindo que nenhum usuário possa ler ou modificar dados
                  de outros usuários.
                </div>
              </details>

              <details className={styles.faqItem}>
                <summary className={styles.faqSummary}>
                  <span>Posso contribuir com o projeto?</span>
                  <span>↓</span>
                </summary>
                <div className={styles.faqAnswer}>
                  Com certeza! Pull Requests são muito bem-vindos. Basta conferir nosso repositório
                  no GitHub, seguir os padrões descritos no `AGENTS.md` (commits convencionais em
                  português e cobertura de testes) e abrir sua contribuição.
                </div>
              </details>
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
              <Link href="/about" style={{ color: "inherit", textDecoration: "none" }}>
                Sobre
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
