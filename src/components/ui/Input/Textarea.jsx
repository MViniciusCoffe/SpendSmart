"use client"

import { forwardRef } from "react"
import styles from "./Input.module.css"

export const Textarea = forwardRef(function Textarea(
  {
    label,
    placeholder,
    error,
    helperText,
    disabled = false,
    required = false,
    readOnly = false,
    fullWidth = false,
    rows = 4,
    className = "",
    id,
    name,
    value,
    onChange,
    onBlur,
    onFocus,
    minLength,
    maxLength,
    "aria-label": ariaLabel,
    "aria-describedby": ariaDescribedBy,
    ...props
  },
  ref
) {
  const inputId = id || name
  const errorId = error ? `${inputId}-error` : undefined
  const helperId = helperText ? `${inputId}-helper` : undefined
  const describedBy = [errorId, helperId].filter(Boolean).join(" ") || undefined

  return (
    <div className={`${styles.wrapper} ${fullWidth && styles.fullWidth} ${className}`}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
          {required && (
            <span className={styles.required} aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <div className={styles.inputWrapper}>
        <textarea
          ref={ref}
          id={inputId}
          name={name}
          className={`${styles.input} ${styles.textarea} ${error && styles.error} ${disabled && styles.disabled} ${readOnly && styles.readOnly}`}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          readOnly={readOnly}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          rows={rows}
          minLength={minLength}
          maxLength={maxLength}
          aria-label={ariaLabel}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={describedBy}
          aria-required={required}
          {...props}
        />
      </div>

      {error && (
        <p id={errorId} className={styles.errorMessage} role="alert">
          {error}
        </p>
      )}

      {helperText && !error && (
        <p id={helperId} className={styles.helperText}>
          {helperText}
        </p>
      )}
    </div>
  )
})

Textarea.displayName = "Textarea"

export default Textarea
