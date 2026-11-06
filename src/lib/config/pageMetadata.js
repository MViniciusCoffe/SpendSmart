import { siteConfig } from "./siteConfig"

export const OG_IMAGE = {
  url: "/images/og-default.jpg",
  width: 1200,
  height: 630,
  // Descreve a foto de verdade (não é uma captura do app): o alt é lido por leitores de tela
  alt: "Mãos contando cédulas de dinheiro sobre uma agenda aberta"
}

// Campos de Open Graph iguais em todas as páginas
export const baseOpenGraph = {
  type: "website",
  locale: "pt_BR",
  siteName: siteConfig.name,
  images: [OG_IMAGE]
}

/**
 * Metadados de uma página pública indexável: título, descrição, URL canônica, Open Graph e Twitter.
 *
 * Existe porque o Next.js mescla `metadata` campo a campo: uma página que define só `title` herda o
 * `openGraph` inteiro do layout (o link compartilhado mostraria o título da home), e uma que define
 * `openGraph: { title }` substitui o objeto e perde a imagem. A URL canônica fica aqui, e não no
 * layout raiz, porque o layout a passaria para todas as rotas, inclusive as privadas.
 *
 * @param {{ title: string, description: string, path: string, absolute?: boolean }} page
 *   `absolute`: usa o título como está, sem o sufixo " | SpendSmart" do template do layout.
 * @returns {import('next').Metadata}
 */
export function pageMetadata({ title, description, path, absolute = false }) {
  const fullTitle = absolute ? title : `${title} | ${siteConfig.name}`

  return {
    title: absolute ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: { ...baseOpenGraph, title: fullTitle, description, url: path },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [OG_IMAGE.url]
    }
  }
}
