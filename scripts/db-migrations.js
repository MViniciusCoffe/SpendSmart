#!/usr/bin/env node
/**
 * Aplica ou lista as migrations de supabase/migrations/ num banco que não é o Supabase CLI local.
 *
 *   node scripts/db-migrations.js <list|push> --target <production|preview|docker> [--apply]
 *
 * Por que existe: o Supabase CLI aceita --db-url, mas a URL do banco remoto contém a senha. Este
 * script lê a URL de um arquivo .env.<target>.remote (nunca versionado, e com nome que o Next.js
 * não carrega) para que ela não apareça em package.json, no histórico do shell nem em logs.
 *
 * Segurança:
 *   - --target é obrigatório: não existe alvo padrão, então nenhum comando atinge produção por esquecimento.
 *   - push é dry-run, a menos que --apply seja passado; mesmo com --apply, o CLI ainda pede Y/n.
 *   - O alvo docker usa a URL fixa do infra/compose.yaml (credenciais locais, sem segredo).
 *
 * O CLI não imprime a senha nas mensagens de erro (só host, usuário e banco), por isso a saída é repassada sem filtro.
 */

const fs = require("fs")
const path = require("path")
const { spawnSync } = require("child_process")
const dotenv = require("dotenv")

const ROOT = path.resolve(__dirname, "..")
const DOCKER_URL = "postgresql://local_user:local@127.0.0.1:5432/local_db?sslmode=disable"
const TARGETS = ["production", "preview", "docker"]
const COMMANDS = ["list", "push"]

function fail(message) {
  console.error(`[db-migrations] ${message}`)
  console.error(
    "Uso: node scripts/db-migrations.js <list|push> --target <production|preview|docker> [--apply]"
  )
  process.exit(1)
}

function parseArgs(argv) {
  const [command, ...rest] = argv
  const targetIndex = rest.indexOf("--target")
  const target = targetIndex >= 0 ? rest[targetIndex + 1] : undefined
  return { command, target, apply: rest.includes("--apply") }
}

function resolveDbUrl(target) {
  if (target === "docker") return DOCKER_URL

  const envFile = `.env.${target}.remote`
  const envPath = path.join(ROOT, envFile)
  if (!fs.existsSync(envPath)) {
    fail(`${envFile} não encontrado. Copie .env.remote.example para ${envFile} e preencha.`)
  }
  const { DATABASE_URL } = dotenv.parse(fs.readFileSync(envPath))
  if (!DATABASE_URL) fail(`DATABASE_URL vazia em ${envFile}.`)
  return DATABASE_URL
}

function describe(dbUrl) {
  const url = new URL(dbUrl)
  // O ref identifica o projeto sem expor a senha. Pooler: usuário "postgres.<ref>";
  // conexão direta: host "db.<ref>.supabase.co"
  const ref =
    url.username.split(".")[1] ?? url.hostname.match(/^db\.([^.]+)\.supabase\.co$/)?.[1] ?? "local"
  return `${url.hostname}:${url.port || 5432} (projeto: ${ref})`
}

function main() {
  const { command, target, apply } = parseArgs(process.argv.slice(2))
  if (!COMMANDS.includes(command)) fail(`Comando inválido: ${command ?? "(nenhum)"}`)
  if (!TARGETS.includes(target)) fail(`--target inválido: ${target ?? "(nenhum)"}`)

  const dbUrl = resolveDbUrl(target)
  const args =
    command === "list"
      ? ["migration", "list", "--db-url", dbUrl]
      : ["db", "push", "--db-url", dbUrl, ...(apply ? [] : ["--dry-run"])]

  console.log(`[db-migrations] ${command} → ${target}: ${describe(dbUrl)}`)
  if (command === "push" && !apply) {
    console.log("[db-migrations] dry-run: nada será gravado. Use --apply para aplicar.")
  }

  const result = spawnSync("supabase", args, { cwd: ROOT, stdio: "inherit" })
  if (result.error) fail(`Não foi possível executar o Supabase CLI: ${result.error.message}`)
  process.exit(result.status ?? 1)
}

main()
