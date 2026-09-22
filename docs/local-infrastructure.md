# Infraestrutura local

A primeira camada de infraestrutura do SpendSmart usa PostgreSQL local em Docker e scripts npm para tornar o ambiente reproduzivel.

## Arquivos

```text
infra/
  compose.yaml
  scripts/
    run-services.js
    wait-for-postgres.js
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

O script `run-services.js` sobe o PostgreSQL, aguarda a conexao e inicia o Next.js. Ao receber `SIGINT` ou `SIGTERM`, ele para os servicos locais.

## Estado atual

A infraestrutura ainda nao executa migrations. O proximo passo sera adicionar migrations versionadas antes de conectar as funcionalidades financeiras ao banco.

A infraestrutura local usa PostgreSQL puro. Supabase Auth, RLS e variaveis de Preview/Production serao configurados nas etapas de integracao com o Supabase e a Vercel.
