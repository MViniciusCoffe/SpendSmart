"use client"

import { useId } from "react"
import styles from "./Switch.module.css"

export function Switch({
  id,
  label,
  description,
  checked,
  onChange,
  disabled = false,
  required = false,
  name,
  className = "",
  ...props
}) {
  const generatedId = useId()
  const switchId = id || name || generatedId

  return (
    <div className={`${styles.wrapper} ${className}`}>
      <label className={styles.root} htmlFor={switchId}>
        <input
          type="checkbox"
          id={switchId}
          name={name}
          className={styles.input}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          required={required}
          {...props}
        />
        <span className={styles.track} aria-hidden="true">
          <span className={styles.thumb} />
        </span>
        <span className={styles.label}>{label}</span>
      </label>
      {description && <p className={styles.description}>{description}</p>}
    </div>
  )
}
