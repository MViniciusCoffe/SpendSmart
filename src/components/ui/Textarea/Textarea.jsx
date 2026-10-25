"use client"

import { forwardRef } from "react"
import styles from "./Textarea.module.css"

export const Textarea = forwardRef(function Textarea(
  {
    id,
    name,
    value,
    onChange,
    onBlur,
    placeholder,
    required,
    disabled,
    rows = 3,
    className = "",
    ...props
  },
  ref
) {
  return (
    <textarea
      ref={ref}
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      rows={rows}
      className={`${styles.textarea} ${className}`}
      {...props}
    />
  )
})

Textarea.displayName = "Textarea"
