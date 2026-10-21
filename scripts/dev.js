#!/usr/bin/env node
/**
 * Script de desenvolvimento robusto para SpendSmart
 *
 * Fluxo:
 * 1. Sobe a infraestrutura (supabase start)
 * 2. Aguarda health check do Supabase API (porta 54321)
 * 3. Só então inicia next dev
 * 4. Se qualquer etapa falhar, encerra tudo com código de erro
 */

const { spawn } = require("child_process")
const http = require("http")

const SUPABASE_API_URL = "http://127.0.0.1:54321"
const HEALTH_ENDPOINT = "/health"
const MAX_RETRIES = 60 // 60 tentativas
const RETRY_INTERVAL_MS = 1000 // 1 segundo entre tentativas
const STARTUP_TIMEOUT_MS = 120000 // 2 minutos timeout total

let infraProcess = null
let nextProcess = null
let isShuttingDown = false

function log(prefix, message) {
  const timestamp = new Date().toISOString().split("T")[1].split(".")[0]
  console.log(`[${timestamp}] [${prefix}] ${message}`)
}

function checkSupabaseHealth() {
  return new Promise((resolve, reject) => {
    const req = http.get(`${SUPABASE_API_URL}${HEALTH_ENDPOINT}`, res => {
      if (res.statusCode === 200) {
        let data = ""
        res.on("data", chunk => (data += chunk))
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data)
            // Supabase health retorna { status: "ok" } ou similar
            if (parsed.status === "ok" || parsed.status === "healthy") {
              resolve(true)
            } else {
              resolve(false)
            }
          } catch {
            // Se não for JSON, assumimos que está up se HTTP 200
            resolve(true)
          }
        })
      } else {
        resolve(false)
      }
    })

    req.on("error", () => resolve(false))
    req.setTimeout(2000, () => {
      req.destroy()
      resolve(false)
    })
  })
}

async function waitForSupabase() {
  log("DEV", `Aguardando Supabase ficar saudável em ${SUPABASE_API_URL}${HEALTH_ENDPOINT}...`)

  const startTime = Date.now()

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    if (isShuttingDown) {
      throw new Error("Encerramento solicitado durante health check")
    }

    const elapsed = Date.now() - startTime
    if (elapsed > STARTUP_TIMEOUT_MS) {
      throw new Error(`Timeout: Supabase não ficou saudável após ${STARTUP_TIMEOUT_MS / 1000}s`)
    }

    const healthy = await checkSupabaseHealth()

    if (healthy) {
      log("DEV", `✅ Supabase saudável após ${attempt} tentativa(s) (${elapsed}ms)`)
      return true
    }

    if (attempt % 10 === 0) {
      log("DEV", `⏳ Aguardando Supabase... (tentativa ${attempt}/${MAX_RETRIES}, ${elapsed}ms)`)
    }

    await new Promise(r => setTimeout(r, RETRY_INTERVAL_MS))
  }

  throw new Error(`Supabase não respondeu como saudável após ${MAX_RETRIES} tentativas`)
}

function startInfra() {
  log("DEV", "Iniciando infraestrutura (supabase start)...")
  infraProcess = spawn("npm", ["run", "infra:up"], {
    stdio: "inherit",
    shell: true
  })

  return new Promise((resolve, reject) => {
    infraProcess.on("error", reject)
    infraProcess.on("close", code => {
      if (code === 0) {
        log("DEV", "Infraestrutura iniciada com sucesso")
        resolve()
      } else {
        reject(new Error(`supabase start falhou com código ${code}`))
      }
    })
  })
}

function startNext() {
  log("DEV", "Iniciando Next.js (next dev)...")
  nextProcess = spawn("npm", ["run", "next:dev"], {
    stdio: "inherit",
    shell: true
  })

  return new Promise((resolve, reject) => {
    nextProcess.on("error", reject)
    nextProcess.on("close", code => {
      if (code === 0) resolve()
      else reject(new Error(`next dev falhou com código ${code}`))
    })
  })
}

function killProcess(proc, name) {
  if (proc && !proc.killed) {
    log("DEV", `Encerrando ${name}...`)
    proc.kill("SIGTERM")
    // Force kill após 5s
    setTimeout(() => {
      if (!proc.killed) {
        proc.kill("SIGKILL")
      }
    }, 5000)
  }
}

async function shutdown() {
  if (isShuttingDown) return
  isShuttingDown = true

  log("DEV", "Encerrando processos...")

  killProcess(nextProcess, "Next.js")
  killProcess(infraProcess, "Infraestrutura (Supabase)")

  // Aguarda um pouco para processos terminarem
  await new Promise(r => setTimeout(r, 2000))

  process.exit(0)
}

// Handlers de sinal
process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)
process.on("uncaughtException", err => {
  log("DEV", `Erro não capturado: ${err.message}`)
  shutdown()
})
process.on("unhandledRejection", reason => {
  log("DEV", `Promise rejeitada não tratada: ${reason}`)
  shutdown()
})

async function main() {
  log("DEV", "=== Iniciando ambiente de desenvolvimento SpendSmart ===")

  try {
    // 1. Sobe infraestrutura
    await startInfra()

    // 2. Aguarda health check
    await waitForSupabase()

    // 3. Inicia Next.js (não aguarda - roda em foreground)
    await startNext()
  } catch (err) {
    log("DEV", `❌ Falha: ${err.message}`)
    await shutdown()
    process.exit(1)
  }
}

main()
