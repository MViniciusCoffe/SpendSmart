import { createClient } from "@supabase/supabase-js"

// Usamos a chave SERVICE_ROLE (Admin) para ignorar o RLS e forçar a inserção
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "M��todo n��o permitido" })
  }

  const token = req.headers.authorization?.split(" ")[1]
  if (!token) return res.status(401).json({ message: "N��o autorizado" })

  const { nome_completo, data_nascimento, telefone } = req.body

  try {
    // 1. Descobrir quem é o dono desse token usando a chave pública
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    )
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser(token)

    if (userError || !user) throw new Error("Usu��rio inv��lido ou token expirado")

    // 2. Inserir perfil usando o id da sess��o validada
    const { error: insertError } = await supabaseAdmin
      .from("profiles")
      .insert([{ id: user.id, nome_completo, data_nascimento, telefone }])

    if (insertError) {
      // Em caso de falha ao criar perfil, reverter a conta criada no Auth
      try {
        await supabaseAdmin.auth.admin.deleteUser(user.id)
      } catch (deleteError) {
        console.error("[Create Profile API - Rollback Error]", deleteError)
      }
      throw insertError
    }

    return res.status(200).json({ message: "Perfil criado com sucesso" })
  } catch (error) {
    console.error("[Create Profile API Error]", error)
    return res.status(500).json({ message: "Erro ao criar perfil", error: error.message })
  }
}
