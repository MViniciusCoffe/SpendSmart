# Infraestrutura local

A primeira camada de infraestrutura do SpendSmart usa PostgreSQL local em Docker e scripts npm para tornar o ambiente reproduzivel.

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

O arquivo `.env.development` real e local e esta ignorado pelo Git.

## Variaveis locais

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=local_user
POSTGRES_DB=local_db
POSTGRES_PASSWORD=local
DATABASE_URL=postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@$POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DB
```

O `.env.development.example` deve ser copiado para `.env.development` antes de executar os scripts. O valor de `DATABASE_URL` pode ser escrito de forma expandida, como `postgres://local_user:local@localhost:5432/local_db`, caso a ferramenta usada nao expanda referencias entre variaveis.

## Comandos

Subir o banco:

```bash
npm run services:up
```

Aguardar o banco:

```bash
npm run services:wait:database
```

Aplicar migrations pendentes:

```bash
npm run migrations:up
```

Desfazer a ultima migration:

```bash
npm run migrations:down
```

Parar os containers sem remover os dados:

```bash
npm run services:stop
```

Parar e remover containers, rede e volume:

```bash
npm run services:down
```

Iniciar o ambiente completo de desenvolvimento:

```bash
npm run dev
```

O script `run-services.js` sobe o PostgreSQL, aguarda a conexao, aplica as migrations pendentes e inicia o Next.js. Ao receber `SIGINT` ou `SIGTERM`, ele para os servicos locais.

## Estado atual

A migration inicial cria `profiles`, `categories`, `incomes` e `expenses`, alem de constraints e indices. Ela e aplicada automaticamente pelo `npm run dev`.

O nome atual da migration e numerico (`001_create_financial_schema`), por isso o `node-pg-migrate` exibe o aviso `Can't determine timestamp for 001`. A migration funciona, mas novas migrations devem usar nomes com timestamp para evitar esse aviso.

A infraestrutura local usa PostgreSQL puro. Supabase Auth, RLS e variaveis de Preview/Production serao configurados nas etapas de integracao com o Supabase e a Vercel.
