"use client"

import React, { useState } from "react"
import { Button, Icon } from "@/components/ui"
import { siteConfig } from "@/lib/config/siteConfig"
import styles from "./ContactForm.module.css"

export function ContactForm() {
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
    const emailTo = siteConfig.links.email
    const subjectEncoded = encodeURIComponent(
      `[SpendSmart Contact] ${formData.subject} - ${formData.name}`
    )
    const bodyEncoded = encodeURIComponent(
      `Nome: ${formData.name}\nEmail: ${formData.email}\nAssunto: ${formData.subject}\n\nMensagem:\n${formData.message}`
    )

    window.location.href = `mailto:${emailTo}?subject=${subjectEncoded}&body=${bodyEncoded}`
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <label htmlFor="name" className={styles.label}>
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
          className={styles.input}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="email" className={styles.label}>
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
          className={styles.input}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="subject" className={styles.label}>
          Assunto
        </label>
        <select
          id="subject"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          className={styles.select}
        >
          <option value="Dúvida Geral">Dúvida Geral</option>
          <option value="Reportar Bug">Reportar Bug / Defeito</option>
          <option value="Sugestão de Recurso">Sugestão de Recurso</option>
          <option value="Parceria / Acadêmico">Parceria / Acadêmico</option>
          <option value="Outro">Outro</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="message" className={styles.label}>
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
          className={styles.textarea}
        ></textarea>
        <span className={styles.note}>
          Ao clicar em enviar, seu aplicativo padrão de e-mail será aberto automaticamente.
        </span>
      </div>

      <Button type="submit" variant="primary" size="md" className={styles.submit_button}>
        Enviar via E-mail
        <Icon name="mail" size={16} />
      </Button>
    </form>
  )
}
