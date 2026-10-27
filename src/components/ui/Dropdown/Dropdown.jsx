"use client"

import { forwardRef } from "react"
import styles from "./Dropdown.module.css"

export const Dropdown = forwardRef(function Dropdown(
  {
    id,
    name,
    options = [],
    value,
    onChange,
    placeholder,
    required,
    disabled,
    error,
    className = "",
    ...props
  },
  ref
) {
  return (
    <select
      ref={ref}
      id={id}
      name={name}
      value={value}
      onChange={e => onChange?.(e.target.value)}
      required={required}
      disabled={disabled}
      className={`${styles.select} ${error ? styles.error : ""} ${className}`}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
})

Dropdown.displayName = "Dropdown"
