import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageResponse } from "next/og"
import { siteConfig } from "./siteConfig"
import { formatCurrency } from "@/lib/utils/format"

/**
 * Imagem de compartilhamento (Open Graph e Twitter) gerada por código, a partir da identidade do
 * app: logo, nome, slogan e os três totais do dashboard. O Next.js a gera no build e insere as tags
 * og:image e twitter:image sozinho (src/app/opengraph-image.js e twitter-image.js).
 *
 * O ImageResponse (Satori) aceita só flexbox e um subconjunto de CSS, por isso o layout usa estilo
 * inline aqui. A fonte é a Geist Regular que vem com o next/og: o Satori não simula negrito, então
 * a hierarquia vem de tamanho e cor.
 */

export const SHARE_IMAGE_SIZE = { width: 1200, height: 630 }
export const SHARE_IMAGE_ALT =
  "SpendSmart: logo, nome e slogan, com exemplos de receitas, despesas e saldo como no dashboard"

// Mesmas cores de src/styles/design-tokens.css
const COLORS = {
  bg: "#04090b",
  card: "#0b1115",
  border: "#1c272e",
  text: "#f0f6fc",
  muted: "#94a3b8",
  income: "#00d4aa",
  expense: "#ef4444"
}

// Valores ilustrativos: a imagem é pública e não mostra dado de ninguém
const TOTALS = [
  { label: "Receitas", value: 3000, color: COLORS.income },
  { label: "Despesas", value: 1240, color: COLORS.expense },
  { label: "Saldo", value: 1760, color: COLORS.text }
]

export async function renderShareImage() {
  const logo = await readFile(join(process.cwd(), "public/images/logo.svg"), "base64")

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 72px",
        backgroundColor: COLORS.bg,
        backgroundImage: `radial-gradient(circle at 85% 0%, rgba(0, 212, 170, 0.18), transparent 55%)`,
        color: COLORS.text
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        {/* O ImageResponse não aceita next/image; o <img> com data URI é o caminho documentado */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`data:image/svg+xml;base64,${logo}`} width={150} height={90} alt="" />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, letterSpacing: -2 }}>{siteConfig.name}</div>
          <div style={{ fontSize: 32, color: COLORS.muted }}>{siteConfig.tagline}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 24 }}>
        {TOTALS.map(total => (
          <div
            key={total.label}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              padding: "28px 32px",
              backgroundColor: COLORS.card,
              border: `2px solid ${COLORS.border}`,
              borderTop: `6px solid ${total.color}`,
              borderRadius: 20
            }}
          >
            <div style={{ fontSize: 26, color: COLORS.muted }}>{total.label}</div>
            <div style={{ fontSize: 44, color: total.color }}>{formatCurrency(total.value)}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 24,
          color: COLORS.muted
        }}
      >
        <div>Controle financeiro pessoal · Open source · BSI UFRN</div>
        <div style={{ color: COLORS.income }}>{new URL(siteConfig.url).host}</div>
      </div>
    </div>,
    SHARE_IMAGE_SIZE
  )
}
