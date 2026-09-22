const pool = require("../database");

class SpendModel {
  async show() {
    const client = await pool.connect();
    const sql = `SELECT * FROM rendas`;
    const data = await client.query(sql);
    client.release();
    return data.rows;
  }

  async save(
    id_categoria,
    usuario_id,
    valor,
    detalhe_categoria,
    data,
    descricao,
    forma_pagamento,
  ) {
    const client = await pool.connect();
    const sql = `INSERT INTO rendas(categoria_id, usuario_id, valor, fonte_renda, data, descricao, forma_pagamento) VALUES($1, $2, $3, $4, $5, $6, $7);`;
    const values = [
      id_categoria,
      usuario_id,
      valor,
      detalhe_categoria,
      data,
      descricao,
      forma_pagamento,
    ];
    const result = await client.query(sql, values);
    client.release();
    return result;
  }

  async find(id) {
    const client = await pool.connect();
    const sql = `SELECT * FROM rendas WHERE id=$1;`;
    const values = [id];
    const data = await client.query(sql, values);
    client.release();

    // Verifica caso exista o primeiro elemento no array (se o data.rows.length for maior do que 0).
    // Se o array estiver vazio, retorna null, se não, retorna o primeiro elemento do array.
    return data.rows.length > 0 ? data.rows[0] : null;
  }

  async delete(id) {
    const client = await pool.connect();
    const sql = `DELETE FROM rendas WHERE id=$1`;
    const values = [id];
    const data = await client.query(sql, values);
    client.release();
    return data;
  }
}

module.exports = new SpendModel();
