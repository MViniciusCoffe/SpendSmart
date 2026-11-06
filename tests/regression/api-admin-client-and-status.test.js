// Regressão de dois defeitos das rotas de src/app/api/ (AGENTS.md §14.3, sem issue própria):
//
// 1. createProfile, deleteAccount e status criavam o cliente admin no carregamento do módulo. Sem
//    SUPABASE_SERVICE_ROLE_KEY o import lançava "supabaseKey is required", e o `next build` falhava
//    (Preview, 2026-11-04).
// 2. /api/status buscava `${NEXT_PUBLIC_APP_URL}/api/health`, variável que não existe: o fetch com
//    URL relativa lançava no servidor e o "API Gateway" aparecia sempre "degraded" em produção, e
//    "operational" em desenvolvimento, escondendo a falha. A checagem de CDN também devolvia
//    "operational" quando a requisição falhava.
// 3. /api/status, rota pública sem login, checava o banco, o Auth, o Realtime e o Storage com o
//    cliente admin (service_role, ignora RLS). Agora usa só a chave pública: RPC health_check() para
//    o banco e /auth/v1/health para o Auth; Realtime e Storage saíram (o app não usa). O ?fail= fica
//    desligado em Produção.

const ROUTES = ["createProfile", "deleteAccount", "status"]
const ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NODE_ENV",
  "VERCEL_ENV"
]
const SUPABASE_URL = "http://127.0.0.1:54321"
const PUBLISHABLE_KEY = "sb_publishable_teste"
const savedEnv = Object.fromEntries(ENV_KEYS.map(k => [k, process.env[k]]))

const loadRoute = name => {
  let mod
  jest.isolateModules(() => {
    mod = require(`@/app/api/${name}/route`)
  })
  return mod
}

beforeEach(() => {
  // Ambiente de build sem a chave de serviço
  process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = PUBLISHABLE_KEY
  delete process.env.SUPABASE_SERVICE_ROLE_KEY
  delete process.env.VERCEL_ENV
})

afterEach(() => {
  for (const [key, value] of Object.entries(savedEnv)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
  jest.restoreAllMocks()
})

describe("Regressão — cliente admin criado na requisição, não no import", () => {
  it.each(ROUTES)("a rota %s carrega sem SUPABASE_SERVICE_ROLE_KEY", name => {
    expect(() => loadRoute(name)).not.toThrow()
  })

  it.each([
    ["createProfile", "POST"],
    ["deleteAccount", "DELETE"]
  ])("%s responde 503 quando o servidor está sem a chave", async (name, method) => {
    const handler = loadRoute(name)[method]
    const request = new Request("https://app.test/api/x", {
      method,
      headers: { authorization: "Bearer token-qualquer" },
      body: method === "POST" ? JSON.stringify({ full_name: "X" }) : undefined
    })

    const response = await handler(request)

    expect(response.status).toBe(503)
  })
})

describe("Regressão — /api/status", () => {
  const statusOf = (body, id) => body.services.find(s => s.id === id).status

  const callStatus = async ({
    query = "",
    healthFails = false,
    cdnFails = false,
    dbResult = "true",
    authOk = true
  } = {}) => {
    const fetchSpy = jest.spyOn(global, "fetch").mockImplementation(async url => {
      const href = String(url)
      if (href.endsWith("/api/health")) {
        if (healthFails) throw new TypeError("fetch failed")
        return new Response("{}", { status: 200 })
      }
      if (href.includes("/rest/v1/rpc/health_check")) {
        return new Response(dbResult, {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      }
      if (href.includes("/rest/v1/incidents")) {
        return new Response(JSON.stringify({ code: "42P01", message: "relation does not exist" }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        })
      }
      if (href.endsWith("/auth/v1/health")) {
        return new Response("{}", { status: authOk ? 200 : 503 })
      }
      if (cdnFails) throw new TypeError("fetch failed")
      return new Response(null, { status: 200 })
    })
    const { GET } = loadRoute("status")
    const response = await GET(new Request(`https://app.test/api/status${query}`))
    return { body: await response.json(), fetchSpy }
  }

  const requestedUrls = fetchSpy => fetchSpy.mock.calls.map(([url]) => String(url))

  it("verifica o API Gateway pela URL absoluta da própria requisição", async () => {
    const { body, fetchSpy } = await callStatus()

    expect(requestedUrls(fetchSpy)).toContain("https://app.test/api/health")
    expect(statusOf(body, "api")).toBe("operational")
  })

  it("marca o API Gateway como degraded quando o health falha, também em desenvolvimento", async () => {
    process.env.NODE_ENV = "development"

    const { body } = await callStatus({ healthFails: true })

    expect(statusOf(body, "api")).toBe("degraded")
  })

  it("não marca a CDN como operational quando a requisição falha", async () => {
    const { body } = await callStatus({ cdnFails: true })

    expect(statusOf(body, "cdn")).toBe("degraded")
  })

  it("nunca envia a chave de serviço, mesmo com ela configurada no servidor", async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "sb_secret_nao_pode_sair"

    const { body, fetchSpy } = await callStatus()

    const headerValues = fetchSpy.mock.calls.flatMap(([, init]) => [
      ...new Headers(init?.headers).values()
    ])
    expect(headerValues.join(" ")).not.toContain("sb_secret_nao_pode_sair")
    expect(headerValues).toContain(PUBLISHABLE_KEY)
    expect(statusOf(body, "database")).toBe("operational")
    expect(statusOf(body, "auth")).toBe("operational")
  })

  it("checa o banco pela RPC health_check e o Auth pelo endpoint público", async () => {
    const { fetchSpy } = await callStatus()

    const urls = requestedUrls(fetchSpy)
    expect(urls).toContain(`${SUPABASE_URL}/rest/v1/rpc/health_check`)
    expect(urls).toContain(`${SUPABASE_URL}/auth/v1/health`)
    expect(urls.some(u => u.includes("/rest/v1/profiles"))).toBe(false)
    expect(urls.some(u => u.includes("/auth/v1/admin"))).toBe(false)
  })

  it.each([
    ["a RPC devolve false (schema ausente)", { dbResult: "false" }, "database", "critical"],
    ["o Auth responde erro", { authOk: false }, "auth", "degraded"]
  ])("marca o serviço quando %s", async (_caso, options, id, esperado) => {
    const { body } = await callStatus(options)

    expect(statusOf(body, id)).toBe(esperado)
  })

  it("sem a configuração pública, marca banco e Auth como critical", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

    const { body } = await callStatus()

    expect(statusOf(body, "database")).toBe("critical")
    expect(statusOf(body, "auth")).toBe("critical")
  })

  it("lista só os serviços que o app usa (sem Realtime e Storage)", async () => {
    const { body } = await callStatus()

    expect(body.services.map(s => s.id)).toEqual(["database", "auth", "api", "cdn"])
  })

  it.each([
    [undefined, "critical"],
    ["preview", "critical"],
    ["production", "operational"]
  ])("com VERCEL_ENV=%s, ?fail=db deixa o banco %s", async (vercelEnv, esperado) => {
    if (vercelEnv) process.env.VERCEL_ENV = vercelEnv

    const { body } = await callStatus({ query: "?fail=db" })

    expect(statusOf(body, "database")).toBe(esperado)
  })

  it("usa os nomes em português de serviceMetadata", async () => {
    const { body } = await callStatus()

    expect(body.services.find(s => s.id === "database").name).toBe("Banco de Dados PostgreSQL")
    expect(body.page.url).toBe("https://app.test/status")
  })
})
