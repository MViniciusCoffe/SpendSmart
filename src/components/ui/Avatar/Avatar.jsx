"use client"

import styles from "./Avatar.module.css"

function getInitials(name) {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function Avatar({ src, alt, name, size = "md", className = "", ...props }) {
  const initials = name ? getInitials(name) : "?"
  const hasImage = Boolean(src)

  return (
    <div
      className={`${styles.root} ${styles[size]} ${className}`}
      role="img"
      aria-label={alt || name || "Avatar do usuário"}
      {...props}
    >
      {hasImage ? (
        <img src={src} alt={alt || ""} className={styles.image} />
      ) : (
        <span className={styles.fallback} aria-hidden="true">
          {initials}
        </span>
      )}
    </div>
  )
}

export function AvatarGroup({ children, className = "", max = 5, ...props }) {
  const avatars = Array.isArray(children) ? children : [children]
  const visibleAvatars = avatars.slice(0, max)
  const remainingCount = avatars.length - max

  return (
    <div className={`${styles.group} ${className}`} {...props}>
      {visibleAvatars.map((avatar, index) => (
        <span key={index} style={{ zIndex: avatars.length - index }}>
          {avatar}
        </span>
      ))}
      {remainingCount > 0 && (
        <Avatar
          name={`+${remainingCount}`}
          size="md"
          className={styles.root}
          style={{ background: "var(--color-bg-tertiary)", color: "var(--color-text-secondary)" }}
        />
      )}
    </div>
  )
}
