"use client"

import React, { useState } from "react"
import Link from "next/link"
import styles from "./navbar.module.css"

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(prev => !prev)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  return (
    <nav className={styles.navbar} aria-label="Navegação principal">
      <Link href="/" className={styles.logo} onClick={closeMenu} aria-label="SpendSmart - Início">
        <span className={styles.logoIcon} aria-hidden="true">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </span>
        <span className={styles.logoText}>SpendSmart</span>
      </Link>

      <div className={styles.navigation}>
        <ul className={styles.links}>
          <li>
            <Link href="/" className={styles.navLink}>
              Início
            </Link>
          </li>
          <li>
            <Link href="/about" className={styles.navLink}>
              Sobre
            </Link>
          </li>
          <li>
            <Link href="/contact" className={styles.navLink}>
              Contato
            </Link>
          </li>
          <li>
            <Link href="/status" className={styles.navLink}>
              Status
            </Link>
          </li>
        </ul>
      </div>

      <div className={styles.authGroup}>
        <Link href="/login" className={styles.loginBtn}>
          Entrar
        </Link>
        <Link href="/register" className={styles.registerBtn}>
          Começar grátis
        </Link>
      </div>

      <button
        type="button"
        className={`${styles.hamburger} ${isMenuOpen ? styles.hamburgerOpen : ""}`}
        onClick={toggleMenu}
        aria-expanded={isMenuOpen}
        aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
      >
        <span className={styles.hamburgerLine}></span>
        <span className={styles.hamburgerLine}></span>
        <span className={styles.hamburgerLine}></span>
      </button>

      <div
        className={`${styles.mobileMenu} ${isMenuOpen ? styles.mobileMenuOpen : ""}`}
        aria-hidden={!isMenuOpen}
      >
        <Link href="/" className={styles.mobileNavLink} onClick={closeMenu}>
          Início
        </Link>
        <Link href="/about" className={styles.mobileNavLink} onClick={closeMenu}>
          Sobre
        </Link>
        <Link href="/contact" className={styles.mobileNavLink} onClick={closeMenu}>
          Contato
        </Link>
        <Link href="/status" className={styles.mobileNavLink} onClick={closeMenu}>
          Status
        </Link>
        <div className={styles.mobileAuthButtons}>
          <Link href="/login" className={styles.loginBtn} onClick={closeMenu}>
            Entrar
          </Link>
          <Link href="/register" className={styles.registerBtn} onClick={closeMenu}>
            Começar grátis
          </Link>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
