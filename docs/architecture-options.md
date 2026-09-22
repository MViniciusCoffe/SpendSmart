# Opcoes de arquitetura

## Contexto

O projeto tem um frontend Next.js e um backend Express legado. O banco AWS antigo nao esta disponivel. O objetivo e revitalizar o produto com Vercel e Supabase sem carregar os problemas de autenticacao e autorizacao da aplicacao antiga.

## Opcao A: Next.js + Supabase direto

```text
Navegador
  |
  v
Next.js na Vercel
  |
  +-- Supabase Auth
  +-- Supabase Database com RLS
```

### Vantagens

- Menor quantidade de aplicacoes para operar.
- Supabase Auth resolve cadastro, login, sessao e logout.
- RLS aplica isolamento no banco.
- Deploy simples na Vercel.
- O Express legado pode ser aposentado depois do inventario.

### Riscos e cuidados

- As regras de negocio precisam ficar bem organizadas em uma camada de servicos no frontend/server.
- Operacoes privilegiadas nao podem usar a chave service role no navegador.
- Agregacoes complexas podem exigir funcoes SQL ou rotas server-side.
- A politica RLS precisa ser testada com mais de um usuario.

### Quando escolher

E a opcao recomendada para o tamanho atual do SpendSmart, desde que o produto nao precise de processamento de longa duracao, filas ou integracoes privadas complexas.

## Opcao B: Next.js + Route Handlers/API do proprio Next.js

```text
Navegador
  |
  v
Next.js na Vercel
  |
  +-- Route Handlers
       +-- Supabase Auth/Server client
       +-- Supabase Database
```

### Vantagens

- Mantem uma camada server-side para validacao e regras de negocio.
- Evita CORS entre frontend e backend.
- Continua com um unico deploy.
- Facilita esconder operacoes que nao devem ocorrer no navegador.

### Riscos e cuidados

- Exige migrar o Pages Router atual ou adicionar endpoints de forma compatível.
- Route Handlers na Vercel sao serverless; nao devem depender de estado em memoria.
- Ainda e necessario configurar corretamente a sessao do Supabase no servidor.

### Quando escolher

Boa opcao se as regras de negocio crescerem, mas ainda nao justificarem um servico Express separado.

## Opcao C: Next.js + Express separado

```text
Navegador -> Vercel/Next.js -> API Express -> Supabase PostgreSQL
                                      |
                                      +-- Supabase Auth ou validacao de token
```

### Vantagens

- Fronteira clara entre frontend e backend.
- Boa opcao para regras de negocio reutilizadas por outros clientes.
- Facilita evoluir a API sem depender do ciclo de deploy do frontend.

### Custos

- Dois deploys e dois conjuntos de variaveis.
- CORS, observabilidade e erros de rede entre servicos.
- O Express precisa validar o token do Supabase; nao deve criar um segundo sistema de usuarios.
- A Vercel nao deve ser tratada como servidor Node persistente sem adaptar o app para serverless.

### Quando escolher

Somente se houver necessidade concreta de API independente, jobs, integracoes privadas ou futuros clientes alem do frontend web.

## Recomendacao

1. Adotar Supabase Auth como unica autenticacao.
2. Adotar Supabase PostgreSQL com RLS.
3. Comecar com Next.js + Supabase direto ou uma camada de servicos server-side pequena.
4. Manter o Express legado apenas durante o inventario e a migracao.
5. Reavaliar Route Handlers se as regras de negocio deixarem de ser simples.

A escolha final deve ser registrada neste documento depois da discussao e antes de criar migrations da aplicacao nova.

## Estrutura de pastas recomendada

### Estrutura de transicao

Esta e a estrutura adequada para o momento atual, antes de reorganizar o backend:

```text
spendsmart/
  docs/
    api-inventory.md
    database-schema.md
    architecture-options.md
    backend-restructure.md
  pages/
  public/
  backend/
    app.js
    package.json
    src/
  package.json
  README.md
```

### Estrutura alvo sem Express

```text
spendsmart/
  docs/
  pages/
    api/                 # somente se Route Handlers forem adotados
    components/
    lib/
      supabase/
      services/
      validation/
  public/
  supabase/
    migrations/
    seed.sql
  .env.example
  package.json
  README.md
```

### Estrutura alvo com backend separado

```text
spendsmart/
  docs/
  frontend/
    pages/
    public/
    package.json
  backend/
    src/
      config/
      controllers/
      middlewares/
      routes/
      services/
      repositories/
      validators/
      app.js
      server.js
    package.json
  supabase/
    migrations/
    seed.sql
  package.json
  README.md
```

Nao e recomendavel mover o frontend para `frontend/` e reorganizar o Express no mesmo commit. Primeiro documentar, depois decidir a arquitetura, depois fazer uma movimentacao mecanica, e somente entao refatorar comportamento.
