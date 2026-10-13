const path = require("path")
require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") })

const requiredEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY"
]
const missing = requiredEnv.filter(key => !process.env[key])
if (missing.length > 0) {
  console.error(`Variáveis de ambiente faltando: ${missing.join(", ")}`)
  console.error("Execute: supabase start e configure .env.local")
  process.exit(1)
}
