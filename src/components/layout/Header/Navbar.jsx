"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import styles from "./Navbar.module.css"
import { Button, Icon } from "@/components/ui"
import { siteConfig } from "@/lib/config/siteConfig"
import { authService } from "@/services/authServices"
import { cn } from "@/lib/utils/cn"

export function Navbar({ variant = "public" }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()

  const links = variant === "public" ? siteConfig.publicNav : siteConfig.appNav

  const handleLogout = async e => {
    e.preventDefault()
    try {
      await authService.logoutUser()
      if (router) {
        router.replace("/login")
      }
    } catch (error) {
      console.error("[Supabase Logout Error]", error.message)
    }
  }

  const toggleMenu = () => setIsMenuOpen(prev => !prev)
  const closeMenu = () => setIsMenuOpen(false)

  return (
    <nav className={styles.navbar} aria-label="Navegação principal">
      <Link
        href={variant === "public" ? "/" : "/dashboard"}
        className={styles.logo}
        onClick={closeMenu}
      >
        <span className={styles.logoIcon}>
          <Icon name="logo" size={26} />
        </span>
        <span className={styles.logoText}>SpendSmart</span>
      </Link>

      <div className={styles.navigation}>
        <ul className={styles.links}>
          {links.map(link => (
            <li key={link.href}>
              <Link href={link.href} className={styles.navLink}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.authGroup}>
        {variant === "public" ? (
          <>
            <Link href="/login" style={{ textDecoration: "none" }}>
              <Button variant="ghost" size="sm">
                Entrar
              </Button>
            </Link>
            <Link href="/register" style={{ textDecoration: "none" }}>
              <Button variant="primary" size="sm">
                Começar grátis
              </Button>
            </Link>
          </>
        ) : (
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Sair
          </Button>
        )}
      </div>

      <button
        type="button"
        className={styles.hamburger}
        onClick={toggleMenu}
        aria-expanded={isMenuOpen}
        aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
      >
        <Icon name={isMenuOpen ? "x" : "menu"} size={22} />
      </button>

      <div className={cn(styles.mobileMenu, isMenuOpen && styles.mobileMenuOpen)}>
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={styles.mobileNavLink}
            onClick={closeMenu}
          >
            {link.label}
          </Link>
        ))}

        <div className={styles.mobileAuthButtons}>
          {variant === "public" ? (
            <>
              <Link href="/login" onClick={closeMenu} style={{ textDecoration: "none" }}>
                <Button variant="ghost" size="md" fullWidth>
                  Entrar
                </Button>
              </Link>
              <Link href="/register" onClick={closeMenu} style={{ textDecoration: "none" }}>
                <Button variant="primary" size="md" fullWidth>
                  Começar grátis
                </Button>
              </Link>
            </>
          ) : (
            <Button variant="ghost" size="md" fullWidth onClick={handleLogout}>
              Sair
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
