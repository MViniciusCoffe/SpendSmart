"use client"

import { forwardRef } from "react"
import styles from "./Input.module.css"

export const Input = forwardRef(function Input(
  {
    label,
    type = "text",
    placeholder,
    error,
    helperText,
    disabled = false,
    required = false,
    readOnly = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    className = "",
    id,
    name,
    value,
    onChange,
    onBlur,
    onFocus,
    autoComplete,
    inputMode,
    pattern,
    min,
    max,
    step,
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
        {props.leftIcon && (
          <span className={styles.iconLeft} aria-hidden="true">
            {props.leftIcon}
          </span>
        )}

        <input
          ref={ref}
          type={type}
          id={inputId}
          name={name}
          className={`${styles.input} ${error && styles.error} ${disabled && styles.disabled} ${readOnly && styles.readOnly}`}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          readOnly={readOnly}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          autoComplete={autoComplete}
          inputMode={inputMode}
          pattern={pattern}
          min={min}
          max={max}
          step={step}
          minLength={minLength}
          maxLength={maxLength}
          aria-label={ariaLabel}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={describedBy}
          aria-required={required}
          {...props}
        />

        {props.rightIcon && (
          <span className={styles.iconRight} aria-hidden="true">
            {props.rightIcon}
          </span>
        )}

        {props.showPasswordToggle && type === "password" && (
          <button
            type="button"
            className={styles.passwordToggle}
            onClick={() => {
              // This would need state management - simplified for now
            }}
            aria-label="Toggle password visibility"
          >
            👁
          </button>
        )}
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

Input.displayName = "Input"

export default Input
