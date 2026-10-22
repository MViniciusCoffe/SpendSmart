"use client"

import { useState, useRef, useEffect } from "react"
import styles from "./Popover.module.css"

export function Popover({
  children,
  content,
  position = "top",
  className = "",
  trigger = "hover",
  ...props
}) {
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef(null)
  const contentRef = useRef(null)

  useEffect(() => {
    if (trigger === "click") return

    const handleMouseEnter = () => setIsOpen(true)
    const handleMouseLeave = () => setIsOpen(false)

    const wrapper = wrapperRef.current
    if (wrapper) {
      wrapper.addEventListener("mouseenter", handleMouseEnter)
      wrapper.addEventListener("mouseleave", handleMouseLeave)
    }

    return () => {
      if (wrapper) {
        wrapper.removeEventListener("mouseenter", handleMouseEnter)
        wrapper.removeEventListener("mouseleave", handleMouseLeave)
      }
    }
  }, [trigger])

  useEffect(() => {
    if (trigger !== "click") return

    const handleClickOutside = event => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target) &&
        contentRef.current &&
        !contentRef.current.contains(event.target)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen, trigger])

  const handleKeyDown = event => {
    if (event.key === "Escape") {
      setIsOpen(false)
    }
  }

  if (!content) return <>{children}</>

  return (
    <div
      ref={wrapperRef}
      className={`${styles.wrapper} ${styles[position]} ${isOpen ? "[data-open=true]" : ""} ${className}`}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {typeof children === "function" ? (
        // eslint-disable-next-line react-hooks/refs
        children({ isOpen, setIsOpen, triggerRef: wrapperRef })
      ) : (
        <div
          className={styles.trigger}
          onClick={trigger === "click" ? () => setIsOpen(!isOpen) : undefined}
          tabIndex={trigger === "click" ? 0 : undefined}
          role={trigger === "click" ? "button" : undefined}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
        >
          {children}
        </div>
      )}
      <div ref={contentRef} className={styles.content} role="dialog" aria-modal="false">
        <div className={styles.arrow} aria-hidden="true" />
        {content}
      </div>
    </div>
  )
}
