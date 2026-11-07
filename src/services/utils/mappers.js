// Colunas que cada mapper lê. Os services pedem exatamente estas, inclusive no retorno de insert e
// update: um .select() sem argumento devolve todas as colunas (user_id, created_at...), que o mapper
// descartaria depois (AGENTS.md §4.3, regra 10).
export const CATEGORY_COLUMNS = "id,name,type,description,color,deleted_at"
export const TRANSACTION_COLUMNS =
  "id,title,amount,type,category_id,occurred_on,description,payment_method,deleted_at"

export const categoryTypeMap = cat => ({
  id: cat.id,
  name: cat.name,
  type: cat.type,
  description: cat.description,
  color: cat.color,
  deleted_at: cat.deleted_at
})

export const transactionTypeMap = tx => ({
  id: tx.id,
  title: tx.title,
  amount: tx.amount,
  type: tx.type,
  category_id: tx.category_id,
  occurred_on: tx.occurred_on,
  description: tx.description,
  payment_method: tx.payment_method,
  deleted_at: tx.deleted_at
})

export const profileTypeMap = p => ({
  id: p.id,
  full_name: p.full_name,
  birth_date: p.birth_date,
  phone: p.phone,
  created_at: p.created_at,
  updated_at: p.updated_at,
  deleted_at: p.deleted_at
})
