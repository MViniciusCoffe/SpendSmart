"use client"

import { useState } from "react"
import styles from "./Accordion.module.css"

export function Accordion({
  type = "multiple",
  defaultValue,
  value,
  onChange,
  children,
  className = "",
  ...props
}) {
  const [openValues, setOpenValues] = useState(() => {
    if (defaultValue === undefined) return type === "single" ? null : []
    return type === "single"
      ? defaultValue
      : Array.isArray(defaultValue)
        ? defaultValue
        : [defaultValue]
  })

  const isControlled = value !== undefined
  const currentValues = isControlled ? value : openValues

  const handleToggle = itemValue => {
    let newValues
    if (type === "single") {
      newValues = currentValues === itemValue ? null : itemValue
    } else {
      if (currentValues.includes(itemValue)) {
        newValues = currentValues.filter(v => v !== itemValue)
      } else {
        newValues = [...currentValues, itemValue]
      }
    }

    if (!isControlled) {
      setOpenValues(newValues)
    }
    onChange?.(newValues)
  }

  const items = React.Children.toArray(children).filter(React.isValidElement)

  return (
    <div className={`${styles.root} ${className}`} {...props}>
      {items.map((item, index) =>
        React.cloneElement(item, {
          isOpen:
            type === "single"
              ? currentValues === item.props.value
              : currentValues.includes(item.props.value),
          onToggle: handleToggle,
          key: item.key || `accordion-item-${index}`
        })
      )}
    </div>
  )
}

export function AccordionItem({
  value,
  children,
  disabled = false,
  className = "",
  isOpen,
  onToggle,
  ...props
}) {
  return (
    <div
      className={`${styles.item} ${isOpen ? "[data-state=open]" : ""} ${className}`}
      data-state={isOpen ? "open" : "closed"}
      {...props}
    >
      <button
        type="button"
        className={styles.trigger}
        disabled={disabled}
        onClick={() => !disabled && onToggle?.(value)}
        aria-expanded={isOpen}
        aria-controls={`accordion-content-${value}`}
        id={`accordion-trigger-${value}`}
      >
        <span>{children}</span>
        <svg
          className={styles.icon}
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <div
        id={`accordion-content-${value}`}
        role="region"
        aria-labelledby={`accordion-trigger-${value}`}
        className={`${styles.content} ${isOpen ? "[data-state=open]" : ""}`}
        data-state={isOpen ? "open" : "closed"}
        hidden={!isOpen}
      >
        <div className={styles.contentInner}>
          {typeof children === "function" ? children({ isOpen }) : children}
        </div>
      </div>
    </div>
  )
}
