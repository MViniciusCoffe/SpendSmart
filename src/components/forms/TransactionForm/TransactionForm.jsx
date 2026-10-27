"use client"

import { useState } from "react"
import { Button, Input, Textarea, Label, Card } from "../../../components/ui"
import { Dropdown } from "../../../components/ui"
import styles from "./TransactionForm.module.css"

const TYPE_OPTIONS = [
  { value: "expense", label: "Despesa" },
  { value: "income", label: "Receita" }
]

const PAYMENT_METHOD_OPTIONS = [
  { value: "cash", label: "Dinheiro" },
  { value: "credit_card", label: "Cartão de Crédito" },
  { value: "debit_card", label: "Cartão de Débito" },
  { value: "pix", label: "PIX" },
  { value: "bank_transfer", label: "Transferência Bancária" },
  { value: "other", label: "Outro" }
]

export function TransactionForm({
  initialData = {},
  categories = [],
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = "Save Transaction",
  className = "",
  ...props
}) {
  const [formData, setFormData] = useState({
    type: "expense",
    category_id: "",
    amount: "",
    title: "",
    occurred_on: "",
    description: "",
    payment_method: "",
    ...initialData
  })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const validateField = (name, value) => {
    switch (name) {
      case "title":
        if (!value.trim()) return "Título é obrigatório"
        if (value.trim().length > 100) return "Título deve ter no máximo 100 caracteres"
        break
      case "amount":
        if (!value) return "Valor é obrigatório"
        const num = parseFloat(value.replace(",", "."))
        if (isNaN(num) || num <= 0) return "Valor deve ser maior que 0"
        break
      case "category_id":
        if (!value) return "Categoria é obrigatória"
        break
      case "occurred_on":
        if (!value) return "Data é obrigatória"
        break
      case "type":
        if (!["income", "expense"].includes(value)) return "Tipo inválido"
        break
    }
    return null
  }

  const handleChange = (name, value) => {
    setSubmitted(false)
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
    setSubmitted(true)
    if (!validateForm()) return

    const submitData = {
      ...formData,
      amount: parseFloat(formData.amount.replace(",", ".")).toFixed(2),
      type: formData.type
    }

    onSubmit?.(submitData)
  }

  const filteredCategories = categories.filter(cat => cat.type === formData.type && !cat.deleted_at)

  return (
    <Card variant="default" className={`${styles.root} ${className}`} {...props}>
      <form onSubmit={handleSubmit} noValidate>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Informações Básicas</h3>

          <div className={styles.row}>
            <div className={styles.field}>
              <Label htmlFor="type">Tipo *</Label>
              <Dropdown
                id="type"
                name="type"
                options={TYPE_OPTIONS}
                value={formData.type}
                onChange={value => {
                  handleChange("type", value)
                  if (formData.category_id) {
                    const currentCategory = categories.find(c => c.id === formData.category_id)
                    if (currentCategory && currentCategory.type !== value) {
                      handleChange("category_id", "")
                    }
                  }
                }}
                disabled={isLoading}
                error={submitted && !!errors.type}
              />
              {submitted && errors.type && <span className="error-text">{errors.type}</span>}
            </div>

            <div className={styles.field}>
              <Label htmlFor="category_id">Categoria *</Label>
              <Dropdown
                id="category_id"
                name="category_id"
                options={filteredCategories.map(c => ({ value: c.id, label: c.name }))}
                value={formData.category_id}
                onChange={value => handleChange("category_id", value)}
                placeholder="Selecione uma categoria"
                disabled={isLoading || filteredCategories.length === 0}
                error={submitted && !!errors.category_id}
              />
              {filteredCategories.length === 0 && (
                <span className="helper-text">Nenhuma categoria disponível para este tipo</span>
              )}
              {submitted && errors.category_id && (
                <span className="error-text">{errors.category_id}</span>
              )}
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <Label htmlFor="amount">Valor *</Label>
              <Input
                id="amount"
                name="amount"
                type="text"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={e => handleChange("amount", e.target.value)}
                onBlur={e => handleBlur("amount", e.target.value)}
                placeholder="0,00"
                disabled={isLoading}
                inputMode="decimal"
                error={submitted && !!errors.amount}
              />
              {submitted && errors.amount && <span className="error-text">{errors.amount}</span>}
            </div>

            <div className={styles.field}>
              <Label htmlFor="occurred_on">Data *</Label>
              <Input
                id="occurred_on"
                name="occurred_on"
                type="date"
                value={formData.occurred_on}
                onChange={e => handleChange("occurred_on", e.target.value)}
                onBlur={e => handleBlur("occurred_on", e.target.value)}
                disabled={isLoading}
                max={new Date().toISOString().split("T")[0]}
                error={submitted && !!errors.occurred_on}
              />
              {submitted && errors.occurred_on && (
                <span className="error-text">{errors.occurred_on}</span>
              )}
            </div>
          </div>

          <div className={styles.field} style={{ gridColumn: "1 / -1" }}>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={e => handleChange("title", e.target.value)}
              onBlur={e => handleBlur("title", e.target.value)}
              placeholder="Título da transação"
              disabled={isLoading}
              maxLength={100}
              error={submitted && !!errors.title}
            />
            {submitted && errors.title && <span className="error-text">{errors.title}</span>}
          </div>

          <div className={styles.field} style={{ gridColumn: "1 / -1" }}>
            <Label htmlFor="payment_method">Forma de Pagamento</Label>
            <Dropdown
              id="payment_method"
              name="payment_method"
              options={PAYMENT_METHOD_OPTIONS}
              value={formData.payment_method}
              onChange={value => handleChange("payment_method", value)}
              placeholder="Selecione a forma de pagamento"
              disabled={isLoading}
            />
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

        {submitted && Object.keys(errors).some(key => errors[key]) && (
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
