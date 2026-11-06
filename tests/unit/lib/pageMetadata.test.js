import { pageMetadata, OG_IMAGE } from "@/lib/config/pageMetadata"

describe("pageMetadata", () => {
  const sobre = pageMetadata({ title: "Sobre", description: "Conheça o projeto", path: "/about" })

  it("usa o título simples no <title>, para o template do layout acrescentar o sufixo", () => {
    expect(sobre.title).toBe("Sobre")
  })

  it("monta o Open Graph da própria página, sem herdar o título da home", () => {
    expect(sobre.openGraph).toEqual(
      expect.objectContaining({
        title: "Sobre | SpendSmart",
        description: "Conheça o projeto",
        url: "/about",
        locale: "pt_BR",
        siteName: "SpendSmart"
      })
    )
  })

  it("mantém a imagem compartilhada no Open Graph e no Twitter", () => {
    expect(sobre.openGraph.images).toEqual([OG_IMAGE])
    expect(sobre.twitter).toEqual({
      card: "summary_large_image",
      title: "Sobre | SpendSmart",
      description: "Conheça o projeto",
      images: [OG_IMAGE.url]
    })
  })

  it("define a URL canônica da página", () => {
    expect(sobre.alternates).toEqual({ canonical: "/about" })
  })

  it("com absolute, usa o título como está e escapa do template", () => {
    const home = pageMetadata({
      title: "SpendSmart — Início",
      description: "d",
      path: "/",
      absolute: true
    })

    expect(home.title).toEqual({ absolute: "SpendSmart — Início" })
    expect(home.openGraph.title).toBe("SpendSmart — Início")
  })
})
