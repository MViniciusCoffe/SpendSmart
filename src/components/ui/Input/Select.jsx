"use client"

import { forwardRef } from "react"
import styles from "./Input.module.css"

export const Select = forwardRef(function Select(
  {
    label,
    placeholder = "Select an option",
    error,
    helperText,
    disabled = false,
    required = false,
    fullWidth = false,
    className = "",
    id,
    name,
    value,
    onChange,
    onBlur,
    onFocus,
    options = [],
    className: classNameProp,
    ...props
  },
  ref
) {
  const inputId = id || name
  const errorId = error ? `${inputId}-error` : undefined
  const helperId = helperText ? `${inputId}-helper` : undefined
  const describedBy = [errorId, helperId].filter(Boolean).join(" ") || undefined

  return (
    <div className={`${styles.wrapper} ${fullWidth && styles.fullWidth} ${classNameProp}`}>
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
        <select
          ref={ref}
          id={inputId}
          name={name}
          className={`${styles.input} ${styles.select} ${error && styles.error} ${disabled && styles.disabled}`}
          disabled={disabled}
          required={required}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={describedBy}
          aria-required={required}
          {...props}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
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

Select.displayName = "Select"

export default Select
