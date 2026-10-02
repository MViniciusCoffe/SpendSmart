# Opções de arquitetura

> **Registro de decisão (ADR).** Documento de 2026-09-22, preservado como registro do que foi
> avaliado e do que foi decidido. Não descreve a estrutura de pastas atual — essa está no
> `README.md`.

## Contexto

O projeto precisava de autenticação e autorização confiáveis sem operação de backend própria. Foram
avaliadas três formas de atender a isso. A Opção A foi adotada; as opções B e C não foram
seguidas.

## Opção A: Next.js + Supabase direto

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

- Menor quantidade de aplicações para operar.
- Supabase Auth resolve cadastro, login, sessão e logout.
- RLS aplica isolamento no banco.
- Deploy simples na Vercel.
- Nenhuma aplicação adicional para hospedar ou monitorar.

### Riscos e cuidados

- As regras de negócio precisam ficar bem organizadas em uma camada de serviços no frontend/server.
- Operações privilegiadas não podem usar a chave service role no navegador.
- Agregações complexas podem exigir funções SQL ou rotas server-side.
- A política RLS precisa ser testada com mais de um usuário.

### Quando escolher

É a opção recomendada para o tamanho atual do SpendSmart, desde que o produto não precise de processamento de longa duração, filas ou integrações privadas complexas. **Foi a adotada.**

## Opção B: Next.js + Route Handlers/API do próprio Next.js

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

- Mantém uma camada server-side para validação e regras de negócio.
- Evita CORS entre frontend e backend.
- Continua com um único deploy.
- Facilita esconder operações que não devem ocorrer no navegador.

### Riscos e cuidados

- Exige migrar o Pages Router atual ou adicionar endpoints de forma compatível.
- Route Handlers na Vercel são serverless; não devem depender de estado em memória.
- Ainda é necessário configurar corretamente a sessão do Supabase no servidor.

### Quando escolher

Não adotada. Boa opção se as regras de negócio crescerem, mas ainda não justificarem um serviço separado.

## Opção C: Next.js + backend separado

```text
Navegador -> Vercel/Next.js -> API do backend -> Supabase PostgreSQL
                                          |
                                          +-- Supabase Auth ou validação de sessão
```

### Vantagens

- Fronteira clara entre frontend e backend.
- Boa opção para regras de negócio reutilizadas por outros clientes.
- Facilita evoluir a API sem depender do ciclo de deploy do frontend.

### Custos

- Dois deploys e dois conjuntos de variáveis.
- CORS, observabilidade e erros de rede entre serviços.
- O serviço separado precisa validar a sessão do Supabase; não deve criar um segundo sistema de usuários.
- A Vercel não deve ser tratada como servidor Node persistente sem adaptar o app para serverless.

### Quando escolher

Não adotada. Somente se houver necessidade concreta de API independente, jobs, integrações privadas ou futuros clientes além do frontend web.

## Decisão adotada

1. Adotar Supabase Auth como única autenticação.
2. Adotar Supabase PostgreSQL com RLS.
3. Usar o monolito fullstack Next.js com Pages Router.
4. Preferir acesso direto ao Supabase para operações simples.
5. Usar `pages/api/` para regras server-side, integrações e operações que não devem ocorrer no navegador.
6. Não manter backend separado. **Feito no commit `2599ad9`.**
7. Usar PostgreSQL local via Docker para desenvolvimento e testes de persistência.
8. Usar Preview Deployments da Vercel para homologação e o de Production para a branch `main`.

Essa decisão foi registrada em 2026-09-22. O uso de `pages/api/` não significa que todas as operações precisam passar por uma API própria.

## Estrutura de pastas

Além da opção adotada, foram avaliadas duas estruturas de pastas alternativas em 2026-09-22 —
separar o frontend em `frontend/` com um `backend/` dedicado, e criar `pages/lib/` para
`supabase/`, `services/` e `validation/`. **Nenhuma foi adotada.**

A estrutura real é a seguinte:

```text
SpendSmart/
  pages/            interface React
    api/            createProfile, deleteAccount
  components/       Navbar, estilos globais, guarda de sessão
  services/         camada de negócio
  infra/            cliente Supabase, Docker Compose, scripts
  supabase/migrations/   schema
  tests/            suíte Jest
  docs/             documentação
```

Não há `backend/`, e nunca houve `pages/lib/`. Não mover o frontend para `frontend/`: a
infraestrutura deve entrar em commits pequenos e verificáveis.
