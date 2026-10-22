"use client"

import { useState, useEffect, useRef } from "react"
import { Button, Input, Textarea, Label, Card } from "../../../components/ui"
import { Dropdown } from "../../../components/ui"
import styles from "./TransactionForm.module.css"

const TYPE_OPTIONS = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" }
]

const PAYMENT_METHOD_OPTIONS = [
  { value: "cash", label: "Cash" },
  { value: "credit_card", label: "Credit Card" },
  { value: "debit_card", label: "Debit Card" },
  { value: "pix", label: "PIX" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "other", label: "Other" }
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
  const prevInitialDataRef = useRef(initialData)
  const hasChangedRef = useRef(false)
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

  // Track if initialData has changed
  useEffect(() => {
    hasChangedRef.current = prevInitialDataRef.current !== initialData
    if (hasChangedRef.current) {
      prevInitialDataRef.current = initialData
    }
  }, [initialData])

  // Sync form data with initialData when it changes
  useEffect(() => {
    if (hasChangedRef.current) {
      setFormData(prev => ({ ...prev, ...initialData }))
      setErrors({})
      setTouched({})
    }
  }, [initialData])

  const validateField = (name, value) => {
    switch (name) {
      case "title":
        if (!value.trim()) return "Title is required"
        if (value.trim().length > 100) return "Title must be 100 characters or less"
        break
      case "amount":
        if (!value) return "Amount is required"
        const num = parseFloat(value.replace(",", "."))
        if (isNaN(num) || num <= 0) return "Amount must be greater than 0"
        break
      case "category_id":
        if (!value) return "Category is required"
        break
      case "occurred_on":
        if (!value) return "Date is required"
        break
      case "type":
        if (!["income", "expense"].includes(value)) return "Invalid type"
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
          <h3 className={styles.sectionTitle}>Basic Information</h3>

          <div className={styles.row}>
            <div className={styles.field}>
              <Label htmlFor="type">Type *</Label>
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
                required
                disabled={isLoading}
              />
              {touched.type && errors.type && <span className="error-text">{errors.type}</span>}
            </div>

            <div className={styles.field}>
              <Label htmlFor="category_id">Category *</Label>
              <Dropdown
                id="category_id"
                name="category_id"
                options={filteredCategories.map(c => ({ value: c.id, label: c.name }))}
                value={formData.category_id}
                onChange={value => handleChange("category_id", value)}
                placeholder="Select a category"
                required
                disabled={isLoading || filteredCategories.length === 0}
              />
              {filteredCategories.length === 0 && (
                <span className="helper-text">No categories available for this type</span>
              )}
              {touched.category_id && errors.category_id && (
                <span className="error-text">{errors.category_id}</span>
              )}
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={e => handleChange("amount", e.target.value)}
                onBlur={e => handleBlur("amount", e.target.value)}
                placeholder="0.00"
                required
                disabled={isLoading}
                inputMode="decimal"
              />
              {touched.amount && errors.amount && (
                <span className="error-text">{errors.amount}</span>
              )}
            </div>

            <div className={styles.field}>
              <Label htmlFor="occurred_on">Date *</Label>
              <Input
                id="occurred_on"
                name="occurred_on"
                type="date"
                value={formData.occurred_on}
                onChange={e => handleChange("occurred_on", e.target.value)}
                onBlur={e => handleBlur("occurred_on", e.target.value)}
                required
                disabled={isLoading}
                max={new Date().toISOString().split("T")[0]}
              />
              {touched.occurred_on && errors.occurred_on && (
                <span className="error-text">{errors.occurred_on}</span>
              )}
            </div>
          </div>

          <div className={styles.field} style={{ gridColumn: "1 / -1" }}>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={e => handleChange("title", e.target.value)}
              onBlur={e => handleBlur("title", e.target.value)}
              placeholder="Transaction title"
              required
              disabled={isLoading}
              maxLength={100}
            />
            {touched.title && errors.title && <span className="error-text">{errors.title}</span>}
          </div>

          <div className={styles.field} style={{ gridColumn: "1 / -1" }}>
            <Label htmlFor="payment_method">Payment Method</Label>
            <Dropdown
              id="payment_method"
              name="payment_method"
              options={PAYMENT_METHOD_OPTIONS}
              value={formData.payment_method}
              onChange={value => handleChange("payment_method", value)}
              placeholder="Select payment method"
              disabled={isLoading}
            />
          </div>

          <div className={styles.field} style={{ gridColumn: "1 / -1" }}>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={e => handleChange("description", e.target.value)}
              placeholder="Optional description"
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
            <span>Please fix the errors above before submitting</span>
          </div>
        )}

        <div className={styles.actions}>
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
              Cancel
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
