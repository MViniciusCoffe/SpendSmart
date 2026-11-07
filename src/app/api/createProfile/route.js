import { createClient } from "@supabase/supabase-js"
import { adminUnavailableResponse, getSupabaseAdmin } from "../_lib/supabaseAdmin"

// O cliente só recebe mensagens nossas. A mensagem do Postgres ou do Auth (nome de constraint,
// detalhe de coluna) fica no log do servidor, nunca na resposta.
const FALHA = { message: "Erro ao criar perfil" }

export async function POST(request) {
  const token = request.headers.get("authorization")?.split(" ")[1]
  if (!token) return Response.json({ message: "Não autorizado" }, { status: 401 })

  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return adminUnavailableResponse()

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    )
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return Response.json({ message: "Usuário inválido ou token expirado" }, { status: 401 })
    }

    // Antes ficava fora do try: corpo que não era JSON virava erro não tratado
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== "object") {
      return Response.json({ message: "Corpo da requisição inválido" }, { status: 400 })
    }
    const { full_name, birth_date, phone } = body

    const { error: insertError } = await supabaseAdmin
      .from("profiles")
      .insert([{ id: user.id, full_name, birth_date, phone }])

    if (insertError) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(user.id)
      } catch (deleteError) {
        console.error("[Create Profile API - Rollback Error]", deleteError)
      }
      throw insertError
    }

    return Response.json({ message: "Perfil criado com sucesso" })
  } catch (error) {
    console.error("[Create Profile API Error]", error)
    return Response.json(FALHA, { status: 500 })
  }
}

export function GET() {
  return Response.json({ message: "Método não permitido" }, { status: 405 })
}
