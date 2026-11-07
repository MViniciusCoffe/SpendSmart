import { siteConfig } from "@/lib/config/siteConfig"

// As rotas privadas não entram no disallow de propósito: o buscador precisa visitá-las para ler o
// noindex (X-Robots-Tag e meta robots). Bloqueadas aqui, a URL ainda poderia ser indexada por links
// externos, sem conteúdo.
/** @returns {import('next').MetadataRoute.Robots} */
export default function robots() {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${siteConfig.url}/sitemap.xml`
  }
}
