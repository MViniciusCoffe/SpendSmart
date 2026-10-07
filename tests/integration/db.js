import { newDb } from "pg-mem"
import pg from "pg"

// Fonte de banco para os testes de integração de persistência.
//
// Dois modos, escolhidos pela variável TEST_DATABASE_URL:
//
// 1. Sem TEST_DATABASE_URL (padrão, inclusive CI): sobe um Postgres em memória
//    com pg-mem, sem Docker. O DDL abaixo espelha exatamente as constraints que
//    a migration 001_create_financial_schema.js cria num Postgres puro — ou
//    seja, SEM o bloco RLS, que depende de auth.users e só existe no Supabase
//    (mesmo comportamento do Postgres local do compose). A migration 002 só
//    contém GRANTs de roles do Supabase, também inaplicáveis aqui.
//    Justificativa: a máquina de desenvolvimento atual não tem Docker, e um
//    teste de integração que ninguém consegue executar não verifica nada.
//
// 2. Com TEST_DATABASE_URL: conecta num Postgres real (ex.: o container de
//    infra/compose.yaml). O schema precisa já ter sido aplicado pelas
//    migrations: npm run services:up && npm run migrations:up.
//
// Nos dois modos o contrato é o mesmo: um client com query() e end(), e as
// mesmas asserções de código de erro do PostgreSQL (23505, 23503).

const DDL = `
  CREATE TABLE profiles (
    id uuid PRIMARY KEY,
    nome_completo text NOT NULL,
    data_nascimento date,
    telefone text,
    created_at timestamptz NOT NULL DEFAULT current_timestamp,
    updated_at timestamptz NOT NULL DEFAULT current_timestamp
  );

  CREATE TABLE categories (
    id bigserial PRIMARY KEY,
    user_id uuid NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    description text,
    color text NOT NULL DEFAULT '#FFFFFF',
    created_at timestamptz NOT NULL DEFAULT current_timestamp,
    updated_at timestamptz NOT NULL DEFAULT current_timestamp,
    CONSTRAINT categories_type_check CHECK (type IN ('income', 'expense')),
    CONSTRAINT categories_user_name_type_unique UNIQUE (user_id, name, type)
  );

  CREATE TABLE transactions (
    id bigserial PRIMARY KEY,
    user_id uuid NOT NULL,
    category_id bigint NOT NULL,
    type text NOT NULL,
    amount numeric(12,2) NOT NULL,
    title text NOT NULL,
    occurred_on date NOT NULL,
    description text,
    payment_method text,
    created_at timestamptz NOT NULL DEFAULT current_timestamp,
    updated_at timestamptz NOT NULL DEFAULT current_timestamp,
    CONSTRAINT transactions_type_check CHECK (type IN ('income', 'expense')),
    CONSTRAINT transactions_amount_positive CHECK (amount > 0),
    CONSTRAINT transactions_category_fk FOREIGN KEY (category_id)
      REFERENCES categories(id) ON DELETE RESTRICT
  );
`

export async function createTestDb() {
  if (process.env.TEST_DATABASE_URL) {
    const client = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL })
    await client.connect()
    return { client, modo: "postgres-real" }
  }

  const mem = newDb()
  const client = new (mem.adapters.createPg().Client)()
  await client.connect()
  await client.query(DDL)
  return { client, modo: "pg-mem" }
}
