"use client"

import styles from "./Checkbox.module.css"

export function Checkbox({
  id,
  label,
  description,
  checked,
  onChange,
  disabled = false,
  required = false,
  name,
  value = "on",
  className = "",
  ...props
}) {
  const checkboxId = id || name || `checkbox-${Math.random().toString(36).slice(2, 9)}`

  return (
    <div className={`${styles.wrapper} ${className}`}>
      <label className={styles.root} htmlFor={checkboxId}>
        <input
          type="checkbox"
          id={checkboxId}
          name={name}
          value={value}
          className={styles.input}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          required={required}
          {...props}
        />
        <span className={styles.box} aria-hidden="true">
          <svg
            className={styles.icon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
        <span className={styles.label}>{label}</span>
      </label>
      {description && <p className={styles.description}>{description}</p>}
    </div>
  )
}
