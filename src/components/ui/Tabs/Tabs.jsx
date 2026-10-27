"use client"

import { createContext, useContext, forwardRef, useState } from "react"
import styles from "./Tabs.module.css"

// Context for Tabs
const TabsContext = createContext(null)

function useTabsContext() {
  return useContext(TabsContext)
}

export function TabsProvider({ children, value, onChange }) {
  return (
    <TabsContext.Provider value={{ activeValue: value, onChange }}>{children}</TabsContext.Provider>
  )
}

export const Tabs = forwardRef(function Tabs(
  { defaultValue, value: controlledValue, onChange, children, className = "", ...props },
  ref
) {
  const [internalValue, setInternalValue] = useState(defaultValue)
  const activeValue = controlledValue !== undefined ? controlledValue : internalValue

  const handleChange = value => {
    if (controlledValue === undefined) {
      setInternalValue(value)
    }
    onChange?.(value)
  }

  return (
    <TabsProvider value={activeValue} onChange={handleChange}>
      <div ref={ref} className={`${styles.root} ${className}`} {...props}>
        <div data-active-value={activeValue}>{children}</div>
      </div>
    </TabsProvider>
  )
})

Tabs.displayName = "Tabs"

export const TabList = forwardRef(function TabList({ children, className = "", ...props }, ref) {
  return (
    <div ref={ref} role="tablist" className={`${styles.list} ${className}`} {...props}>
      {children}
    </div>
  )
})

TabList.displayName = "TabList"

export const TabTrigger = forwardRef(function TabTrigger(
  { value, children, disabled, className = "", ...props },
  ref
) {
  const context = useTabsContext()
  const isActive = context?.activeValue === value

  const handleClick = () => {
    if (!disabled) {
      context?.onChange(value)
    }
  }

  return (
    <button
      ref={ref}
      role="tab"
      aria-selected={isActive}
      aria-disabled={disabled}
      data-state={isActive ? "active" : "inactive"}
      disabled={disabled}
      onClick={handleClick}
      className={`${styles.trigger} ${isActive ? styles.active : ""} ${disabled ? styles.disabled : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
})

TabTrigger.displayName = "TabTrigger"

export const TabPanel = forwardRef(function TabPanel(
  { value, children, className = "", ...props },
  ref
) {
  const context = useTabsContext()
  const isActive = context?.activeValue === value

  if (!isActive) return null

  return (
    <div
      ref={ref}
      role="tabpanel"
      hidden={!isActive}
      className={`${styles.panel} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
})

TabPanel.displayName = "TabPanel"
