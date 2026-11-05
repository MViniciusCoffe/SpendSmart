# Infraestrutura local

Dois modos de rodar banco local:

| Modo               | O que sobe                                    | RLS | Auth | Studio | Uso                               |
| ------------------ | --------------------------------------------- | --- | ---- | ------ | --------------------------------- |
| **Supabase CLI**   | Postgres + Auth + Realtime + Storage + Studio | ✅  | ✅   | ✅     | **Padrão** — desenvolvimento real |
| **Docker Compose** | Só PostgreSQL 16                              | ❌  | ❌   | ❌     | Opcional — constraints e índices  |

> A matriz de ambientes, as variáveis e o fluxo de migrations estão em
> [environments.md](environments.md). Este documento cobre só o que roda na máquina.

---

## 1. Supabase CLI (padrão)

### 1.1 Arquivos

```text
supabase/
  config.toml          # configuração do projeto local (Postgres 17, Auth, portas)
  migrations/          # <timestamp>_<nome>.sql — única fonte do schema, aplicada pelo CLI
  .temp/               # estado local do CLI, ignorado pelo git
.env.local.example     # modelo do .env.local
```

### 1.2 Comandos

| Comando                | Equivale a          | Efeito                                                            |
| ---------------------- | ------------------- | ----------------------------------------------------------------- |
| `npm run dev`          | `scripts/dev.js`    | Confere o `.env.local`, sobe o Supabase se preciso, inicia o Next |
| `npm run infra:up`     | `supabase start`    | Sobe a stack e aplica as migrations na criação                    |
| `npm run infra:status` | `supabase status`   | URLs, chaves e estado dos containers                              |
| `npm run infra:reset`  | `supabase db reset` | Recria o banco e aplica todas as migrations                       |
| `npm run infra:studio` | `supabase studio`   | Studio local (porta 54323)                                        |
| `npm run infra:down`   | `supabase stop`     | Para os containers, preserva os volumes                           |

### 1.3 Variáveis (`.env.local`)

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...   # supabase status
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...                  # supabase status
```

O `scripts/dev.js` recusa iniciar se o `NEXT_PUBLIC_SUPABASE_URL` não for local. Não defina
`TEST_DATABASE_URL` no `.env.local`: os testes de integração passariam a apagar os dados do banco
local (ver [environments.md §6](environments.md#6-testes)).

---

## 2. Docker Compose (Postgres puro, opcional)

> Sem Auth, sem RLS, sem Studio: não dá para usar a aplicação contra ele. Serve para conferir que
> as migrations rodam num Postgres sem `auth.users`.

```bash
npm run services:up                                   # sobe e espera o healthcheck (--wait)
npm run migrations:push -- --target docker --apply    # aplica supabase/migrations/*.sql
npm run services:down                                 # remove container e rede
```

Os testes de integração **não** rodam contra este banco: eles inserem em `auth.users`, que só existe
no Supabase. Com `TEST_DATABASE_URL`, eles rodam contra um Supabase local, que precisa ser descartável
(os testes apagam `auth.users`, `categories` e `transactions`). O `tests/integration/db.js` recusa o
banco se `auth.users` tiver alguma conta com e-mail.

As credenciais (`local_user` / `local` / `local_db`, porta 5432) são os valores padrão do
`infra/compose.yaml`; não há arquivo `.env` para este modo. O alvo `docker` do
`scripts/db-migrations.js` usa essa mesma URL com `sslmode=disable` (o Postgres do compose não tem
TLS).

### 2.1 O que o Postgres puro valida e o que não valida

| Valida                                             | Não valida                                         |
| -------------------------------------------------- | -------------------------------------------------- |
| Criação das três tabelas e suas constraints        | RLS — depende de `auth.users`, que não existe aqui |
| `check (type in ('income','expense'))`             | Políticas de `auth.uid()`                          |
| `check (amount > 0)`                               | `GRANT` de `service_role` e `authenticated`        |
| `unique (user_id, name, type)`                     | FK para `auth.users` e o `on delete cascade`       |
| `on delete restrict` de `transactions.category_id` |                                                    |
| Índices, `deleted_at` e o trigger de `updated_at`  |                                                    |

O guard `IF to_regclass('auth.users') IS NOT NULL` nas migrations faz o Postgres puro pular a
parte do Supabase. Consequência: **um banco sem `auth.users` passa nos testes sem nenhuma barreira de
isolamento.** RLS só se testa com o Supabase CLI (`npm run test:integration:supabase`). Ver
[database-schema.md](database-schema.md#limites-conhecidos).

---

## 3. Sugestão de uso

| Objetivo                         | Comando                                                                      |
| -------------------------------- | ---------------------------------------------------------------------------- |
| Desenvolvimento diário           | `npm run dev`                                                                |
| Recriar o banco local            | `npm run infra:reset`                                                        |
| Criar uma migration              | `npm run migrations:new -- <nome>` (ver environments.md §5.2)                |
| Testar RLS real                  | `supabase start` → `npm run test:integration:supabase`                       |
| Conferir migrations sem Supabase | `npm run services:up` → `npm run migrations:push -- --target docker --apply` |

> Antes de considerar qualquer regra que envolva segurança — RLS, cascata, `auth.uid()` —, valide
> com o Supabase CLI local.
