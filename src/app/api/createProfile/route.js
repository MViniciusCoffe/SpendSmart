import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  const token = request.headers.get("authorization")?.split(" ")[1]
  if (!token) return Response.json({ message: "Não autorizado" }, { status: 401 })

  const { full_name, birth_date, phone } = await request.json()

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
    return Response.json({ message: "Erro ao criar perfil", error: error.message }, { status: 500 })
  }
}

export function GET() {
  return Response.json({ message: "Método não permitido" }, { status: 405 })
}
