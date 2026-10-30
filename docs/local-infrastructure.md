# Infraestrutura local

Dois modos de rodar banco local:

| Modo               | O que sobe                                    | RLS | Auth | Studio | Uso recomendado                   |
| ------------------ | --------------------------------------------- | --- | ---- | ------ | --------------------------------- |
| **Supabase CLI**   | Postgres + Auth + Realtime + Storage + Studio | ✅  | ✅   | ✅     | **Padrão** — desenvolvimento real |
| **Docker Compose** | Só Postgres 16                                | ❌  | ❌   | ❌     | Só constraints/índices            |

> **A matriz de ambientes e variáveis está em
> [environments.md](environments.md).**

---

## 1. Supabase CLI (padrão recomendado)

### 1.1 Arquivos

```text
supabase/
  config.toml          # configuração do projeto local
  migrations/
    1791833057000_create_financial_schema.sql
    1791833057036_rename_profiles_columns_to_english.sql
  .temp/               # ignorado pelo git
```

### 1.2 Comandos

| Comando                     | Efeito                                                              |
| --------------------------- | ------------------------------------------------------------------- |
| `supabase start`            | Sobe stack completa (Postgres + Auth + Realtime + Storage + Studio) |
| `supabase status`           | Mostra URLs, chaves e status dos containers                         |
| `supabase db reset`         | Recria banco, aplica migrations, roda seed                          |
| `supabase studio`           | Abre dashboard web local (porta 54323)                              |
| `supabase stop`             | Para containers (preserva volumes)                                  |
| `supabase stop --no-backup` | Para e remove volumes                                               |
| `supabase db reset`         | Recria banco + aplica migrations                                    |
| `supabase db push`          | Aplica migrations pendentes (sem recriar)                           |
| `supabase auth signup`      | Cria usuário no Auth local                                          |

### 1.3 Variáveis locais (`.env.local`)

```bash
# Rode: supabase start
# Copie as chaves do output para .env.local

NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

> **Prioridade Next.js:** `.env.local` > `.env.development` > `.env`. Se `.env.local` existe, `.env.development` é ignorado.

### 1.4 Testes de integração contra banco local real

```bash
# Terminal 1
supabase start

# Terminal 2
$env:TEST_DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
npm run test:integration
```

> **Nota:** Testes atuais usam UUIDs fixos que não existem no `auth.users` local — FKs bloqueiam. Testes reais de RLS precisam usuários criados via `supabase auth signup`.

O script `tests/helpers/factory.js` fornece helpers para seed limpo:

```js
const { createTestUser, createTestScenario, cleanupTestData } = require("../helpers/factory")
await createTestScenario(userId, { categories: [...], transactions: [...] })
await cleanupTestData([userId])
```

---

## 2. Docker Compose (Postgres puro — legado)

> **Use apenas se NÃO quiser Supabase CLI.** Sem Auth, sem RLS, sem Studio. Só valida constraints/índices.

### 2.1 Arquivos

```text
infra/
  compose.yaml
  scripts/
    wait-for-postgres.js
.env.development.example
```

### 2.2 Variáveis do container

Definidas em `infra/compose.yaml` e espelhadas no `.env.development.example`:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=local_user
POSTGRES_DB=local_db
POSTGRES_PASSWORD=local
```

O `.env.development` real não é versionado. Copie o exemplo antes de usar:

```bash
cp .env.development.example .env.development
```

> **Atenção:** o `.env.development` que existe hoje já está preenchido e aponta para o Supabase
> remoto. Copiar o exemplo por cima substitui essas chaves. Guarde o conteúdo atual antes, se
> ainda precisar dele.

### 2.3 Comandos

| Comando                          | Efeito                                                                 |
| -------------------------------- | ---------------------------------------------------------------------- |
| `npm run services:up`            | Sobe o container em background                                         |
| `npm run services:wait:database` | Aguarda a conexão usando `DATABASE_URL`                                |
| `npm run services:stop`          | Para o container, preserva o volume                                    |
| `npm run services:down`          | Remove container, rede e volume                                        |
| `npm run migrations:up`          | Aplica as migrations de `supabase/migrations/` (lê `.env.development`) |
| `npm run migrations:down`        | Desfaz a última migration                                              |
| `npm run migrations:create`      | Cria um arquivo de migration com timestamp                             |
| `npm run migrations:supabase:up` | Aplica as migrations no banco do `.env.development`                    |

> Os três comandos leem `.env.development`. Não existe um `.env.supabase` separado: o conteúdo
> seria o mesmo do `.env.development`, então `migrations:supabase:up` foi apontado para ele. Para
> reverter, use `npm run migrations:down`.

### 2.4 O que o Postgres local valida e o que não valida

| Valida                                             | Não valida                                         |
| -------------------------------------------------- | -------------------------------------------------- |
| Criação das três tabelas e suas constraints        | RLS — depende de `auth.users`, que não existe aqui |
| `check (type in ('income','expense'))`             | Políticas de `auth.uid()`                          |
| `check (amount > 0)`                               | `GRANT` de `service_role` e `authenticated`        |
| `unique (user_id, name, type)`                     | FK para `auth.users` e o `on delete cascade`       |
| `on delete restrict` de `transactions.category_id` |                                                    |
| Os quatro índices                                  |                                                    |

O guard `IF to_regclass('auth.users') IS NOT NULL` em `supabase/migrations/1791833057000_create_financial_schema.sql` faz o PostgreSQL local pular silenciosamente toda a parte de Supabase. Consequência: **um banco local passa todos os testes sem nenhuma barreira de isolamento.** Ver [database-schema.md](database-schema.md#limites-conhecidos).

### 2.5 Scripts de apoio

```text
infra/
  scripts/
    wait-for-postgres.js    # espera Postgres aceitar conexão (usado em services:wait:database)
```

> O script `run-services.js` (antigo `dev`) foi removido — aplicava migrations no banco remoto.

---

## 3. Nome das migrations

A migration inicial em SQL chama-se `1791833057000_create_financial_schema.sql` (com timestamp).
As antigas `.js` sem timestamp (`001_create_financial_schema.js`, etc.) são ignoradas pelo Supabase CLI.

Migrations novas **precisam** ter timestamp (`node-pg-migrate create` já faz isso). Não renomeie as antigas: já foram aplicadas e estão registradas na tabela `pgmigrations` do banco.

---

## 4. Sugestão de uso

| Objetivo                       | Comando                                                                              |
| ------------------------------ | ------------------------------------------------------------------------------------ |
| Desenvolvimento diário         | `npm run dev` (sobe Supabase CLI + Next.js)                                          |
| Resetar banco local            | `supabase db reset` ou `npm run infra:reset`                                         |
| Ver credenciais locais         | `supabase status` ou `npm run infra:status`                                          |
| Dashboard local                | `supabase studio` ou `npm run infra:studio`                                          |
| Validar constraints/índices só | `npm run services:up && npm run migrations:up`                                       |
| Testes integração com RLS real | `supabase start` → criar usuários → `TEST_DATABASE_URL=... npm run test:integration` |

> Antes de considerar qualquer regra que envolva segurança — RLS, cascata, `auth.uid()` —, valide com Supabase CLI local (`supabase start`).
