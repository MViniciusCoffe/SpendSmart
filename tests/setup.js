const path = require("path")
require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") })

const requiredEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY"
]
const missing = requiredEnv.filter(key => !process.env[key])
if (missing.length > 0) {
  console.warn(`[setup] Variáveis de ambiente do Supabase não configuradas: ${missing.join(", ")}`)
  console.warn("[setup] Testes de integração precisam: supabase start e .env.local")
  console.warn("[setup] Testes unitários continuarão (usam mocks)")
}
