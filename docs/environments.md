# Ambientes

Matriz de ambientes e de variáveis de ambiente. Este documento é a referência única: o
`README.md` e os demais arquivos da pasta `docs/` não devem repetir esta tabela.

> **Estado atual: ambiente único e provisório.** O SpendSmart roda hoje contra um único projeto
> Supabase que é ao mesmo tempo desenvolvimento, teste manual e produção. A separação
> definitiva está em construção — ver issue
> [#20](https://github.com/MViniciusCoffe/SpendSmart/issues/20).

---

## 1. Matriz de ambientes

| Ambiente            | Banco                        | Vercel          | Finalidade                   | Estado                                        |
| ------------------- | ---------------------------- | --------------- | ---------------------------- | --------------------------------------------- |
| **Desenvolvimento** | Supabase remoto (provisório) | não             | Trabalho local, migrations   | Ativo, misturado com produção                 |
| **Produção**        | Supabase remoto (provisório) | sim (`main`)    | Uso real                     | Ativo, e o **mesmo** banco do desenvolvimento |
| **Preview**         | Supabase remoto (provisório) | sim, por branch | Revisão antes de produção    | Ativo, com as **mesmas** variáveis            |
| **Testes**          | —                            | —               | Suite automatizada           | **Não existe**                                |
| **Local (Docker)**  | PostgreSQL 16                | não             | Schema, constraints, índices | Ativo, mas **não usado** — ver §4             |

Preview e Production existem; o que não existe é um banco separado para qualquer um dos dois.

### O modelo de deploy da Vercel

O projeto está conectado a Vercel e publicado em <https://spend-smart-lilac.vercel.app/>. A Vercel
não usa GitHub Actions: ela tem o próprio pipeline, e o que aparece no repositório GitHub são
_checagens_ (checks) reportando o resultado do build, não arquivos de workflow. Os dois
`.github/workflows/` deste repositório — `test.yml` e `lint.yml` — são do GitHub Actions e não têm relação com a Vercel.

A Vercel decide o que buildar a partir do nome da branch:

| Branch         | Resultado                                                 |
| -------------- | --------------------------------------------------------- |
| `main`         | **Production**, no domínio `spend-smart-lilac.vercel.app` |
| Qualquer outra | **Preview**, em URL própria por commit ou branch          |

O repositório é **público** no GitHub. Isso tem uma implicação que vale registrar: qualquer pessoa
pode conectar o próprio repositório e fazer um deploy próprio do código. As variáveis de ambiente
não vazam com isso — elas vivem no painel da Vercel, não no repositório — mas o código-fonte e a
aplicação ficam acessíveis a terceiros.

---

## 2. Variáveis por ambiente

| Variável                                                                              | Onde é lida                                                    | Dev | Preview | Produção |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------- | --- | ------- | -------- |
| `NEXT_PUBLIC_SUPABASE_URL`                                                            | `infra/supabase.js:3`                                          | sim | sim     | sim      |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`                                                | `infra/supabase.js:4`                                          | sim | sim     | sim      |
| `SUPABASE_SERVICE_ROLE_KEY`                                                           | `pages/api/createProfile.js:6`, `pages/api/deleteAccount.js:6` | sim | sim     | sim      |
| `DATABASE_URL`                                                                        | `infra/scripts/wait-for-postgres.js:12`, `node-pg-migrate`     | sim | não     | não      |
| `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_DB`, `POSTGRES_PASSWORD` | `infra/compose.yaml`                                           | não | não     | não      |

### Sobre o nome da chave pública

A variável chama-se `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. O Supabase renomeou a antiga
`anon` para `publishable`; a troca no código ocorreu no commit `e70e163`. O nome antigo
`ANON_KEY` não funciona e não deve ser usado.

### Sobre a chave de serviço

`SUPABASE_SERVICE_ROLE_KEY` **não pode ter prefixo `NEXT_PUBLIC_`**. Com esse prefixo ela seria
embutida no bundle enviado ao navegador, e qualquer visitante poderia ler dados de qualquer
usuário, além de poder criar e excluir contas. Ela só pode ser lida dentro de `pages/api/*`,
que roda no servidor. Há dois pontos de leitura hoje: `createProfile` e `deleteAccount`.

---

## 3. Arquivos de ambiente

| Arquivo                    | Versionado | Conteúdo atual                                       | Para que serve                                             |
| -------------------------- | ---------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| `.env.development`         | não        | `DATABASE_URL` (Supabase remoto) + 3 chaves          | Fonte do Next.js em desenvolvimento e do `node-pg-migrate` |
| `.env.supabase`            | não        | `DATABASE_URL` (Supabase remoto) + 2 chaves públicas | Alimenta `npm run migrations:supabase:up`                  |
| `.env.development.example` | sim        | Só `POSTGRES_*` do Docker                            | Modelo do Postgres local                                   |

O `.gitignore` bloqueia `.env*` e libera apenas os arquivos `.example`. Isso está correto e deve
permanecer.

### Lacunas conhecidas

1. **`.env.supabase` não tem `SUPABASE_SERVICE_ROLE_KEY`.** Se ele virar a fonte das rotas de
   API em algum momento, elas vão falhar sem erro claro.
2. **Não existe `.env.example` genérico** com as quatro variáveis do Supabase.
3. **`migrations:supabase:up` não aparece em nenhum documento.** Era este o único comando de
   migração descrito no `README.md` antes desta revisão.
4. **Não há separação de variáveis entre Production e Preview.** As duas usam o mesmo conjunto, e
   esse conjunto é o mesmo do `.env.development` local, incluindo `SUPABASE_SERVICE_ROLE_KEY`. Ver
   a subseção seguinte.
5. **`.env.development.example:6` tem `DATABASE_URL` com variáveis não expandidas.** O valor é
   `postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@...`, e nem o `dotenv` 16 nem o `pg` expandem
   `$VAR` dentro de uma connection string — só o `dotenv-expand` faria, e ele não está instalado.
   Quem copiar o exemplo terá falha de conexão com a string literal. O valor tem de ser escrito
   expandido: `postgres://local_user:local@localhost:5432/local_db`.

### O que a Vercel tem hoje, e o que isso significa

O painel da Vercel está configurado com o **mesmo conjunto de variáveis** do `.env.development`
local, incluindo `SUPABASE_SERVICE_ROLE_KEY`. Não há separação: Production, Preview e o
desenvolvimento local apontam para o mesmo projeto Supabase provisório.

Isso é aceitável enquanto o banco for provisório e o app não receber dados reais, por dois motivos
práticos. O primeiro é que o `.env.development` não tem `DATABASE_URL` utilizável pela Vercel — a
migração roda no container, não no serverless, então a variável não viaja. O segundo é mais
importante: **qualquer Preview passa a ser um endpoint com acesso de serviço ao banco de
produção**. Uma Preview é criada por branch, e branch é algo que qualquer um pode abrir neste
repositório público. O `SUPABASE_SERVICE_ROLE_KEY` não fica exposto no bundle do navegador, mas
`pages/api/createProfile.js` e `pages/api/deleteAccount.js` leem essa chave no servidor e ficam
alcançáveis no domínio da Preview. Um deploy de Preview consegue criar e apagar contas no banco
real.

É por isso que a correção de `createProfile` (#29) é urgente, e não cosmeticamente urgente: ela
troca o uso de `service_role` com `id` vindo do corpo por validação de sessão. Uma Preview não
deveria poder apagar conta de terceiros por meio de um endpoint público.

O que separa isso, na ordem:

1. Remover a chave de serviço do escopo da Preview, ou reduzir o escopo das rotas de API.
2. Corrigir #29, para que nenhuma rota dependa de `id` fornecido pelo cliente.
3. Ter um projeto Supabase separado, com a issue [#20](https://github.com/MViniciusCoffe/SpendSmart/issues/20).

Até lá, Preview e produção são o mesmo sistema. Tratar qualquer branch nova como se fosse um
ambiente de teste é um erro: **é** um ambiente de teste, e o teste usa o banco real.

---

## 4. O problema do `npm run dev`

`package.json:7` define `dev` como `node infra/scripts/run-services.js`. Esse script executa, em
ordem:

```text
npm run services:up              sobe o PostgreSQL do Docker
npm run services:wait:database    lê DATABASE_URL e espera a conexão
npm run migrations:up             aplica migrations
npm run next:dev                  sobe o Next.js
```

O passo 2 é o problema. `wait-for-postgres.js:12` lê `DATABASE_URL` de `.env.development`, que
hoje aponta para o Supabase remoto. Portanto, o container do Docker sobe, o script se conecta ao
**banco remoto**, aplica as migrations **nele** e só então inicia o Next.js.

Consequências práticas:

- O PostgreSQL do Docker nunca é usado. Ele sobe e fica ocioso.
- Qualquer migration nova é aplicada no banco real assim que `npm run dev` roda.
- O `migrations:up` da documentação local descreve um comportamento que não ocorre.

### Como confirmar em qual banco você está

Sem conectar, confira o host em `.env.development`:

```bash
node -e "console.log(new URL(require('fs').readFileSync('.env.development','utf8').split('\n').find(l=>l.startsWith('DATABASE_URL')).split('=').slice(1).join('=')).host)"
```

Um host `*.supabase.com` significa banco remoto. `localhost` significa Postgres local.

### Direção planejada

1. Mover o `DATABASE_URL` remoto para `.env.supabase`, deixando `.env.development` só com as
   variáveis do Postgres local e as duas chaves públicas.
2. Tirar `migrations:up` do encadeamento automático, ou exigir flag explícita.
3. Completar `.env.development.example` com `NEXT_PUBLIC_SUPABASE_URL` e
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
4. Criar `.env.supabase.example` com `SUPABASE_SERVICE_ROLE_KEY` vazia.
5. Adicionar `migrations:supabase:down`, hoje inexistente.

Enquanto isso não for feito, **trate `npm run dev` como um comando que escreve no banco de
produção.**

---

## 5. Ambientes que ainda não existem

### Testes

Precisa de um projeto Supabase separado, com RLS ativo e dados sintéticos. Sem ele, os casos
IT-01 a IT-10 do [plano de testes](test-plan.md) não têm onde rodar.

Justificativa específica: o guard em `001_create_financial_schema.js:101` só cria as políticas
RLS se `auth.users` existir. Um PostgreSQL puro **nunca** terá RLS. Testar isolamento de usuário
contra Postgres puro daria um falso positivo — os testes passariam enquanto a barreira real não
está presente.

### Homologação

**Já existe, e não é um ambiente isolado.** A Vercel cria Preview automaticamente para qualquer
branch que não seja `main`, então a revisão antes de produção acontece em uma URL por branch. O
problema é que essa Preview não é uma homologação: ela usa as mesmas variáveis e o mesmo banco da
produção. Ver a seção "O que a Vercel tem hoje, e o que isso significa" em §3.

Uma Preview que aponta para o banco real é útil para revisar **interface**, e não serve para
revisar **dados**: não há como popular um banco de teste, porque não há banco de teste, e não há
como limpar o que um teste de tela sujar.

---

## 6. Checklist de mudança de ambiente

Ao criar ou destruir um ambiente:

- [ ] `.env.example` correspondente criado e versionado
- [ ] As quatro variáveis do Supabase documentadas
- [ ] `migrations:up` e `migrations:down` verificados no novo alvo
- [ ] RLS confirmado ativo (`select` no `pg_policies`)
- [ ] Isolamento entre dois usuários exercitado antes de qualquer uso real
- [ ] Nenhuma variável `NEXT_PUBLIC_` carregando segredo
