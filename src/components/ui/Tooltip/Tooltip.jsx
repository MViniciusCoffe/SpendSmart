"use client"

import { useState } from "react"
import styles from "./Tooltip.module.css"

export function Tooltip({ content, children, position = "top", className = "", ...props }) {
  const [isVisible, setIsVisible] = useState(false)

  if (!content) return <>{children}</>

  return (
    <div
      className={`${styles.wrapper} ${styles[position]} ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
      {...props}
    >
      {children}
      <div className={styles.tooltip} role="tooltip" aria-hidden={!isVisible}>
        {content}
      </div>
    </div>
  )
}
