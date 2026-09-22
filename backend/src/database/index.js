const { Pool } = require("pg");
require("dotenv").config();

// Não consegui conectar usando o .env :(
const connectionString = "postgres://postgres:spendsmart123@spendsmart-database.cfsqcmu0scux.us-east-1.rds.amazonaws.com:5432";

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

console.log("Fazendo o pool");

module.exports = pool;
