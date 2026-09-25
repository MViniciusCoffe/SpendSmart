import { supabase } from '../infra/supabase';

export const transactionService = {
  async getTransactions() {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('occurred_on', { ascending: false });

      if (error) {
        console.error("[Supabase Get Transactions Error]", error.message);
        throw new Error("Não foi possível carregar suas transações.");
      }

      return data.map(t => ({
        id: t.id,
        titulo: t.title,
        valor: t.amount,
        tipo: t.type === 'income' ? 'receita' : 'despesa',
        categoria_id: t.category_id,
        data_ocorrencia: t.occurred_on,
        descricao: t.description,
        metodo_pagamento: t.payment_method
      }));
    } catch (error) {
      throw error;
    }
  },

  async createTransaction({ titulo, valor, tipo, categoria_id, data_ocorrencia, descricao, metodo_pagamento }) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Usuário não autenticado.");

      const { data: newTransaction, error } = await supabase
        .from('transactions')
        .insert([{
          title: titulo,
          amount: parseFloat(valor),
          type: tipo === 'receita' ? 'income' : 'expense',
          category_id: categoria_id,
          occurred_on: data_ocorrencia,
          description: descricao,
          payment_method: metodo_pagamento,
          user_id: session.user.id,
        }])
        .select()
        .single();

      if (error) {
        console.error("[Supabase Create Transaction Error]", error.code, error.message);
        if (error.code === '23503') throw new Error("Categoria não encontrada.");
        throw new Error("Não foi possível criar a transação.");
      }
      return newTransaction;
    } catch (error) {
      throw error;
    }
  },

  async updateTransaction({ id, titulo, valor, tipo, categoria_id, data_ocorrencia, descricao, metodo_pagamento }) {
    try {
      const { data: updatedTransaction, error } = await supabase
        .from('transactions')
        .update({
          title: titulo,
          amount: parseFloat(valor),
          type: tipo === 'receita' ? 'income' : 'expense',
          category_id: categoria_id,
          occurred_on: data_ocorrencia,
          description: descricao,
          payment_method: metodo_pagamento
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error("[Supabase Update Transaction Error]", error.code, error.message);
        if (error.code === '23503') throw new Error("Categoria não encontrada.");
        throw new Error("Não foi possível atualizar a transação.");
      }
      return updatedTransaction;
    } catch (error) {
      throw error;
    }
  },

  async deleteTransaction(id) {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error("[Supabase Delete Transaction Error]", error.code, error.message);
        throw new Error("Não foi possível deletar a transação.");
      }
      return true;
    } catch (error) {
      throw error;
    }
  }
}