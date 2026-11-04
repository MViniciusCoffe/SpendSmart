# Ambientes

Matriz de ambientes, variáveis e fluxo de migrations. Este documento é a referência única: o
`README.md` e os demais arquivos de `docs/` apontam para cá em vez de repetir estas tabelas.

> **Estado atual (2026-11-04):** desenvolvimento, Preview e Produção usam bancos separados
> (issue [#20](https://github.com/MViniciusCoffe/SpendSmart/issues/20)). Até 2026-11-03 havia um
> único projeto Supabase servindo os três; ver §8 para o que mudou e por quê.

---

## 1. Matriz de ambientes

| Ambiente                 | Banco                                     | Região                   | Onde roda o Next.js                      | Arquivo de variáveis                    |
| ------------------------ | ----------------------------------------- | ------------------------ | ---------------------------------------- | --------------------------------------- |
| **Local**                | Supabase CLI (`supabase start`)           | máquina do desenvolvedor | `npm run dev`                            | `.env.local`                            |
| **Testes (CI)**          | pg-mem (em memória) e Supabase CLI no job | runner do GitHub Actions | — (só Jest)                              | nenhum (o job `rls` gera as chaves)     |
| **Preview**              | Projeto Supabase `spsm-preview`           | us-east-1 (N. Virginia)  | Vercel, qualquer branch que não é `main` | painel da Vercel, escopo **Preview**    |
| **Produção**             | Projeto Supabase `spsm-prod`              | sa-east-1 (São Paulo)    | Vercel, branch `main`                    | painel da Vercel, escopo **Production** |
| **Postgres puro (opc.)** | PostgreSQL 16 do `infra/compose.yaml`     | máquina do desenvolvedor | —                                        | nenhum (credenciais fixas do compose)   |

Por que São Paulo para Produção: os serviços em `src/services/` rodam no navegador e falam direto
com o Supabase, então a latência que o usuário sente é usuário → Supabase. Os usuários estão no
Brasil. As funções da Vercel (rotas de `src/app/api/`) estão configuradas na região `gru1`
(São Paulo) pelo mesmo motivo; essa configuração vale para o projeto inteiro da Vercel, então as
rotas de API das Previews também rodam em `gru1`, a ~120 ms do banco de Preview. Aceitável para
um ambiente de teste.

### O modelo de deploy da Vercel

O projeto está publicado em <https://spend-smart-lilac.vercel.app/>. A Vercel tem pipeline
próprio, separado do GitHub Actions: o que aparece no GitHub são _checks_ reportando o build. A
Vercel escolhe o ambiente pelo nome da branch:

| Branch         | Resultado                                                       |
| -------------- | --------------------------------------------------------------- |
| `main`         | **Production**, no domínio `spend-smart-lilac.vercel.app`       |
| Qualquer outra | **Preview**, em URL própria por branch/commit, banco de Preview |

O repositório é público: qualquer branch aberta aqui gera uma Preview com acesso de serviço ao
banco de **Preview**. Desde a separação, isso expõe só dados de teste, nunca os de Produção.

---

## 2. Variáveis de ambiente

| Variável                               | Lida em                                                 | Local (`.env.local`)     | Preview (Vercel)         | Produção (Vercel)        | Sensível?                    |
| -------------------------------------- | ------------------------------------------------------- | ------------------------ | ------------------------ | ------------------------ | ---------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | `src/lib/supabase.js`, rotas de `src/app/api/`          | `http://127.0.0.1:54321` | URL do `spsm-preview`    | URL do `spsm-prod`       | Não                          |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `src/lib/supabase.js`, rotas de `src/app/api/`          | `supabase status`        | chave do `spsm-preview`  | chave do `spsm-prod`     | Não (vai para o navegador)   |
| `SUPABASE_SERVICE_ROLE_KEY`            | `src/app/api/createProfile`, `deleteAccount`, `status`  | `supabase status`        | secret do `spsm-preview` | secret do `spsm-prod`    | **Sim** — marcar _Sensitive_ |
| `DATABASE_URL`                         | só `scripts/db-migrations.js`, via `.env.<alvo>.remote` | —                        | **não existe na Vercel** | **não existe na Vercel** | **Sim**                      |
| `TEST_DATABASE_URL`                    | `tests/integration/db.js` (opcional, ver §6)            | não definir por padrão   | —                        | —                        | Não (banco local)            |

- **Chave pública:** chama-se `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. O Supabase renomeou a antiga
  `anon` para `publishable` (troca no commit `e70e163`); `ANON_KEY` não é lido.
- **Chave secreta:** `SUPABASE_SERVICE_ROLE_KEY` **nunca** leva prefixo `NEXT_PUBLIC_` — com ele, ela
  seria embutida no bundle do navegador. Só é lida em `src/app/api/`, no servidor.
- **A chave secreta é exigida no build**, não só em runtime: as três rotas criam o cliente admin
  no topo do módulo, e o `next build` carrega os módulos ao coletar os dados das páginas. Sem a
  variável no escopo, o build falha com `supabaseKey is required` (foi o que aconteceu com a Preview
  em 2026-11-04). Ver AGENTS.md §14.3.
- **`DATABASE_URL` não vai para a Vercel.** Nenhum código da aplicação a lê; mantê-la no painel só
  guardaria uma senha de banco (que ignora o RLS) num lugar que não precisa dela.

---

## 3. Arquivos de ambiente

| Arquivo                  | Versionado | Lido por                                       | Conteúdo                                       |
| ------------------------ | ---------- | ---------------------------------------------- | ---------------------------------------------- |
| `.env.local.example`     | sim        | — (modelo)                                     | as 3 variáveis do Supabase local               |
| `.env.local`             | não        | Next.js (`next dev`), Jest (`tests/setup.js`)  | chaves do `supabase status`                    |
| `.env.remote.example`    | sim        | — (modelo)                                     | `DATABASE_URL` com placeholders                |
| `.env.production.remote` | não        | `scripts/db-migrations.js --target production` | `DATABASE_URL` do `spsm-prod` (Session pooler) |
| `.env.preview.remote`    | não        | `scripts/db-migrations.js --target preview`    | `DATABASE_URL` do `spsm-preview`               |

- O `.gitignore` bloqueia `.env*` e libera só `.env.example`, `.env.local.example` e
  `.env.remote.example`.
- **Os arquivos `.remote` têm nome que o Next.js não carrega** (ele só lê `.env`, `.env.local`,
  `.env.<modo>` e `.env.<modo>.local`). A aplicação nunca vê credenciais remotas.
- **Não existe mais `.env.development`.** O Next.js o carregaria como fallback quando falta o
  `.env.local`, e ele já guardou as credenciais de produção (issue #20). O `scripts/dev.js` se recusa
  a iniciar se encontrar um.
- **Quem precisa de quê:** um contribuidor precisa só do `.env.local`. Os arquivos `.remote` são de
  quem aplica migrations nos bancos remotos. Para dar esse acesso a alguém, convide a pessoa para a
  organização no Supabase em vez de enviar o arquivo: o acesso pode ser revogado sem rotacionar nada.

---

## 4. Local (Supabase CLI) — o único ambiente de desenvolvimento

```bash
supabase start                    # Postgres + Auth + Kong + Studio em containers
npm run infra:status              # URL e chaves locais
cp .env.local.example .env.local  # preencha com a saída do infra:status
npm run dev                       # verifica o .env.local, sobe a infra se preciso, inicia o Next.js
```

O `scripts/dev.js` recusa iniciar se: o `.env.local` não existe; o `NEXT_PUBLIC_SUPABASE_URL` dele
não é `127.0.0.1`/`localhost`; ou existe um `.env.development`. Assim o desenvolvimento não aponta
para um banco remoto por engano.

| Comando                | Efeito                                                      |
| ---------------------- | ----------------------------------------------------------- |
| `npm run infra:up`     | `supabase start` — as migrations são aplicadas na criação   |
| `npm run infra:reset`  | `supabase db reset` — recria o banco e aplica as migrations |
| `npm run infra:status` | URLs e chaves locais                                        |
| `npm run infra:studio` | Studio local (porta 54323)                                  |
| `npm run infra:down`   | `supabase stop` (preserva os volumes)                       |

---

## 5. Migrations

### 5.1 Uma ferramenta, um formato

As migrations são **apenas** os arquivos `supabase/migrations/<timestamp>_<nome>.sql`, aplicados
pelo **Supabase CLI** em todos os alvos. Cada banco guarda o próprio histórico em
`supabase_migrations.schema_migrations`. O `node-pg-migrate` e as migrations `.js` foram removidos
em 2026-11-04 (ver [tooling-decisions.md](tooling-decisions.md), entrada 28).

| Alvo                    | Comando                                                    |
| ----------------------- | ---------------------------------------------------------- |
| Supabase local          | `npm run infra:reset`                                      |
| Preview                 | `npm run migrations:push -- --target preview [--apply]`    |
| Produção                | `npm run migrations:push -- --target production [--apply]` |
| Postgres puro (compose) | `npm run migrations:push -- --target docker [--apply]`     |
| Ver histórico           | `npm run migrations:list -- --target <alvo>`               |
| Criar migration         | `npm run migrations:new -- <nome>`                         |

O `scripts/db-migrations.js` exige `--target` (não há alvo padrão), faz **dry-run** a menos que
receba `--apply`, e mesmo com `--apply` o CLI ainda pede confirmação `Y/n`.

### 5.2 Fluxo de uma mudança de schema

```bash
npm run migrations:new -- add_algo              # cria supabase/migrations/<timestamp>_add_algo.sql
# escreva o SQL; tudo que referencia auth.users vai dentro de IF to_regclass('auth.users') IS NOT NULL
npm run infra:reset                              # aplica do zero no banco local
npm run test:integration                         # pg-mem monta o schema a partir dos .sql
npm run test:integration:supabase                # RLS real no Supabase local
npm run migrations:push -- --target preview      # dry-run: confere o que será aplicado
npm run migrations:push -- --target preview --apply
# teste a Preview da branch; depois do merge em main:
npm run migrations:push -- --target production --apply
```

Regras:

- **Nunca editar** o SQL de uma migration já aplicada em Preview ou Produção: o CLI compara só a
  versão (o timestamp), então a mudança nunca chegaria aos bancos remotos. Crie uma nova.
- **Não existe `down`.** O Supabase CLI executaria uma seção `-- Down Migration` como SQL comum. Para
  desfazer, escreva uma migration nova que reverte.
- Toda migration precisa rodar também num Postgres sem `auth.users` (o alvo `docker` e o pg-mem
  dos testes): por isso o guard `to_regclass`.

### 5.3 Rede

As conexões de migration usam a porta 5432 do _Session pooler_ do Supabase. **A rede da UFRN
bloqueia saídas para a porta 5432** (só 80/443 passam): rode os comandos remotos em outra rede
(roteador de casa, roteamento pelo celular). A conexão direta `db.<ref>.supabase.co` é só IPv6 no
plano gratuito; use o pooler.

---

## 6. Testes

| Suíte                               | Banco                                                         |
| ----------------------------------- | ------------------------------------------------------------- |
| `npm test` (unidade)                | nenhum (Supabase mockado)                                     |
| `npm run test:integration`          | **pg-mem**, com schema montado de `supabase/migrations/*.sql` |
| `npm run test:integration:supabase` | Supabase local (`supabase start` + `.env.local`)              |
| CI (`test.yml`)                     | pg-mem no job principal; Supabase CLI efêmero no job `rls`    |

> ⚠️ **`TEST_DATABASE_URL` troca o pg-mem por um Postgres real, e os testes de integração apagam
> `auth.users`, `categories` e `transactions` no `beforeEach`.** O `tests/setup.js` carrega o
> `.env.local`, então deixar `TEST_DATABASE_URL` definido lá faz `npm run test:integration` apagar
> os dados do Supabase local a cada execução (aconteceu em 2026-11-04). Mantenha a linha comentada e
> passe a variável só na linha de comando, apontando para um banco descartável.

---

## 7. Configuração dos projetos Supabase remotos

O que precisa estar igual nos dois projetos (e o que a aplicação quebra se não estiver):

| Configuração (painel)                                     | Valor                       | Por quê                                                                                                      |
| --------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Authentication → Email → **Confirm email**                | **desligado**               | `authService.registerUser` exige sessão logo após o `signUp`; com confirmação ligada o cadastro falha        |
| Authentication → **Minimum password length**              | 6                           | igual ao `config.toml` local e ao validador do front-end (#43)                                               |
| Authentication → URL Configuration → **Site URL**         | URL da Vercel do ambiente   | links de e-mail do Auth                                                                                      |
| Authentication → **Redirect URLs** (só Preview)           | curinga das URLs de Preview | cada Preview tem URL própria                                                                                 |
| Postgres                                                  | 17                          | igual ao `major_version` do `supabase/config.toml`                                                           |
| Database → **Automatically expose new tables** (Produção) | desligado                   | os `GRANT`s vêm da migration `1790304277043_add-rbac-permissions.sql`; tabela nova só é exposta de propósito |

Plano gratuito: 2 projetos ativos por organização (os dois estão em uso), e projeto sem atividade
por ~7 dias é pausado — reative pelo painel.

---

## 8. Histórico: o ambiente único (até 2026-11-03)

Até a separação, um único projeto Supabase (o atual `spsm-preview`) era desenvolvimento, Preview e
Produção ao mesmo tempo, e o `.env.development` local guardava a `DATABASE_URL` e a
`SUPABASE_SERVICE_ROLE_KEY` dele. Consequências que motivaram a issue #20:

- Qualquer Preview — gerada por qualquer branch deste repositório público — tinha acesso de serviço
  ao banco real.
- Os scripts de migration (`migrations:up`/`down`/`supabase:up`, todos lendo `.env.development`)
  apontavam para produção; o `migrations:down` revogaria os `GRANT`s e derrubaria a aplicação.
- Sem `.env.local`, o `next dev` carregaria silenciosamente as credenciais de produção.

O que foi feito: Produção ganhou um projeto novo (`spsm-prod`, com schema aplicado por
`supabase db push` e histórico limpo); o projeto antigo virou Preview e teve chave secreta e senha
rotacionadas e o histórico de migrations registrado com `supabase migration repair` (o schema já
estava completo); a `DATABASE_URL` saiu da Vercel; as credenciais remotas foram para arquivos
`.env.*.remote` que o Next.js não lê. Nenhum segredo esteve no histórico do git (verificado em
2026-11-04 em todos os commits).

### Pendências conhecidas

- **Preview: drift** — três políticas `SELECT` criadas à mão no painel
  (`Permitir leitura ...`, redundantes com as `*_owner_policy`) e a tabela `public.pgmigrations`
  do node-pg-migrate. Não existem no local nem em Produção; remover.
- **Chave secreta só para duas rotas** — `createProfile` e `deleteAccount` poderiam virar trigger em
  `auth.users` e RPC `SECURITY DEFINER`, eliminando a `SUPABASE_SERVICE_ROLE_KEY` da Vercel (ver
  AGENTS.md §14.3).

---

## 9. Checklist de mudança de ambiente

Ao criar ou destruir um ambiente:

- [ ] Arquivo `.example` correspondente versionado, sem segredo
- [ ] Variáveis documentadas na §2, com o escopo da Vercel
- [ ] Configurações da §7 replicadas no projeto Supabase
- [ ] `npm run migrations:list -- --target <alvo>` mostra todas as versões aplicadas
- [ ] RLS ativo e as três `*_owner_policy` presentes (`select * from pg_policies`)
- [ ] Isolamento entre dois usuários exercitado antes de qualquer uso real
- [ ] Nenhuma variável `NEXT_PUBLIC_` carregando segredo
