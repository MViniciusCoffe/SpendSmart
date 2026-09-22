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

## Decisao adotada

1. Adotar Supabase Auth como unica autenticacao.
2. Adotar Supabase PostgreSQL com RLS.
3. Usar o monolito fullstack Next.js com Pages Router.
4. Preferir acesso direto ao Supabase para operacoes simples.
5. Usar `pages/api/` para regras server-side, integracoes e operacoes que nao devem ocorrer no navegador.
6. Manter o Express legado apenas durante a migracao e remove-lo depois.
7. Usar PostgreSQL local via Docker para desenvolvimento e testes de persistencia.
8. Usar Preview Deployments da Vercel para homologacao e Production para a branch `main`.

Essa decisao foi registrada em 2026-09-22. O uso de `pages/api/` nao significa que todas as operacoes precisarao passar por uma API propria.

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
  infra/
    compose.yaml
    scripts/
  supabase/
    migrations/
  tests/
  pages/
    api/
    components/
    lib/
      supabase/
      services/
      validation/
  public/
  .env.development
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

Nao e recomendavel mover o frontend para `frontend/` ou copiar a estrutura inteira do `clone-tabnews`. A arquitetura foi definida, mas a infraestrutura deve ser adicionada em commits pequenos e verificaveis.
