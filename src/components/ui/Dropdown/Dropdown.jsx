"use client"

import { useState, useRef, useEffect } from "react"
import styles from "./Dropdown.module.css"

export function Dropdown({
  options = [],
  value,
  onChange,
  placeholder = "Select an option",
  disabled = false,
  searchable = false,
  className = "",
  name,
  required = false,
  ...props
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const wrapperRef = useRef(null)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = event => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchQuery("")
    }
  }, [isOpen])

  const filteredOptions = options.filter(option => {
    if (!searchQuery) return true
    const label = typeof option === "string" ? option : option.label
    return label.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const handleKeyDown = event => {
    if (event.key === "Escape") {
      setIsOpen(false)
      triggerRef.current?.focus()
    } else if (event.key === "ArrowDown") {
      event.preventDefault()
      const firstItem = menuRef.current?.querySelector('[role="option"]:not([disabled])')
      firstItem?.focus()
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      const lastItem = menuRef.current?.querySelector('[role="option"]:not([disabled]):last-child')
      lastItem?.focus()
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
      }
    }
  }

  const handleItemKeyDown = (event, optionValue) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      onChange?.(optionValue)
      setIsOpen(false)
      triggerRef.current?.focus()
    } else if (event.key === "ArrowDown") {
      event.preventDefault()
      const nextItem = event.target.nextElementSibling
      if (nextItem && nextItem.getAttribute("role") === "option") {
        nextItem.focus()
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      const prevItem = event.target.previousElementSibling
      if (prevItem && prevItem.getAttribute("role") === "option") {
        prevItem.focus()
      }
    }
  }

  const selectedOption = options.find(opt => {
    const optValue = typeof opt === "string" ? opt : opt.value
    return optValue === value
  })
  const selectedLabel = selectedOption
    ? typeof selectedOption === "string"
      ? selectedOption
      : selectedOption.label
    : placeholder

  return (
    <div
      ref={wrapperRef}
      className={`${styles.wrapper} ${isOpen ? styles.open : ""} ${className}`}
      {...props}
    >
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={placeholder}
      >
        <span>{selectedLabel}</span>
        <svg
          className={styles.triggerIcon}
          width="16"
          height="16"
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

      {isOpen && (
        <div ref={menuRef} className={styles.menu} role="listbox" aria-label={placeholder}>
          {searchable && (
            <div style={{ padding: "var(--space-2)" }}>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "var(--space-1) var(--space-2)",
                  fontSize: "var(--text-sm)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--color-bg-primary)",
                  color: "var(--color-text-primary)",
                  outline: "none"
                }}
                onKeyDown={e => e.stopPropagation()}
              />
            </div>
          )}
          {filteredOptions.length === 0 ? (
            <div className={styles.empty}>No options found</div>
          ) : (
            filteredOptions.map((option, index) => {
              const optValue = typeof option === "string" ? option : option.value
              const optLabel = typeof option === "string" ? option : option.label
              const optDisabled = typeof option === "object" ? option.disabled : false
              const isSelected = optValue === value

              return (
                <button
                  key={optValue || index}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={optDisabled}
                  disabled={optDisabled}
                  className={`${styles.item} ${isSelected ? styles.itemSelected : ""}`}
                  onClick={() => !optDisabled && (onChange?.(optValue), setIsOpen(false))}
                  onKeyDown={e => handleItemKeyDown(e, optValue)}
                  tabIndex={-1}
                >
                  {optLabel}
                </button>
              )
            })
          )}
        </div>
      )}

      {name && <input type="hidden" name={name} value={value || ""} required={required} />}
    </div>
  )
}
