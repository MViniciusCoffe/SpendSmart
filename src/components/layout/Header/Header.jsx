"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import styles from "./Header.module.css"

export function Header() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
    { name: "Transactions", href: "/transactions", icon: "transactions" },
    { name: "Categories", href: "/categories", icon: "categories" },
    { name: "Settings", href: "/settings", icon: "settings" }
  ]

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  return (
    <header className={styles.header} role="banner">
      <div className={styles.container}>
        {/* Logo */}
        <Link href="/dashboard" className={styles.logo} aria-label="SpendSmart Home">
          <svg className={styles.logoIcon} viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <rect width="32" height="32" rx="8" fill="var(--color-mercury)" />
            <path
              d="M8 16L12 12L16 16"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className={styles.logoText}>SpendSmart</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className={styles.desktopNav} aria-label="Main navigation">
          <ul className={styles.navList} role="list">
            {navigation.map(item => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`${styles.navLink} ${pathname === item.href ? styles.active : ""}`}
                  aria-current={pathname === item.href ? "page" : undefined}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Desktop User Menu */}
        <div className={styles.userMenuDesktop}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              {user?.full_name?.charAt(0)?.toUpperCase() ||
                user?.email?.charAt(0)?.toUpperCase() ||
                "U"}
            </div>
            <div className={styles.userDetails}>
              <span className={styles.userName}>{user?.full_name || "User"}</span>
              <span className={styles.userEmail}>{user?.email}</span>
            </div>
          </div>
          <button className={styles.logoutButton} onClick={handleLogout} aria-label="Logout">
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
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className={styles.mobileMenuButton}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
          aria-label="Toggle menu"
        >
          <span className={styles.hamburger} aria-hidden="true">
            <span className={mobileMenuOpen ? "open" : ""} />
            <span className={mobileMenuOpen ? "open" : ""} />
            <span className={mobileMenuOpen ? "open" : ""} />
          </span>
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <>
          <div
            className={styles.backdrop}
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <nav
            id="mobile-menu"
            className={styles.mobileNav}
            role="navigation"
            aria-label="Mobile navigation"
          >
            <div className={styles.mobileHeader}>
              <Link
                href="/dashboard"
                className={styles.logo}
                onClick={() => setMobileMenuOpen(false)}
              >
                <svg className={styles.logoIcon} viewBox="0 0 32 32" fill="none" aria-hidden="true">
                  <rect width="32" height="32" rx="8" fill="var(--color-mercury)" />
                  <path
                    d="M8 16L12 12L16 16"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className={styles.logoText}>SpendSmart</span>
              </Link>
              <button
                className={styles.closeButton}
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <ul className={styles.mobileNavList} role="list">
              {navigation.map(item => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`${styles.mobileNavLink} ${pathname === item.href ? "active" : ""}`}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-current={pathname === item.href ? "page" : undefined}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
              <li>
                <hr className={styles.divider} />
              </li>
              <li>
                <div className={styles.mobileUserInfo}>
                  <div className={styles.avatar}>
                    {user?.full_name?.charAt(0)?.toUpperCase() ||
                      user?.email?.charAt(0)?.toUpperCase() ||
                      "U"}
                  </div>
                  <div className={styles.userDetails}>
                    <span className={styles.userName}>{user?.full_name || "User"}</span>
                    <span className={styles.userEmail}>{user?.email}</span>
                  </div>
                </div>
              </li>
              <li>
                <button className={styles.mobileLogoutButton} onClick={handleLogout}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="w-5 h-5"
                    aria-hidden="true"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>Logout</span>
                </button>
              </li>
            </ul>
          </nav>
        </>
      )}
    </header>
  )
}
