import { siteConfig } from "@/lib/config/siteConfig"

// Só as páginas públicas e indexáveis. /status fica de fora (noindex), e as privadas exigem sessão.
const PUBLIC_ROUTES = ["", "/about", "/contact"]

/** @returns {import('next').MetadataRoute.Sitemap} */
export default function sitemap() {
  return PUBLIC_ROUTES.map(route => ({ url: `${siteConfig.url}${route}` }))
}
