const pool = require("../database");

class CategoryModel {
  async show() {
    const client = await pool.connect();
    const sql = `SELECT * FROM categorias;`;
    const data = await client.query(sql);
    client.release();
    return data.rows;
  }

  async save(nome, tipo, descricao, cor, usuario_id) {
    const client = await pool.connect();
    const sql = `INSERT INTO categorias(nome, tipo, descricao, cor, usuario_id) VALUES ($1, $2, $3, $4, $5);`;
    const values = [nome, tipo, descricao, cor, usuario_id];
    const result = await client.query(sql, values);
    client.release();
    return result;
  }

  async check(nome, tipo, usuario_id) {
    const client = await pool.connect();
    const sql = `SELECT * FROM categorias WHERE nome=$1 AND tipo=$2 AND usuario_id=$3;`;
    const values = [nome, tipo, usuario_id];
    const data = await client.query(sql, values);
    client.release();
    return [data.rows.length > 0, data.rows[0]];
  }

  async find(id) {
    const client = await pool.connect();
    const sql = `SELECT * FROM categorias WHERE id=$1;`;
    const values = [id];
    const data = await client.query(sql, values);
    client.release();

    // Verifica caso exista o primeiro elemento no array (se o data.rows.length for maior do que 0).
    // Se o array estiver vazio, retorna null, se não, retorna o primeiro elemento do array.
    return data.rows.length > 0 ? data.rows[0] : null;
  }

  async delete(id) {
    const client = await pool.connect();
    const sql = `DELETE FROM categorias WHERE id=$1;`;
    const values = [id];
    const data = await client.query(sql, values);
    client.release();
    return data;
  }

  async update(id, category) {
    const client = await pool.connect();
    const sql = `
      UPDATE categorias 
      SET 
        nome = $1, 
        tipo = $2, 
        descricao = $3,
        cor = $4
      WHERE id = $5
      RETURNING *;
    `;
    const values = [
      category.editNome,
      category.editTipo,
      category.editDescricao,
      category.editCor,
      id,
    ];
    const result = await client.query(sql, values);
    return result.rows[0];
  }
}

module.exports = new CategoryModel();
