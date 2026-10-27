import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function DELETE(request) {
  const token = request.headers.get("authorization")?.split(" ")[1]
  if (!token) return Response.json({ message: "Não autorizado" }, { status: 401 })

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    )
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser(token)

    if (userError || !user) throw new Error("Usuário inválido ou token expirado")

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    if (deleteError) throw deleteError

    return Response.json({ message: "Conta deletada com sucesso" })
  } catch (error) {
    console.error("[Delete Account API Error]", error)
    return Response.json(
      { message: "Erro ao deletar conta", error: error.message },
      { status: 500 }
    )
  }
}

export function GET() {
  return Response.json({ message: "Método não permitido" }, { status: 405 })
}
