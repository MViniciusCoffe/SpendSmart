import React from "react"
import Link from "next/link"
import styles from "./Footer.module.css"
import { Icon, Badge } from "@/components/ui"
import { siteConfig } from "@/lib/config/siteConfig"

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div
        className="container"
        style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 1.5rem" }}
      >
        <div className={styles.grid}>
          <div className={styles.brand}>
            <Link href="/" className={styles.brandLogo} aria-label="SpendSmart Início">
              <Icon name="logo" size={24} style={{ color: "var(--color-mercury, #00d4aa)" }} />
              <span>{siteConfig.name}</span>
            </Link>
            <p className={styles.brandDesc}>{siteConfig.description}</p>
          </div>

          <div>
            <h4 className={styles.title}>Navegação</h4>
            <ul className={styles.navList}>
              {siteConfig.publicNav.map(item => (
                <li key={item.href}>
                  <Link href={item.href} className={styles.navLink}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className={styles.title}>GitHub & Tecnologias</h4>
            <a
              href={siteConfig.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.repoLink}
            >
              <Icon name="github" size={16} />
              <span>MViniciusCoffe/SpendSmart</span>
            </a>
            <div className={styles.techBadges}>
              {siteConfig.techBadges.map(tech => (
                <a
                  key={tech.name}
                  href={tech.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "none" }}
                >
                  <Badge variant="default" size="sm" style={{ cursor: "pointer" }}>
                    {tech.name}
                  </Badge>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <div>{siteConfig.academicNotice}</div>
          <div>Arquitetura Fullstack com RLS & Supabase Auth</div>
        </div>
      </div>
    </footer>
  )
}
