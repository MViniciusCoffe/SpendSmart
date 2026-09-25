import { createClient } from '@supabase/supabase-js';

// Usamos a chave SERVICE_ROLE (Admin) para ignorar o RLS e forçar a inserção
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const { id, nome_completo, data_nascimento, telefone } = req.body;

  try {
    const { error } = await supabaseAdmin.from('profiles').insert([
      { id, nome_completo, data_nascimento, telefone }
    ]);

    if (error) throw error;

    return res.status(200).json({ message: 'Perfil criado com sucesso' });
  } catch (error) {
    console.error("[Create Profile API Error]", error);
    return res.status(500).json({ message: 'Erro ao criar perfil', error: error.message });
  }
}