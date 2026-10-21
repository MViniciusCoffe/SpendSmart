#!/usr/bin/env node
/**
 * Script de desenvolvimento robusto para SpendSmart
 *
 * Fluxo (baseado na documentação oficial do Supabase):
 * 1. Verifica se Supabase JÁ está saudável via `supabase status`
 * 2. Se NÃO: sobe infraestrutura (supabase start) + aguarda containers healthy
 * 3. Se JÁ: pula 'supabase start' e vai direto pro Next.js
 * 4. Inicia next dev
 * 5. Se qualquer etapa falhar, encerra tudo com código de erro
 *
 * Baseado na documentação oficial:
 * - supabase status: verifica saúde dos containers via Docker API
 * - supabase start: sobe containers e espera Docker healthchecks passarem
 * - Kong (porta 54321) NÃO expõe /health público - health é via Docker API
 */

const { spawn, execSync } = require("child_process")

const MAX_RETRIES = 180 // 180 tentativas (3 minutos)
const RETRY_INTERVAL_MS = 1000 // 1 segundo entre tentativas
const STARTUP_TIMEOUT_MS = 180000 // 3 minutos timeout total

let infraProcess = null
let nextProcess = null
let isShuttingDown = false

function log(prefix, message) {
  const timestamp = new Date().toISOString().split("T")[1].split(".")[0]
  console.log(`[${timestamp}] [${prefix}] ${message}`)
}

// Executa comando e retorna stdout como string (ou null se falhar)
function runCommand(cmd, args, options = {}) {
  try {
    const output = execSync(`${cmd} ${args.join(" ")}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 10000,
      ...options
    })
    return output.trim()
  } catch (err) {
    return null
  }
}

// Verifica se Docker está acessível
function checkDockerAccess() {
  const output = runCommand("docker", ["version", "--format", "json"])
  return output !== null
}

// Verifica saúde do Supabase via `supabase status` (síncrono)
function checkSupabaseStatus() {
  log("DEV", "🔍 Verificando saúde do Supabase via 'supabase status'...")

  const output = runCommand("supabase", ["status", "--output", "json"])
  if (!output) {
    log("DEV", "⚠️ 'supabase status' falhou ou não está instalado")
    return false
  }

  try {
    const status = JSON.parse(output)
    const services = Array.isArray(status) ? status : status.services || []

    log("DEV", `📋 Serviços encontrados: ${services.length}`)

    // Array vazio = nenhum container rodando = não healthy
    if (services.length === 0) {
      log("DEV", "⚠️ Nenhum serviço Supabase encontrado (containers não estão rodando)")
      return false
    }

    const allHealthy = services.every(s => {
      const healthy = s.status === "healthy" || s.status === "running"
      log("DEV", `  ${s.name}: ${s.status} ${healthy ? "✅" : "❌"}`)
      return healthy
    })

    if (allHealthy) {
      log("DEV", "✅ Todos os serviços Supabase estão healthy")
      return true
    } else {
      log("DEV", "⚠️ Alguns serviços não estão healthy")
      return false
    }
  } catch (err) {
    log("DEV", `⚠️ Erro parseando 'supabase status': ${err.message}`)
    return false
  }
}

// Fallback: verifica containers via docker ps (se supabase status falhar)
function checkDockerHealth() {
  log("DEV", "🔍 Verificando containers Docker...")

  const output = runCommand("docker", [
    "ps",
    "--filter",
    "label=io.supabase.project=spendsmart",
    "--format",
    "json"
  ])
  if (!output) {
    const allOutput = runCommand("docker", ["ps", "--filter", "name=supabase", "--format", "json"])
    if (!allOutput) return false
    return checkDockerOutput(allOutput)
  }
  return checkDockerOutput(output)
}

function checkDockerOutput(output) {
  try {
    const lines = output
      .trim()
      .split("\n")
      .filter(l => l)
    const containers = lines.map(l => JSON.parse(l))

    log("DEV", `📋 Containers Supabase encontrados: ${containers.length}`)

    const allHealthy = containers.every(c => {
      const healthy = c.State === "running" && (c.Health === "healthy" || c.Health === undefined)
      log(
        "DEV",
        `  ${c.Names}: ${c.State} ${c.Health || "no-healthcheck"} ${healthy ? "✅" : "❌"}`
      )
      return healthy
    })

    if (allHealthy) {
      log("DEV", "✅ Todos os containers Supabase estão healthy")
      return true
    }
    return false
  } catch (err) {
    log("DEV", `⚠️ Erro parseando docker ps: ${err.message}`)
    return false
  }
}

// Health check combinado: tenta supabase status, cai para docker ps
async function performHealthCheck() {
  log("DEV", "🔍 Verificando saúde do Supabase...")

  // 1. Tenta supabase status (oficial)
  if (checkSupabaseStatus()) return true

  // 2. Fallback: docker ps
  log("DEV", "🔄 Tentando fallback via docker ps...")
  if (checkDockerHealth()) return true

  log("DEV", "❌ Supabase não está healthy")
  return false
}

// Aguarda Supabase ficar healthy
async function waitForSupabase() {
  log("DEV", "⏳ Aguardando Supabase ficar healthy...")

  const startTime = Date.now()

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    if (isShuttingDown) {
      throw new Error("Encerramento solicitado durante health check")
    }

    const elapsed = Date.now() - startTime
    if (elapsed > STARTUP_TIMEOUT_MS) {
      throw new Error(`Timeout: Supabase não ficou healthy após ${STARTUP_TIMEOUT_MS / 1000}s`)
    }

    const healthy = await performHealthCheck()

    if (healthy) {
      log("DEV", `✅ Supabase healthy após ${attempt} tentativa(s) (${Date.now() - startTime}ms)`)
      return true
    }

    if (attempt % 10 === 0) {
      log(
        "DEV",
        `⏳ Aguardando Supabase... (tentativa ${attempt}/${MAX_RETRIES}, ${Date.now() - startTime}ms)`
      )
    }

    await new Promise(r => setTimeout(r, RETRY_INTERVAL_MS))
  }

  throw new Error(
    `Supabase não ficou healthy após ${MAX_RETRIES} tentativas (${STARTUP_TIMEOUT_MS / 1000}s)`
  )
}

// Sobe infraestrutura
function startInfra() {
  log("DEV", "🚀 Iniciando infraestrutura (supabase start)...")

  if (!checkDockerAccess()) {
    throw new Error(
      "❌ Docker não acessível.\n" +
        "   Execute: sudo usermod -aG docker $USER && newgrp docker\n" +
        "   Ou reinicie o terminal/sessão."
    )
  }

  log("DEV", "🚀 Iniciando infraestrutura (supabase start)...")
  infraProcess = spawn("npm", ["run", "infra:up"], {
    stdio: "inherit",
    shell: true
  })

  return new Promise((resolve, reject) => {
    infraProcess.on("error", reject)
    infraProcess.on("close", code => {
      if (code === 0) {
        log("DEV", "✅ Infraestrutura iniciada com sucesso")
        resolve()
      } else {
        reject(new Error(`supabase start falhou com código ${code}`))
      }
    })
  })
}

function startNext() {
  log("DEV", "🚀 Iniciando Next.js (next dev)...")
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
    log("DEV", `🛑 Encerrando ${name}...`)
    proc.kill("SIGTERM")
    setTimeout(() => {
      if (!proc.killed) proc.kill("SIGKILL")
    }, 5000)
  }
}

async function shutdown() {
  if (isShuttingDown) return
  isShuttingDown = true

  log("DEV", "🛑 Encerrando processos...")
  killProcess(nextProcess, "Next.js")
  killProcess(infraProcess, "Infraestrutura (Supabase)")
  await new Promise(r => setTimeout(r, 2000))
  process.exit(0)
}

// Handlers de sinal
process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)
process.on("uncaughtException", err => {
  log("DEV", `💥 Erro não capturado: ${err.message}`)
  shutdown()
})
process.on("unhandledRejection", reason => {
  log("DEV", `💥 Promise rejeitada: ${reason}`)
  shutdown()
})

// Main
async function main() {
  log("DEV", "=== Iniciando ambiente de desenvolvimento SpendSmart ===")

  try {
    // 1. Verifica se Supabase JÁ está healthy
    log("DEV", "🔍 Verificando se Supabase já está rodando...")
    const alreadyHealthy = await performHealthCheck()

    if (alreadyHealthy) {
      log("DEV", "✅ Supabase já está healthy — pulando 'supabase start'")
    } else {
      // 1. Sobe infraestrutura apenas se necessário
      log("DEV", "⚠️ Supabase não detectado — iniciando infraestrutura...")
      await startInfra()

      // Aguarda health check
      await waitForSupabase()
    }

    // 2. Inicia Next.js
    await startNext()
  } catch (err) {
    log("DEV", `❌ Falha: ${err.message}`)
    await shutdown()
    process.exit(1)
  }
}

main()
