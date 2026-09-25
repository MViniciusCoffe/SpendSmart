# Infraestrutura local

Docker Compose com PostgreSQL 16, para validar schema, constraints e migrations sem depender do
Supabase.

> **A matriz de ambientes e as variaveis estao em
> [environments.md](environments.md).** Este arquivo cobre apenas o que e especifico do
> PostgreSQL local. Em particular, veja o aviso sobre `npm run dev` em
> [environments.md](environments.md#4-o-problema-do-npm-run-dev): hoje o script se conecta ao
> banco remoto, e nao ao container deste documento.

## Arquivos

```text
infra/
  compose.yaml
  scripts/
    run-services.js
    wait-for-postgres.js
supabase/
  migrations/
.env.development.example
```

## Variaveis do container

Definidas em `infra/compose.yaml` e espelhadas no `.env.development.example`:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=local_user
POSTGRES_DB=local_db
POSTGRES_PASSWORD=local
```

O `.env.development` real nao e versionado. Copie o exemplo antes de usar o banco local:

```bash
cp .env.development.example .env.development
```

> **Atencao:** o `.env.development` que existe hoje ja esta preenchido e aponta para o Supabase
> remoto. Copiar o exemplo por cima substitui essas chaves. Guarde o conteudo atual antes, se
> ainda precisar dele.

## Comandos

| Comando | Efeito |
| --- | --- |
| `npm run services:up` | Sobe o container em background |
| `npm run services:wait:database` | Aguarda a conexao usando `DATABASE_URL` |
| `npm run services:stop` | Para o container, preserva o volume |
| `npm run services:down` | Remove container, rede e volume |
| `npm run migrations:up` | Aplica as migrations de `supabase/migrations/` |
| `npm run migrations:down` | Desfaz a ultima migration |
| `npm run migrations:create` | Cria um arquivo de migration com timestamp |
| `npm run migrations:supabase:up` | Aplica as migrations no Supabase, lendo `.env.supabase` |

`migrations:up` e `migrations:down` leem `.env.development`; `migrations:supabase:up` le
`.env.supabase`. Nao existe `migrations:supabase:down` — se precisar reverter no Supabase, use
`node-pg-migrate down` apontando explicitamente para `.env.supabase`.

## O que o Postgres local valida e o que nao valida

| Valida | Nao valida |
| --- | --- |
| Criacao das tres tabelas e suas constraints | RLS — depende de `auth.users`, que nao existe aqui |
| `check (type in ('income','expense'))` | Politicas de `auth.uid()` |
| `check (amount > 0)` | `GRANT` de `service_role` e `authenticated` |
| `unique (user_id, name, type)` | FK para `auth.users` e o `on delete cascade` |
| `on delete restrict` de `transactions.category_id` | |
| Os quatro indices | |

O guard `IF to_regclass('auth.users') IS NOT NULL` em `001_create_financial_schema.js:101` faz o
PostgreSQL local pular silenciosamente toda a parte de Supabase. Consequencia: **um banco local
passa todos os testes sem nenhuma barreira de isolamento.** Ver
[database-schema.md](database-schema.md#limites-conhecidos).

## Nome das migrations

A migration inicial se chama `001_create_financial_schema` e nao tem timestamp, entao o
`node-pg-migrate` emite o aviso `Can't determine timestamp for 001`. Funciona, mas e por compatibilidade.

Migrations novas **precisam** ter timestamp (`node-pg-migrate create` ja faz isso). Nao renomeie a
`001`: ela ja foi aplicada e esta registrada na tabela `pgmigrations` do banco.

## Sugestao de uso

Rode o container local para iterar em constraints e indices. Antes de considerar qualquer regra
que envolva seguranca — RLS, cascata, `auth.uid()` —, valide em um projeto Supabase separado.
