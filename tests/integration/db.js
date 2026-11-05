import fs from "fs"
import path from "path"
import { newDb } from "pg-mem"
import pg from "pg"

// Fonte de banco para os testes de integração de persistência.
//
// Dois modos, escolhidos pela variável TEST_DATABASE_URL:
//
// 1. Sem TEST_DATABASE_URL (padrão, inclusive CI): Postgres em memória com pg-mem, sem Docker.
//    O schema vem das próprias migrations de supabase/migrations/*.sql — não existe cópia do DDL
//    aqui, então os testes não podem divergir do banco real. O pg-mem não tem plpgsql nem RLS,
//    por isso o adaptador abaixo:
//      - desembrulha o bloco `IF to_regclass('auth.users') IS NOT NULL THEN ... END IF` (o stub de
//        auth.users existe aqui), para as FKs com ON DELETE CASCADE virem da migration;
//      - descarta RLS, políticas, GRANT/REVOKE, triggers e funções (o RLS real é testado em
//        tests/integration/supabase/rls.test.js; o trigger de updated_at não é testado aqui);
//      - falha se sobrar qualquer outro bloco plpgsql, para nenhuma migration nova ser ignorada
//        em silêncio.
//
// 2. Com TEST_DATABASE_URL: conecta num Postgres real com o schema já aplicado. Precisa ser um
//    Supabase (os testes inserem em auth.users, que o Postgres puro do infra/compose.yaml não tem).
//    ATENÇÃO: os testes apagam auth.users, categories e transactions no beforeEach. Por isso
//    assertDisposableDb recusa o banco se auth.users tiver alguma conta com e-mail. Passe a
//    variável só na linha de comando, nunca no .env.local.
//
// Nos dois modos o contrato é o mesmo: um client com query() e end(), e as mesmas asserções de
// código de erro do PostgreSQL (23505, 23503).

const MIGRATIONS_DIR = path.resolve(__dirname, "../../supabase/migrations")

// Mesmo padrão de nome que o Supabase CLI aceita: os outros arquivos ele ignora, e aqui também
const MIGRATION_FILE = /^\d{13,}_.+\.sql$/

// Só existe no Supabase; no pg-mem basta a coluna que as FKs referenciam
const AUTH_STUB = `
  CREATE SCHEMA IF NOT EXISTS auth;
  CREATE TABLE auth.users (
    id uuid PRIMARY KEY,
    email text,
    created_at timestamptz NOT NULL DEFAULT current_timestamp
  );
`

const AUTH_GUARDED_BLOCK =
  /DO \$\$\s*BEGIN\s*IF to_regclass\('auth\.users'\) IS NOT NULL THEN([\s\S]*?)END IF;\s*END\s*\$\$;/gi
const FUNCTION_BLOCK = /CREATE (OR REPLACE )?FUNCTION[\s\S]*?\$\$;/gi
const UNSUPPORTED_BY_PG_MEM = /ENABLE ROW LEVEL SECURITY|CREATE POLICY|^GRANT\b|^REVOKE\b|TRIGGER/i

export function migrationStatements() {
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter(file => MIGRATION_FILE.test(file))
    .sort()

  return files.flatMap(file => {
    const sql = fs
      .readFileSync(path.join(MIGRATIONS_DIR, file), "utf8")
      .replace(/--.*$/gm, "")
      .replace(FUNCTION_BLOCK, "")
      .replace(AUTH_GUARDED_BLOCK, (_, body) => body)

    if (sql.includes("$$")) {
      throw new Error(
        `${file}: bloco plpgsql que o pg-mem não executa. Adapte tests/integration/db.js.`
      )
    }

    return sql
      .split(";")
      .map(statement => statement.trim())
      .filter(statement => statement && !UNSUPPORTED_BY_PG_MEM.test(statement))
  })
}

// Os testes apagam auth.users inteira no beforeEach. Os usuários que eles criam têm só id; conta com
// e-mail significa cadastro de verdade (pelo app ou pelo Studio), então o banco não é descartável.
// Em 2026-11-04 um TEST_DATABASE_URL no .env.local apontou os testes para o Supabase local e apagou
// os dados dele.
async function assertDisposableDb(client) {
  const {
    rows: [{ existe }]
  } = await client.query("select to_regclass('auth.users') is not null as existe")
  if (!existe) return

  const {
    rows: [{ contas }]
  } = await client.query("select count(*)::int as contas from auth.users where email is not null")
  if (contas > 0) {
    await client.end()
    throw new Error(
      `TEST_DATABASE_URL aponta para um banco com ${contas} conta(s) com e-mail em auth.users. ` +
        "Os testes de integração apagariam esses dados. Use pg-mem (sem TEST_DATABASE_URL) ou um " +
        "banco descartável."
    )
  }
}

export async function createTestDb() {
  if (process.env.TEST_DATABASE_URL) {
    const client = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL })
    await client.connect()
    await assertDisposableDb(client)
    return { client, modo: "postgres-real" }
  }

  const mem = newDb()
  mem.public.none(AUTH_STUB)
  for (const statement of migrationStatements()) mem.public.none(statement)

  const client = new (mem.adapters.createPg().Client)()
  await client.connect()
  return { client, modo: "pg-mem" }
}
