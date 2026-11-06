import { siteConfig } from "./siteConfig"

// Campos de Open Graph iguais em todas as páginas. A imagem não fica aqui: ela é gerada por
// src/app/opengraph-image.js e twitter-image.js, e o Next.js a aplica a todas as rotas.
export const baseOpenGraph = {
  type: "website",
  locale: "pt_BR",
  siteName: siteConfig.name
}

/**
 * Metadados de uma página pública indexável: título, descrição, URL canônica, Open Graph e Twitter.
 *
 * Existe porque o Next.js mescla `metadata` campo a campo: uma página que define só `title` herda o
 * `openGraph` inteiro do layout (o link compartilhado mostraria o título da home), e uma que define
 * `openGraph` próprio substitui o objeto inteiro, inclusive a imagem gerada pelo arquivo
 * opengraph-image.js. Por isso a página usa `generateMetadata(props, parent)` e passa o `parent`
 * resolvido: as imagens dele (com o hash que invalida o cache das redes sociais) são copiadas.
 * A URL canônica fica aqui, e não no layout raiz, que a passaria para todas as rotas.
 *
 * @param {{ title: string, description: string, path: string, absolute?: boolean }} page
 *   `absolute`: usa o título como está, sem o sufixo " | SpendSmart" do template do layout.
 * @param {import('next').ResolvedMetadata} [parent] metadata já resolvido do segmento pai
 * @returns {import('next').Metadata}
 */
export function pageMetadata({ title, description, path, absolute = false }, parent) {
  const fullTitle = absolute ? title : `${title} | ${siteConfig.name}`
  const ogImages = parent?.openGraph?.images ?? []
  const twitterImages = parent?.twitter?.images ?? []

  return {
    title: absolute ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: { ...baseOpenGraph, title: fullTitle, description, url: path, images: ogImages },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: twitterImages }
  }
}
