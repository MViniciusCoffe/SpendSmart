import { createClient } from "@supabase/supabase-js"
import { adminUnavailableResponse, getSupabaseAdmin } from "../_lib/supabaseAdmin"

// O cliente só recebe mensagens nossas; o erro do Auth fica no log do servidor
const FALHA = { message: "Erro ao deletar conta" }

export async function DELETE(request) {
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

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    if (deleteError) throw deleteError

    return Response.json({ message: "Conta deletada com sucesso" })
  } catch (error) {
    console.error("[Delete Account API Error]", error)
    return Response.json(FALHA, { status: 500 })
  }
}

export function GET() {
  return Response.json({ message: "Método não permitido" }, { status: 405 })
}
