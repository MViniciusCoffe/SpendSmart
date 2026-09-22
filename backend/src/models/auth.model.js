const pool = require("../database/");

class AuthModel {
  async login(email, senha) {
    const client = await pool.connect();
    const sql = "SELECT * FROM usuarios WHERE email=$1 AND senha=$2;";
    const values = [email, senha];
    const data = await client.query(sql, values);
    client.release;
    return data.rows[0];
  }
}

module.exports = new AuthModel();
