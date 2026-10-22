"use client"

import { useState } from "react"
import styles from "./Tabs.module.css"

export function Tabs({ defaultValue, value, onChange, children, className = "", ...props }) {
  const [activeValue, setActiveValue] = useState(defaultValue)
  const isControlled = value !== undefined
  const currentValue = isControlled ? value : activeValue

  const handleChange = newValue => {
    if (!isControlled) {
      setActiveValue(newValue)
    }
    onChange?.(newValue)
  }

  const tabs = React.Children.toArray(children).filter(React.isValidElement)
  const tabList = tabs.filter(tab => tab.type === TabList)
  const tabPanels = tabs.filter(tab => tab.type === TabPanel)

  return (
    <div className={`${styles.root} ${className}`} {...props}>
      {tabList.map((list, index) =>
        React.cloneElement(list, {
          activeValue: currentValue,
          onChange: handleChange,
          key: list.key || `tablist-${index}`
        })
      )}
      {tabPanels.map((panel, index) =>
        React.cloneElement(panel, {
          activeValue: currentValue,
          key: panel.key || `tabpanel-${index}`
        })
      )}
    </div>
  )
}

export function TabList({ children, activeValue, onChange, className = "", ...props }) {
  const triggers = React.Children.toArray(children).filter(React.isValidElement)

  return (
    <div role="tablist" className={`${styles.list} ${className}`} {...props}>
      {triggers.map((trigger, index) =>
        React.cloneElement(trigger, {
          activeValue,
          onChange,
          key: trigger.key || `tab-${index}`
        })
      )}
    </div>
  )
}

export function TabTrigger({
  value,
  children,
  disabled = false,
  activeValue,
  onChange,
  className = "",
  ...props
}) {
  const isActive = activeValue === value

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`panel-${value}`}
      id={`tab-${value}`}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      className={`${styles.trigger} ${className}`}
      data-state={isActive ? "active" : "inactive"}
      onClick={() => !disabled && onChange?.(value)}
      {...props}
    >
      {children}
    </button>
  )
}

export function TabPanel({ value, children, activeValue, className = "", ...props }) {
  const isActive = activeValue === value

  return (
    <div
      role="tabpanel"
      id={`panel-${value}`}
      aria-labelledby={`tab-${value}`}
      className={`${styles.content} ${className}`}
      data-state={isActive ? "active" : "inactive"}
      hidden={!isActive}
      {...props}
    >
      {isActive && children}
    </div>
  )
}
