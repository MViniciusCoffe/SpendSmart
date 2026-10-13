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
