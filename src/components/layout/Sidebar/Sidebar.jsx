"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRightIcon } from "@heroicons/react/24/outline"
import styles from "./Sidebar.module.css"

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="w-5 h-5"
      >
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </svg>
    )
  },
  {
    name: "Transações",
    href: "/transactions",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="w-5 h-5"
      >
        <path d="M12 2v20M17 5H7a2 2 0 0 1 0-4h10a2 2 0 0 1 0 4H7v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 1-2-2h-4" />
      </svg>
    )
  },
  {
    name: "Categorias",
    href: "/categories",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="w-5 h-5"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    )
  },
  {
    name: "Configurações",
    href: "/settings",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="w-5 h-5"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82 5 5 0 0 1-6 0 1.65 1.65 0 0 0 .33-1.82 8 8 0 1 1 8 0z" />
        <path d="M12 2.25V4.5M12 19.5V22M4.5 12H2.25M21.75 12H22.5" />
      </svg>
    )
  }
]

export function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setCollapsed(false)
      }
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <aside
      className={`${styles.sidebar} ${isOpen ? styles.open : ""} ${collapsed ? styles.collapsed : ""}`}
      aria-label="Navegação principal"
    >
      <div className={styles.header}>
        <Link
          href="/dashboard"
          className={styles.logo}
          onClick={() => window.innerWidth < 1024 && onClose()}
        >
          <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8" aria-hidden="true">
            <rect width="32" height="32" rx="8" fill="var(--color-mercury)" />
            <path
              d="M8 16L12 12L16 16"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {!collapsed && <span className="logoText">SpendSmart</span>}
        </Link>
        <button
          className={styles.toggleButton}
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
          aria-expanded={!collapsed}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-5 h-5"
          >
            <polyline points="15 18 15 6 15 6 15 6" />
            <polyline points="9 6 15 12 15 18 15 18" />
          </svg>
        </button>
      </div>

      <nav className={styles.nav} aria-label="Navegação principal">
        <ul className={styles.navList} role="list">
          {navigation.map(item => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`${styles.navLink} ${window.location.pathname === item.href ? "active" : ""}`}
                onClick={() =>
                  window.innerWidth < 1024 && window.dispatchEvent(new Event("closeSidebar"))
                }
                aria-current={window.location.pathname === item.href ? "page" : undefined}
              >
                <span className={styles.navIcon} aria-hidden="true">
                  {item.icon}
                </span>
                <span className={styles.navText}>{item.name}</span>
                <ChevronRightIcon className="w-4 h-4 text-tertiary" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className={styles.footer}>
        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>
            <span>U</span>
          </div>
          <div className={styles.userInfoText}>
            <span className={styles.userName}>User</span>
            <span className={styles.userEmail}>user@email.com</span>
          </div>
        </div>
        <button className={styles.logoutButton} aria-label="Sair">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-5 h-5"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className="logoutText">Logout</span>
        </button>
      </div>
    </aside>
  )
}
