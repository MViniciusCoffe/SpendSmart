"use client"

import { forwardRef } from "react"
import styles from "./Input.module.css"

export const Input = forwardRef(function Input(
  {
    id,
    name,
    type = "text",
    value,
    onChange,
    onBlur,
    placeholder,
    required,
    disabled,
    maxLength,
    min,
    max,
    step,
    inputMode,
    error,
    className = "",
    ...props
  },
  ref
) {
  return (
    <input
      ref={ref}
      id={id}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      maxLength={maxLength}
      min={min}
      max={max}
      step={step}
      inputMode={inputMode}
      className={`${styles.input} ${error ? styles.error : ""} ${className}`}
      {...props}
    />
  )
})

Input.displayName = "Input"
