"use client"

import { useState } from "react"
import { Button, Input, Textarea, Label, Card } from "../../../components/ui"
import { Dropdown } from "../../../components/ui"
import styles from "./CategoryForm.module.css"

const TYPE_OPTIONS = [
  { value: "income", label: "Receita" },
  { value: "expense", label: "Despesa" }
]

function getInitialFormData(initialData) {
  return {
    name: "",
    type: "expense",
    description: "",
    color: "#00d4aa",
    ...initialData
  }
}

export function CategoryForm({
  initialData = {},
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = "Salvar Categoria",
  title = "Detalhes da Categoria",
  className = "",
  ...props
}) {
  // To load a different category, remount the form with a new `key`
  const [formData, setFormData] = useState(() => getInitialFormData(initialData))
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  const validateField = (name, value) => {
    switch (name) {
      case "name":
        if (!value.trim()) return "Nome é obrigatório"
        if (value.trim().length > 50) return "Nome deve ter no máximo 50 caracteres"
        break
      case "type":
        if (!["income", "expense"].includes(value)) return "Tipo inválido"
        break
    }
    return null
  }

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    setTouched(prev => ({ ...prev, [name]: true }))

    const error = validateField(name, value)
    setErrors(prev => ({
      ...prev,
      [name]: error
    }))
  }

  const handleBlur = name => {
    setTouched(prev => ({ ...prev, [name]: true }))
    const error = validateField(name, formData[name])
    setErrors(prev => ({ ...prev, [name]: error }))
  }

  const validateForm = () => {
    const newErrors = {}
    let isValid = true

    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key])
      if (error) {
        newErrors[key] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}))
    return isValid
  }

  const handleSubmit = event => {
    event.preventDefault()
    if (!validateForm()) return

    onSubmit?.(formData)
  }

  return (
    <Card variant="default" className={`${styles.root} ${className}`} {...props}>
      <form onSubmit={handleSubmit} noValidate>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>{title}</h3>

          <div className={styles.row}>
            <div className={styles.field}>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={e => handleChange("name", e.target.value)}
                onBlur={e => handleBlur("name", e.target.value)}
                placeholder="Nome da categoria"
                required
                disabled={isLoading}
                maxLength={50}
              />
              {touched.name && errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            <div className={styles.field}>
              <Label htmlFor="type">Tipo *</Label>
              <Dropdown
                id="type"
                name="type"
                options={TYPE_OPTIONS}
                value={formData.type}
                onChange={value => handleChange("type", value)}
                required
                disabled={isLoading}
              />
              {touched.type && errors.type && <span className="error-text">{errors.type}</span>}
            </div>
          </div>

          <div className={styles.field} style={{ gridColumn: "1 / -1" }}>
            <Label htmlFor="color">Cor</Label>
            <div
              style={{
                display: "flex",
                gap: "var(--space-3)",
                alignItems: "center",
                flexWrap: "wrap"
              }}
            >
              <input
                type="color"
                id="color"
                name="color"
                value={formData.color}
                onChange={e => handleChange("color", e.target.value)}
                style={{
                  width: "48px",
                  height: "40px",
                  border: "2px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                  background: "none",
                  padding: 0
                }}
                disabled={isLoading}
              />
              <div
                className={styles.colorPreview}
                style={{ backgroundColor: formData.color }}
                aria-hidden="true"
              />
              <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                {formData.color}
              </span>
            </div>
          </div>

          <div className={styles.field} style={{ gridColumn: "1 / -1" }}>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={e => handleChange("description", e.target.value)}
              placeholder="Descrição opcional"
              rows={3}
              disabled={isLoading}
            />
          </div>
        </div>

        {Object.keys(errors).some(key => errors[key] && touched[key]) && (
          <div className={styles.error} role="alert">
            <svg
              className={styles.errorIcon}
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>Por favor, corrija os erros acima antes de enviar</span>
          </div>
        )}

        <div className={styles.actions}>
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
              Cancelar
            </Button>
          )}
          <Button type="submit" variant="primary" loading={isLoading}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Card>
  )
}
