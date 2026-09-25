# Ambientes

Matriz de ambientes e de variaveis de ambiente. Este documento e a referencia unica: o
`README.md` e os demais arquivos da pasta `docs/` nao devem repetir esta tabela.

> **Estado atual: ambiente unico e provisorio.** O SpendSmart roda hoje contra um unico projeto
> Supabase que e ao mesmo tempo desenvolvimento, teste manual e producao. A separacao
> definitiva esta em construcao — ver issue
> [#20](https://github.com/MViniciusCoffe/SpendSmart/issues/20).

---

## 1. Matriz de ambientes

| Ambiente | Banco | Vercel | Finalidade | Estado |
| --- | --- | --- | --- | --- |
| **Desenvolvimento** | Supabase remoto (provisorio) | nao | Trabalho local, migrations | Ativo, misturado com producao |
| **Producao** | Supabase remoto (provisorio) | sim (`main`) | Uso real | Ativo, e o **mesmo** banco do desenvolvimento |
| **Testes** | — | — | Suite automatizada | **Nao existe** |
| **Homologacao** | — | Preview da Vercel | Revisao antes de producao | **Nao configurado** |
| **Local (Docker)** | PostgreSQL 16 | nao | Schema, constraints, indices | Ativo, mas **nao usado** — ver §4 |

---

## 2. Variaveis por ambiente

| Variavel | Onde e lida | Dev | Preview | Producao |
| --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `infra/supabase.js:3` | sim | sim | sim |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `infra/supabase.js:4` | sim | sim | sim |
| `SUPABASE_SERVICE_ROLE_KEY` | `pages/api/createProfile.js:6`, `pages/api/deleteAccount.js:6` | sim | sim | sim |
| `DATABASE_URL` | `infra/scripts/wait-for-postgres.js:12`, `node-pg-migrate` | sim | nao | nao |
| `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_DB`, `POSTGRES_PASSWORD` | `infra/compose.yaml` | nao | nao | nao |

### Sobre o nome da chave publica

A variavel chama-se `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. O Supabase renomeou a antiga
`anon` para `publishable`; a troca no codigo ocorreu no commit `e70e163`. O nome antigo
`ANON_KEY` nao funciona e nao deve ser usado.

### Sobre a chave de servico

`SUPABASE_SERVICE_ROLE_KEY` **nao pode ter prefixo `NEXT_PUBLIC_`**. Com esse prefixo ela seria
embutida no bundle enviado ao navegador, e qualquer visitante poderia ler dados de qualquer
usuario, alem de poder criar e excluir contas. Ela so pode ser lida dentro de `pages/api/*`,
que roda no servidor. Ha dois pontos de leitura hoje: `createProfile` e `deleteAccount`.

---

## 3. Arquivos de ambiente

| Arquivo | Versionado | Conteudo atual | Para que serve |
| --- | --- | --- | --- |
| `.env.development` | nao | `DATABASE_URL` (Supabase remoto) + 3 chaves | Fonte do Next.js em desenvolvimento e do `node-pg-migrate` |
| `.env.supabase` | nao | `DATABASE_URL` (Supabase remoto) + 2 chaves publicas | Alimenta `npm run migrations:supabase:up` |
| `.env.development.example` | sim | So `POSTGRES_*` do Docker | Modelo do Postgres local |

O `.gitignore` bloqueia `.env*` e libera apenas os arquivos `.example`. Isso esta correto e deve
permanecer.

### Lacunas conhecidas

1. **`.env.supabase` nao tem `SUPABASE_SERVICE_ROLE_KEY`.** Se ele virar a fonte das rotas de
   API em algum momento, elas vao falhar sem erro claro.
2. **Nao existe `.env.example` generico** com as quatro variaveis do Supabase.
3. **`migrations:supabase:up` nao aparece em nenhum documento.** Era este o unico comando de
   migracao descrito no `README.md` antes desta revisao.
4. **Nao ha matriz para Preview e Production** na Vercel. Nenhuma das duas esta configurada.
5. **`.env.development.example:6` tem `DATABASE_URL` com variaveis nao expandidas.** O valor e
   `postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@...`, e nem o `dotenv` 16 nem o `pg` expandem
   `$VAR` dentro de uma connection string — so o `dotenv-expand` faria, e ele nao esta instalado.
   Quem copiar o exemplo tera falha de conexao com a string literal. O valor tem de ser escrito
   expandido: `postgres://local_user:local@localhost:5432/local_db`.

---

## 4. O problema do `npm run dev`

`package.json:7` define `dev` como `node infra/scripts/run-services.js`. Esse script executa, em
ordem:

```text
npm run services:up              sobe o PostgreSQL do Docker
npm run services:wait:database    le DATABASE_URL e espera a conexao
npm run migrations:up             aplica migrations
npm run next:dev                  sobe o Next.js
```

O passo 2 e o problema. `wait-for-postgres.js:12` le `DATABASE_URL` de `.env.development`, que
hoje aponta para o Supabase remoto. Portanto, o container do Docker sobe, o script se conecta ao
**banco remoto**, aplica as migrations **nele** e so entao inicia o Next.js.

Consequencias praticas:

- O PostgreSQL do Docker nunca e usado. Ele sobe e fica ocioso.
- Qualquer migration nova e aplicada no banco real assim que `npm run dev` roda.
- O `migrations:up` da documentacao local descreve um comportamento que nao ocorre.

### Como confirmar em qual banco voce esta

Sem conectar, confira o host em `.env.development`:

```bash
node -e "console.log(new URL(require('fs').readFileSync('.env.development','utf8').split('\n').find(l=>l.startsWith('DATABASE_URL')).split('=').slice(1).join('=')).host)"
```

Um host `*.supabase.com` significa banco remoto. `localhost` significa Postgres local.

### Direcao planejada

1. Mover o `DATABASE_URL` remoto para `.env.supabase`, deixando `.env.development` so com as
   variaveis do Postgres local e as duas chaves publicas.
2. Tirar `migrations:up` do encadeamento automatico, ou exigir flag explicita.
3. Completar `.env.development.example` com `NEXT_PUBLIC_SUPABASE_URL` e
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
4. Criar `.env.supabase.example` com `SUPABASE_SERVICE_ROLE_KEY` vazia.
5. Adicionar `migrations:supabase:down`, hoje inexistente.

Enquanto isso nao for feito, **trate `npm run dev` como um comando que escreve no banco de
producao.**

---

## 5. Ambientes que ainda nao existem

### Testes

Precisa de um projeto Supabase separado, com RLS ativo e dados sinteticos. Sem ele, os casos
IT-01 a IT-10 do [plano de testes](test-plan.md) nao tem onde rodar.

Justificativa especifica: o guard em `001_create_financial_schema.js:101` so cria as politicas
RLS se `auth.users` existir. Um PostgreSQL puro **nunca** tera RLS. Testar isolamento de usuario
contra Postgres puro daria um falso positivo — os testes passariam enquanto a barreira real nao
esta presente.

### Homologacao

Preview da Vercel, disparado por pull request para `main`. Requer as mesmas quatro variaveis
configuradas no painel da Vercel, e hoje nenhuma esta.

---

## 6. Checklist de mudanca de ambiente

Ao criar ou destruir um ambiente:

- [ ] `.env.example` correspondente criado e versionado
- [ ] As quatro variaveis do Supabase documentadas
- [ ] `migrations:up` e `migrations:down` verificados no novo alvo
- [ ] RLS confirmado ativo (`select` no `pg_policies`)
- [ ] Isolamento entre dois usuarios exercitado antes de qualquer uso real
- [ ] Nenhuma variavel `NEXT_PUBLIC_` carregando segredo
