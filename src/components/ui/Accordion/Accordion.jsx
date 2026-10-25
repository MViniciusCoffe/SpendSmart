"use client"

import React, { useState } from "react"
import styles from "./Accordion.module.css"
import { Icon } from "../Icon/Icon"
import { cn } from "@/lib/utils/cn"

export function Accordion({ items = [], allowMultiple = false, className = "" }) {
  const [openIndices, setOpenIndices] = useState([0]) // default first open

  const handleToggle = (index, event) => {
    event.preventDefault()
    setOpenIndices(prev => {
      const isOpen = prev.includes(index)
      if (allowMultiple) {
        return isOpen ? prev.filter(i => i !== index) : [...prev, index]
      }
      return isOpen ? [] : [index]
    })
  }

  return (
    <div className={cn(styles.accordion, className)}>
      {items.map((item, index) => {
        const isOpen = openIndices.includes(index)
        return (
          <details key={item.title || index} className={styles.item} open={isOpen}>
            <summary
              className={styles.summary}
              onClick={e => handleToggle(index, e)}
              aria-expanded={isOpen}
            >
              <span>{item.title}</span>
              <span className={styles.icon}>
                <Icon name="chevron-down" size={18} />
              </span>
            </summary>
            {isOpen && <div className={styles.content}>{item.content}</div>}
          </details>
        )
      })}
    </div>
  )
}
