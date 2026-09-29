# Ambientes

Matriz de ambientes e de variaveis de ambiente. Este documento e a referencia unica: o
`README.md` e os demais arquivos da pasta `docs/` nao devem repetir esta tabela.

> **Estado atual: ambiente unico e provisorio.** O SpendSmart roda hoje contra um unico projeto
> Supabase que e ao mesmo tempo desenvolvimento, teste manual e producao. A separacao
> definitiva esta em construcao — ver issue
> [#20](https://github.com/MViniciusCoffe/SpendSmart/issues/20).

---

## 1. Matriz de ambientes

| Ambiente            | Banco                        | Vercel          | Finalidade                   | Estado                                        |
| ------------------- | ---------------------------- | --------------- | ---------------------------- | --------------------------------------------- |
| **Desenvolvimento** | Supabase remoto (provisorio) | nao             | Trabalho local, migrations   | Ativo, misturado com producao                 |
| **Producao**        | Supabase remoto (provisorio) | sim (`main`)    | Uso real                     | Ativo, e o **mesmo** banco do desenvolvimento |
| **Preview**         | Supabase remoto (provisorio) | sim, por branch | Revisao antes de producao    | Ativo, com as **mesmas** variaveis            |
| **Testes**          | —                            | —               | Suite automatizada           | **Nao existe**                                |
| **Local (Docker)**  | PostgreSQL 16                | nao             | Schema, constraints, indices | Ativo, mas **nao usado** — ver §4             |

Preview e Production existem; o que nao existe e um banco separado para qualquer um dos dois.

### O modelo de deploy da Vercel

O projeto esta conectado a Vercel e publicado em <https://spend-smart-lilac.vercel.app/>. A Vercel
nao usa GitHub Actions: ela tem o proprio pipeline, e o que aparece no repositorio GitHub sao
_checagens_ (checks) reportando o resultado do build, nao arquivos de workflow. Os dois
`.github/workflows/` deste repositorio — `test.yml` e `lint.yml` — sao do GitHub Actions e nao tem
relacao com a Vercel.

A Vercel decide o que buildar a partir do nome da branch:

| Branch         | Resultado                                                 |
| -------------- | --------------------------------------------------------- |
| `main`         | **Production**, no dominio `spend-smart-lilac.vercel.app` |
| Qualquer outra | **Preview**, em URL propria por commit ou branch          |

O repositorio e **publico** no GitHub. Isso tem uma implicacao que vale registrar: qualquer pessoa
pode conectar o proprio repositorio e fazer um deploy proprio do codigo. As variaveis de ambiente
nao vazam com isso — elas vivem no painel da Vercel, nao no repositorio — mas o codigo-fonte e a
aplicacao ficam acessiveis a terceiros.

---

## 2. Variaveis por ambiente

| Variavel                                                                              | Onde e lida                                                    | Dev | Preview | Producao |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------- | --- | ------- | -------- |
| `NEXT_PUBLIC_SUPABASE_URL`                                                            | `infra/supabase.js:3`                                          | sim | sim     | sim      |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`                                                | `infra/supabase.js:4`                                          | sim | sim     | sim      |
| `SUPABASE_SERVICE_ROLE_KEY`                                                           | `pages/api/createProfile.js:6`, `pages/api/deleteAccount.js:6` | sim | sim     | sim      |
| `DATABASE_URL`                                                                        | `infra/scripts/wait-for-postgres.js:12`, `node-pg-migrate`     | sim | nao     | nao      |
| `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_DB`, `POSTGRES_PASSWORD` | `infra/compose.yaml`                                           | nao | nao     | nao      |

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

| Arquivo                    | Versionado | Conteudo atual                                       | Para que serve                                             |
| -------------------------- | ---------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| `.env.development`         | nao        | `DATABASE_URL` (Supabase remoto) + 3 chaves          | Fonte do Next.js em desenvolvimento e do `node-pg-migrate` |
| `.env.supabase`            | nao        | `DATABASE_URL` (Supabase remoto) + 2 chaves publicas | Alimenta `npm run migrations:supabase:up`                  |
| `.env.development.example` | sim        | So `POSTGRES_*` do Docker                            | Modelo do Postgres local                                   |

O `.gitignore` bloqueia `.env*` e libera apenas os arquivos `.example`. Isso esta correto e deve
permanecer.

### Lacunas conhecidas

1. **`.env.supabase` nao tem `SUPABASE_SERVICE_ROLE_KEY`.** Se ele virar a fonte das rotas de
   API em algum momento, elas vao falhar sem erro claro.
2. **Nao existe `.env.example` generico** com as quatro variaveis do Supabase.
3. **`migrations:supabase:up` nao aparece em nenhum documento.** Era este o unico comando de
   migracao descrito no `README.md` antes desta revisao.
4. **Nao ha separacao de variaveis entre Production e Preview.** As duas usam o mesmo conjunto, e
   esse conjunto e o mesmo do `.env.development` local, incluindo `SUPABASE_SERVICE_ROLE_KEY`. Ver
   a subsecao seguinte.
5. **`.env.development.example:6` tem `DATABASE_URL` com variaveis nao expandidas.** O valor e
   `postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@...`, e nem o `dotenv` 16 nem o `pg` expandem
   `$VAR` dentro de uma connection string — so o `dotenv-expand` faria, e ele nao esta instalado.
   Quem copiar o exemplo tera falha de conexao com a string literal. O valor tem de ser escrito
   expandido: `postgres://local_user:local@localhost:5432/local_db`.

### O que a Vercel tem hoje, e o que isso significa

O painel da Vercel esta configurado com o **mesmo conjunto de variaveis** do `.env.development`
local, incluindo `SUPABASE_SERVICE_ROLE_KEY`. Nao ha separacao: Production, Preview e o
desenvolvimento local apontam para o mesmo projeto Supabase provisorio.

Isso e aceitavel enquanto o banco for provisorio e o app nao receber dados reais, por dois motivos
praticos. O primeiro e que `.env.development` nao tem `DATABASE_URL` utilizavel pela Vercel — a
migracao roda no container, nao no servidorless, entao a variavel nao viaja. O segundo e mais
importante: **qualquer Preview passa a ser um endpoint com acesso de servico ao banco de
producao**. Uma Preview e criada por branch, e branch e algo que qualquer um pode abrir neste
repositorio publico. O `SUPABASE_SERVICE_ROLE_KEY` nao fica exposto no bundle do navegador, mas
`pages/api/createProfile.js` e `pages/api/deleteAccount.js` leem essa chave no servidor e ficam
alcancaveis no dominio da Preview. Um deploy de Preview consegue criar e apagar contas no banco
real.

E por isso que a correcao de `createProfile` (#29) e urgente, e nao cosmeticamente urgente: ela
troca o uso de `service_role` com `id` vindo do corpo por validacao de sessao. Uma Preview nao
deveria poder apagar conta de terceiros por meio de um endpoint publico.

O que separa isso, na ordem:

1. Remover a chave de servico do escopo da Preview, ou reduzir o escopo das rotas de API.
2. Corrigir #29, para que nenhuma rota dependa de `id` fornecido pelo cliente.
3. Ter um projeto Supabase separado, com a issue [#20](https://github.com/MViniciusCoffe/SpendSmart/issues/20).

Ate la, Preview e producao sao o mesmo sistema. Tratar qualquer branch nova como se fosse um
ambiente de teste e um erro: **e** um ambiente de teste, e o teste usa o banco real.

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

**Ja existe, e nao e um ambiente isolado.** A Vercel cria Preview automaticamente para qualquer
branch que nao seja `main`, entao a revisao antes de producao acontece em uma URL por branch. O
problema e que essa Preview nao e um homologacao: ela usa as mesmas variaveis e o mesmo banco da
producao. Ver a secao "O que a Vercel tem hoje, e o que isso significa" em §3.

Uma Preview que aponta para o banco real e util para revisar **interface**, e nao serve para
revisar **dados**: nao ha como popular um banco de teste, porque nao ha banco de teste, e nao ha
como limpar o que um teste de tela sujar.

---

## 6. Checklist de mudanca de ambiente

Ao criar ou destruir um ambiente:

- [ ] `.env.example` correspondente criado e versionado
- [ ] As quatro variaveis do Supabase documentadas
- [ ] `migrations:up` e `migrations:down` verificados no novo alvo
- [ ] RLS confirmado ativo (`select` no `pg_policies`)
- [ ] Isolamento entre dois usuarios exercitado antes de qualquer uso real
- [ ] Nenhuma variavel `NEXT_PUBLIC_` carregando segredo
