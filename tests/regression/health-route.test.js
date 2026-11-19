// /health — checagem de prontidão, alvo do smoke test pós-deploy (T4/P5, tacianosilva/bsi-tasks#604).
//
// Existe porque nenhuma rota antiga servia de alvo: o /api/health não toca no banco, e o /api/status
// responde 200 mesmo com o banco fora (#103), com cache de 30 s na CDN. Aqui o código HTTP é o
// resultado: 200 só com banco e Auth respondendo, 503 em qualquer falha, sem cache.

const { CHECK_TIMEOUT_MS } = require("@/lib/health/checks")

const ENV_KEYS = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"]
const SUPABASE_URL = "http://127.0.0.1:54321"
const PUBLISHABLE_KEY = "sb_publishable_teste"
const savedEnv = Object.fromEntries(ENV_KEYS.map(k => [k, process.env[k]]))

const loadRoute = () => {
  let mod
  jest.isolateModules(() => {
    mod = require("@/app/health/route")
  })
  return mod
}

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })

// db: "ok" | "false" (RPC responde, mas não true) | "error" (erro do PostgREST) | "throw" | "hang"
// auth: "ok" | "503" | "throw"
const mockSupabase = ({ db = "ok", auth = "ok" } = {}) =>
  jest.spyOn(global, "fetch").mockImplementation(async url => {
    const href = String(url)
    if (href.includes("/rest/v1/rpc/health_check")) {
      if (db === "throw") throw new TypeError("fetch failed")
      if (db === "hang") return new Promise(() => {})
      if (db === "error") {
        return json({ code: "PGRST202", message: "Could not find the function health_check" }, 404)
      }
      return json(db === "false" ? false : true)
    }
    if (href.endsWith("/auth/v1/health")) {
      if (auth === "throw") throw new TypeError("fetch failed")
      return json({}, auth === "503" ? 503 : 200)
    }
    throw new Error(`requisição inesperada: ${href}`)
  })

const callHealth = async () => {
  const { GET } = loadRoute()
  const response = await GET(new Request("https://app.test/health"))
  return { response, body: await response.json() }
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = PUBLISHABLE_KEY
})

afterEach(() => {
  for (const [key, value] of Object.entries(savedEnv)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
  jest.useRealTimers()
  jest.restoreAllMocks()
})

describe("/health — prontidão", () => {
  it("responde 200 quando o banco e o Auth respondem", async () => {
    mockSupabase()

    const { response, body } = await callHealth()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({ status: "ok", checks: { database: "ok", auth: "ok" } })
    expect(body.version).toEqual(expect.any(String))
    expect(new Date(body.timestamp).toString()).not.toBe("Invalid Date")
  })

  it.each([
    ["a RPC não devolve true", "false"],
    ["o PostgREST devolve erro", "error"],
    ["a requisição ao banco falha", "throw"]
  ])("responde 503 quando %s", async (_caso, db) => {
    mockSupabase({ db })

    const { response, body } = await callHealth()

    expect(response.status).toBe(503)
    expect(body).toMatchObject({ status: "error", checks: { database: "fail", auth: "ok" } })
  })

  it("responde 503 quando o banco não responde dentro do prazo", async () => {
    jest.useFakeTimers({ doNotFake: ["nextTick", "setImmediate", "queueMicrotask"] })
    mockSupabase({ db: "hang" })

    const pending = callHealth()
    await jest.advanceTimersByTimeAsync(CHECK_TIMEOUT_MS)
    const { response, body } = await pending

    expect(response.status).toBe(503)
    expect(body.checks).toEqual({ database: "fail", auth: "ok" })
  })

  it.each([
    ["o Auth responde com erro", "503"],
    ["a requisição ao Auth falha", "throw"]
  ])("responde 503 quando %s", async (_caso, auth) => {
    mockSupabase({ auth })

    const { response, body } = await callHealth()

    expect(response.status).toBe(503)
    expect(body.checks).toEqual({ database: "ok", auth: "fail" })
  })

  it("responde 503 sem chamar ninguém quando falta a configuração do Supabase", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    const fetchSpy = mockSupabase()

    const { response, body } = await callHealth()

    expect(response.status).toBe(503)
    expect(body.checks).toEqual({ database: "fail", auth: "fail" })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("não deixa a resposta ser guardada em cache", async () => {
    mockSupabase({ db: "throw" })

    const { response } = await callHealth()

    expect(response.headers.get("Cache-Control")).toContain("no-store")
  })

  it("não devolve mensagem de erro interna nem a chave", async () => {
    mockSupabase({ db: "error", auth: "throw" })

    const { body } = await callHealth()

    const text = JSON.stringify(body)
    expect(text).not.toContain("health_check")
    expect(text).not.toContain("fetch failed")
    expect(text).not.toContain(PUBLISHABLE_KEY)
    expect(Object.keys(body).sort()).toEqual(["checks", "status", "timestamp", "version"])
  })
})
