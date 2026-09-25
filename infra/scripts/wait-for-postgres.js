const { Client } = require("pg");
const dotenv = require("dotenv");

const result = dotenv.config({ path: ".env.development" });

if (result.error) {
  console.warn(
    "Arquivo .env.development nao encontrado; usando variaveis do ambiente."
  );
}

const connectionString = process.env.DATABASE_URL;
const timeoutMs = 30000;
const retryDelayMs = 1000;

if (!connectionString) {
  console.error("DATABASE_URL nao foi configurada.");
  process.exit(1);
}

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitForPostgres() {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const client = new Client({ connectionString });

    try {
      await client.connect();
      await client.query("SELECT 1");
      console.log("PostgreSQL esta pronto.");
      await client.end();
      return;
    } catch (error) {
      await client.end().catch(() => {});
      console.log("Aguardando PostgreSQL...");
      await wait(retryDelayMs);
    }
  }

  console.error("Tempo limite excedido aguardando PostgreSQL.");
  process.exit(1);
}

waitForPostgres();
