import { createClient } from '@supabase/supabase-js';

// Service Role Key é uma chave secreta que permite operações administrativas no Supabase, como deletar usuários.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY 
);

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Não autorizado' });

  try {
    // 1. Descobrir quem é o dono desse token usando a chave pública
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL, 
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    );
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) throw new Error('Usuário inválido ou token expirado');

    // 2. Deletar o usuário no Supabase Auth usando o Client de ADMIN
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    
    if (deleteError) throw deleteError;

    // Se o seu banco estiver com "ON DELETE CASCADE" nas chaves estrangeiras, 
    // as categorias e despesas dele sumirão sozinhas. A mágica da modelagem!

    return res.status(200).json({ message: 'Conta deletada com sucesso' });
  } catch (error) {
    console.error("[Delete Account API Error]", error);
    return res.status(500).json({ message: 'Erro ao deletar conta', error: error.message });
  }
}