// Ambiente dos testes E2E: lê o .env.local (o mesmo que o Next.js usa) e recusa qualquer Supabase
// que não seja o local. Os testes criam e apagam usuários com a chave secreta.
const crypto = require("crypto")
const path = require("path")
const { createClient } = require("@supabase/supabase-js")

require("dotenv").config({ path: path.resolve(__dirname, "../../../.env.local"), quiet: true })

const LOCAL_HOSTS = ["127.0.0.1", "localhost"]

function assertLocalSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase local não configurado (.env.local). Rode: supabase start")
  }
  const { hostname } = new URL(url)
  if (!LOCAL_HOSTS.includes(hostname)) {
    throw new Error(`NEXT_PUBLIC_SUPABASE_URL não é local (${hostname}): E2E só roda no local.`)
  }
}

function adminClient() {
  assertLocalSupabase()
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  })
}

// Um prefixo por execução: os usuários de uma rodada não colidem com os de outra. crypto em vez de
// Math.random(): o id entra no e-mail que vai junto da senha, e o CodeQL (js/insecure-randomness)
// trata isso como contexto de segurança
const RUN_ID = `${Date.now().toString(36)}${crypto.randomBytes(2).toString("hex")}`
const emailFor = label => `e2e-${RUN_ID}-${label}@test.local`

async function findUsersByEmail(admin, email) {
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (error) throw error
  return data.users.filter(u => u.email === email)
}

// Remove todos os usuários desta execução; as FKs ON DELETE CASCADE apagam perfil e dados
async function deleteRunUsers(admin) {
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (error) throw error
  const mine = data.users.filter(u => u.email?.startsWith(`e2e-${RUN_ID}-`))
  for (const user of mine) await admin.auth.admin.deleteUser(user.id)
  return mine.length
}

// Conta pronta (Auth + perfil) criada pela API admin, sem passar pela tela: dá a cada teste os
// próprios dados, para ele rodar sozinho (sem depender de outro teste ter cadastrado antes)
async function createAccount(admin, { email, password, name = "Pessoa E2E" }) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })
  if (error) throw error
  const { error: perfilError } = await admin
    .from("profiles")
    .insert({ id: data.user.id, full_name: name })
  if (perfilError) throw perfilError
  return data.user
}

module.exports = { adminClient, emailFor, findUsersByEmail, deleteRunUsers, createAccount, RUN_ID }
