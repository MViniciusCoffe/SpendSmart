import { pageMetadata } from "@/lib/config/pageMetadata"

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

  it("monta o card do Twitter da própria página", () => {
    expect(sobre.twitter).toEqual(
      expect.objectContaining({
        card: "summary_large_image",
        title: "Sobre | SpendSmart",
        description: "Conheça o projeto"
      })
    )
  })

  it("copia as imagens do pai, geradas por opengraph-image.js e twitter-image.js", () => {
    // Formato do metadata resolvido que o Next.js passa em generateMetadata(props, parent)
    const parent = {
      openGraph: {
        images: [{ url: new URL("https://exemplo.dev/opengraph-image?abc"), width: 1200 }]
      },
      twitter: { images: [{ url: new URL("https://exemplo.dev/twitter-image?abc") }] }
    }

    const comPai = pageMetadata({ title: "Sobre", description: "d", path: "/about" }, parent)

    expect(comPai.openGraph.images).toBe(parent.openGraph.images)
    expect(comPai.twitter.images).toBe(parent.twitter.images)
  })

  it("sem pai, não inventa imagem", () => {
    expect(sobre.openGraph.images).toEqual([])
    expect(sobre.twitter.images).toEqual([])
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
