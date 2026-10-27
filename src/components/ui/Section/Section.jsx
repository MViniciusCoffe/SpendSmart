import React from "react"
import styles from "./Section.module.css"
import { cn } from "@/lib/utils/cn"

export function Section({
  children,
  size = "md",
  container = true,
  className = "",
  containerClassName = "",
  as: Component = "section",
  ...props
}) {
  return (
    <Component className={cn(styles.section, styles[size], className)} {...props}>
      {container ? (
        <div className={cn(styles.container, containerClassName)}>{children}</div>
      ) : (
        children
      )}
    </Component>
  )
}
