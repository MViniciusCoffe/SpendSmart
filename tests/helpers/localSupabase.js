// As suítes de tests/integration/supabase/ criam e apagam usuários com a chave secreta: só podem
// rodar contra o Supabase CLI local. O tests/setup.js lê o .env.local, mas uma variável já exportada
// no shell tem precedência sobre ele, então a URL é conferida aqui, antes de qualquer conexão.
const LOCAL_HOSTS = ["127.0.0.1", "localhost"]

export function assertLocalSupabase() {
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_SERVICE_ROLE_KEY"
  ]
  const missing = required.filter(name => !process.env[name])
  if (missing.length > 0) {
    throw new Error(
      `Variáveis de ambiente do Supabase não configuradas: ${missing.join(", ")}. Execute: supabase start`
    )
  }

  const { hostname } = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
  if (!LOCAL_HOSTS.includes(hostname)) {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL não é local (${hostname}). ` +
        "Os testes com Supabase só rodam contra o Supabase CLI local (supabase start)."
    )
  }
}
