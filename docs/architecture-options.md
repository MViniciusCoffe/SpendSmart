# Opcoes de arquitetura

> **Registro de decisao (ADR).** Documento de 2026-09-22, preservado como registro do que foi
> avaliado e do que foi decidido. Nao descreve a estrutura de pastas atual — essa esta no
> `README.md`.

## Contexto

O projeto precisava de autenticacao e autorizacao confiaveis sem operacao de backend propria. Foram
avaliadas tres formas de atender a isso. A Opcao A foi adotada; as opcoes B e C nao foram
seguidas.

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
- Nenhuma aplicacao adicional para hospedar ou monitorar.

### Riscos e cuidados

- As regras de negocio precisam ficar bem organizadas em uma camada de servicos no frontend/server.
- Operacoes privilegiadas nao podem usar a chave service role no navegador.
- Agregacoes complexas podem exigir funcoes SQL ou rotas server-side.
- A politica RLS precisa ser testada com mais de um usuario.

### Quando escolher

E a opcao recomendada para o tamanho atual do SpendSmart, desde que o produto nao precise de processamento de longa duracao, filas ou integracoes privadas complexas. **Foi a adotada.**

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

Nao adotada. Boa opcao se as regras de negocio crescerem, mas ainda nao justificarem um servico separado.

## Opcao C: Next.js + backend separado

```text
Navegador -> Vercel/Next.js -> API do backend -> Supabase PostgreSQL
                                          |
                                          +-- Supabase Auth ou validacao de sessao
```

### Vantagens

- Fronteira clara entre frontend e backend.
- Boa opcao para regras de negocio reutilizadas por outros clientes.
- Facilita evoluir a API sem depender do ciclo de deploy do frontend.

### Custos

- Dois deploys e dois conjuntos de variaveis.
- CORS, observabilidade e erros de rede entre servicos.
- O servico separado precisa validar a sessao do Supabase; nao deve criar um segundo sistema de usuarios.
- A Vercel nao deve ser tratada como servidor Node persistente sem adaptar o app para serverless.

### Quando escolher

Nao adotada. Somente se houver necessidade concreta de API independente, jobs, integracoes privadas ou futuros clientes alem do frontend web.

## Decisao adotada

1. Adotar Supabase Auth como unica autenticacao.
2. Adotar Supabase PostgreSQL com RLS.
3. Usar o monolito fullstack Next.js com Pages Router.
4. Preferir acesso direto ao Supabase para operacoes simples.
5. Usar `pages/api/` para regras server-side, integracoes e operacoes que nao devem ocorrer no navegador.
6. Nao manter backend separado. **Feito no commit `2599ad9`.**
7. Usar PostgreSQL local via Docker para desenvolvimento e testes de persistencia.
8. Usar Preview Deployments da Vercel para homologacao e Production para a branch `main`.

Essa decisao foi registrada em 2026-09-22. O uso de `pages/api/` nao significa que todas as operacoes precisam passar por uma API propria.

## Estrutura de pastas

Alem da opcao adotada, foram avaliadas duas estruturas de pastas alternativas em 2026-09-22 —
separar o frontend em `frontend/` com um `backend/` dedicado, e criar `pages/lib/` para
`supabase/`, `services/` e `validation/`. **Nenhuma foi adotada.**

A estrutura real e a seguinte:

```text
SpendSmart/
  pages/            interface React
    api/            createProfile, deleteAccount
  components/       Navbar, estilos globais, guarda de sessao
  services/         camada de negocio
  infra/            cliente Supabase, Docker Compose, scripts
  supabase/migrations/   schema
  tests/            suite Jest
  docs/             documentacao
```

Nao ha `backend/`, e nunca houve `pages/lib/`. Nao mover o frontend para `frontend/`: a
infraestrutura deve entrar em commits pequenos e verificaveis.
