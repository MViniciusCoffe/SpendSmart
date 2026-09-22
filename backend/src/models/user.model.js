const pool = require("../database");

class UserModel {
  async save(
    nome_completo,
    email,
    senha,
    data_nascimento,
    telefone,
    data_criacao,
  ) {
    const client = await pool.connect();
    const sql =
      "INSERT INTO usuarios(nome_completo, email, senha, data_nascimento, telefone, data_criacao) VALUES ($1, $2, $3, $4, $5, $6);";
    const values = [
      nome_completo,
      email,
      senha,
      data_nascimento,
      telefone,
      data_criacao,
    ];
    const result = await client.query(sql, values);
    client.release();
    return result;
  }

  async find(email) {
    const client = await pool.connect();
    const sql = "SELECT * FROM usuarios WHERE email=$1;";
    const values = [email];
    const data = await client.query(sql, values);
    client.release();
    return data.rows.length > 0 ? data.rows[0] : null;
  }

  async check(email) {
    const client = await pool.connect();
    const sql = "SELECT * FROM usuarios WHERE email=$1;";
    const values = [email];
    const data = await client.query(sql, values);
    client.release();
    return data.rows.length > 0;
  }

  async delete(email) {
    const client = await pool.connect();
    const sql = "DELETE FROM usuarios WHERE email=$1;";
    const values = [email];
    const result = await client.query(sql, values);
    client.release();
    return result;
  }

  async update(email, user) {
    const client = await pool.connect();

    // COALESCE() garante que dados nulos não sejam sobrescritos
    const sql = `
      UPDATE usuarios 
      SET 
        nome_completo = COALESCE($1, nome_completo), 
        senha = COALESCE($2, senha), 
        data_nascimento = COALESCE($3, data_nascimento), 
        telefone = COALESCE($4, telefone) 
      WHERE email = $5 
      RETURNING *;
    `;
    const values = [
      user.nome_completo || null,
      user.senha || null,
      user.data_nascimento || null,
      user.telefone || null,
      email,
    ];

    const result = await client.query(sql, values);
    client.release();
    return result.rows[0];
  }

  async show() {
    const client = await pool.connect();
    const sql = `SELECT * FROM usuarios;`;
    const data = await client.query(sql);
    client.release();
    return data.rows;
  }
}

module.exports = new UserModel();
