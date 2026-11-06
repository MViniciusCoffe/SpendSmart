// Regressão de dois defeitos das rotas de src/app/api/ (AGENTS.md §14.3, sem issue própria):
//
// 1. createProfile, deleteAccount e status criavam o cliente admin no carregamento do módulo. Sem
//    SUPABASE_SERVICE_ROLE_KEY o import lançava "supabaseKey is required", e o `next build` falhava
//    (Preview, 2026-11-04).
// 2. /api/status buscava `${NEXT_PUBLIC_APP_URL}/api/health`, variável que não existe: o fetch com
//    URL relativa lançava no servidor e o "API Gateway" aparecia sempre "degraded" em produção, e
//    "operational" em desenvolvimento, escondendo a falha. A checagem de CDN também devolvia
//    "operational" quando a requisição falhava.

const ROUTES = ["createProfile", "deleteAccount", "status"]
const ENV_KEYS = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "NODE_ENV"]
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
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321"
  delete process.env.SUPABASE_SERVICE_ROLE_KEY
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

  const callStatus = async ({ healthOk = true, healthFails = false, cdnFails = false } = {}) => {
    const fetchSpy = jest.spyOn(global, "fetch").mockImplementation(async url => {
      const href = String(url)
      if (href.endsWith("/api/health")) {
        if (healthFails) throw new TypeError("fetch failed")
        return new Response("{}", { status: healthOk ? 200 : 500 })
      }
      if (cdnFails) throw new TypeError("fetch failed")
      return new Response(null, { status: 200 })
    })
    const { GET } = loadRoute("status")
    const response = await GET(new Request("https://app.test/api/status"))
    return { body: await response.json(), fetchSpy }
  }

  it("verifica o API Gateway pela URL absoluta da própria requisição", async () => {
    const { body, fetchSpy } = await callStatus()

    const healthUrl = fetchSpy.mock.calls
      .map(([url]) => String(url))
      .find(u => u.includes("health"))
    expect(healthUrl).toBe("https://app.test/api/health")
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

  it("sem a chave, marca como critical os serviços que dependem do cliente admin", async () => {
    const { body } = await callStatus()

    for (const id of ["database", "auth", "realtime", "storage"]) {
      expect(statusOf(body, id)).toBe("critical")
    }
  })

  it("usa os nomes em português de serviceMetadata", async () => {
    const { body } = await callStatus()

    expect(body.services.find(s => s.id === "database").name).toBe("Banco de Dados PostgreSQL")
    expect(body.page.url).toBe("https://app.test/status")
  })
})
