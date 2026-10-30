# SpendSmart

Aplicação web pessoal de controle financeiro: receitas, despesas, categorias, saldo e dashboard.

O projeto atende a disciplina de **Testes de Software** do Bacharelado em Sistemas de Informação
(BSI) da UFRN.

---

## Sobre este repositório

O SpendSmart é um **monolito fullstack Next.js (App Router) com Supabase**, sem servidor HTTP
próprio. As rotas de API são funções serverless em `src/app/api/` (`createProfile`, `deleteAccount`,
`health`, `status`), e não há código de assinatura ou validação de token: a sessão é inteira do
Supabase Auth.

Um backend Node.js/Express existiu até o commit `2599ad9` e foi removido; o front-end migrou de
`pages/` (Pages Router) para `src/app/` (App Router). Tudo aqui descreve o código atual.

---

## Equipe

| Membro                           | Papel                   | GitHub                                                   |
| :------------------------------- | :---------------------- | :------------------------------------------------------- |
| José Samuel Silva Lima           | Gerente / Testador (QA) | [@José-Samuel-Lima](https://github.com/Jose-Samuel-Lima) |
| Marcus Vinícius de Souza Azevedo | Desenvolvedor principal | [@MViniciusCoffe](https://github.com/MViniciusCoffe)     |

---

## Como executar

O passo a passo completo (pré-requisitos e instalação do Docker e do Supabase CLI, variáveis de
ambiente, todas as suítes de teste, problemas comuns) está no
**[Manual de execução](docs/execution-manual.md)**.

Resumo, com Node.js 24+, Docker e Supabase CLI instalados:

```bash
npm install
supabase start                    # sobe Postgres + Auth + RLS + Studio locais
cp .env.local.example .env.local  # preencha com as chaves de 'npm run infra:status'
npm run dev                       # aguarda o Supabase ficar saudável e inicia o Next.js
```

A aplicação responde em `http://localhost:3000`. Para os testes:

```bash
npm test                  # unidade (só Node.js)
npm run test:coverage     # unidade + cobertura
npm run test:integration  # integração com pg-mem (só Node.js)
npm run test:mutation     # testes de mutação (Stryker)
```

### Credenciais Supabase

O nome da chave pública é `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — o Supabase renomeou a antiga
`anon` para `publishable`, e `ANON_KEY` não é mais válido.

`SUPABASE_SERVICE_ROLE_KEY` **não pode** ter prefixo `NEXT_PUBLIC_`. Com esse prefixo ela vira
parte do bundle enviado ao navegador e qualquer visitante ganha acesso à conta inteira. Ela só é
lida dentro de `src/app/api/`.

---

## Estrutura

```text
SpendSmart/
  src/
    app/            páginas (App Router): dashboard, transactions, categories, settings,
                    login, register, about, contact, status
      api/          rotas serverless: createProfile, deleteAccount, health, status
    components/
      ui/           design system: Button, Input, Card, Table, Tabs, Dropdown, ChartContainer...
      forms/        TransactionForm, CategoryForm
      feedback/     Toast, ConfirmDialog, EmptyState, LoadingSpinner, RouteError
      layout/       Header, Footer, PageContainer/PageHeader, AuthShell (login e cadastro)
      withAuth.js   guarda das páginas privadas
    contexts/       AuthContext (sessão e usuário) e ToastContext
    services/       camada de negócio: validação, tradução de domínio, mapeamento de erros
    lib/            cliente Supabase (supabase.js), formatadores (utils/format.js), config
    styles/         globals.css e design-tokens.css (variáveis de cor, espaço, raio, sombra...)
  supabase/migrations/   schema do banco (node-pg-migrate)
  infra/          Docker Compose do Postgres puro
  tests/          suíte Jest — ver o estado real abaixo
  docs/           documentação
```

A separação de responsabilidades adotada:

| Camada       | Arquivo               | Responsabilidade                                                     |
| :----------- | :-------------------- | :------------------------------------------------------------------- |
| Interface    | `src/app/`            | React, validação de formulário, chamada ao service                   |
| Componentes  | `src/components/`     | UI reutilizável; CSS Modules com os tokens de `design-tokens.css`    |
| Sessão       | `src/contexts/`       | `AuthContext` é a fonte única do usuário logado (Header, `withAuth`) |
| Negócio      | `src/services/`       | Regra de negócio, tradução PT/EN, mensagem de erro em português      |
| Cliente      | `src/lib/supabase.js` | Instância única do `createClient`                                    |
| Privilegiado | `src/app/api/`        | Único lugar que lê `SUPABASE_SERVICE_ROLE_KEY`                       |

---

## Regras que não se negociam

1. **Supabase Auth é a única autenticação.** Não introduzir JWT próprio, cookie de sessão manual
   nem comparação de senha em SQL.
2. **`user_id` vem sempre da sessão, nunca do corpo da requisição.** referência:
   os `.eq("user_id", session.user.id)` de `src/services/categoryService.js` e
   `src/services/transactionService.js`.
3. **RLS é a última barreira, não a única.** Filtrar por `user_id` em toda leitura e escrita, além
   da política.
4. **Dinheiro é `numeric(12,2)` com `check (amount > 0)`.** Nunca float.
5. **`type` aceita apenas `income` ou `expense` no banco.** A tradução para receita/despesa
   acontece só na fronteira do service.
6. **Nunca concatenar input em SQL.**
7. **Exclusão é lógica (`deleted_at`).** Uma categoria com transações pode ser excluída (US-009):
   as transações continuam no histórico e no dashboard, exibindo a categoria como "Nome (deletada)",
   e a categoria pode ser restaurada. Mudar o tipo de uma categoria com transações pede confirmação
   e propaga o tipo às transações (CA-008.03).
8. **Sem `alert`/`confirm`.** Feedback por toast e confirmações pelo `ConfirmDialog`.

---

## Estado real do projeto

| Item                                        | Estado                                                                                               |
| :------------------------------------------ | :--------------------------------------------------------------------------------------------------- |
| Cadastro, login, logout, perfil             | Funcionando                                                                                          |
| Categorias: criar, listar, alterar, excluir | Funcionando, com exclusão lógica, contagem de usos e restauração                                     |
| Transações: criar, listar, editar, excluir  | Funcionando — uma página com abas, seleção de linha e ações no cabeçalho da tabela                   |
| Dashboard com gráficos                      | Funcionando                                                                                          |
| Excluir conta                               | Funcionando                                                                                          |
| Interface                                   | Toda em português, tema escuro, valores em R$ e datas em dd/mm/aaaa                                  |
| Testes de unidade                           | **188 testes, 100% de linhas, ramos e funções em `src/services/`**                                   |
| Testes de integração (pg-mem)               | **5 suítes, 28 testes** (constraints, FK, unicidade)                                                 |
| Testes de integração (Supabase/RLS)         | **1 suíte, 17 testes** (`tests/integration/supabase/rls.test.js`) — isolamento real entre 2 usuários |
| Testes de regressão                         | **5 suítes, 27 testes** (issues #10, #21, #32, data no fuso, categoria excluída/tipo)                |
| `npm test`                                  | **Passa** — 188/188                                                                                  |
| Build de produção (`next build`)            | **Passa** — 15 rotas                                                                                 |
| CI no GitHub Actions                        | **4 workflows** — `test.yml` (com job de RLS), `lint.yml`, `sonar.yml`, `mutation.yml`               |
| RLS aplicado e validado                     | **Validado** via `tests/integration/supabase/rls.test.js` (requer `supabase start` + `.env.local`)   |
| Testes de front-end                         | **Não existem** — `src/app/` e `src/components/` sem cobertura automatizada (issue #33)              |
| Ambientes separados                         | **Não existem** — um único banco para tudo (issue #20)                                               |

### Defeitos conhecidos

| #                                                             | Problema                                                                             |
| :------------------------------------------------------------ | :----------------------------------------------------------------------------------- |
| [#24](https://github.com/MViniciusCoffe/SpendSmart/issues/24) | Rotas privadas sem proteção no servidor e sem headers de segurança                   |
| [#20](https://github.com/MViniciusCoffe/SpendSmart/issues/20) | Desenvolvimento, Preview e Produção usam o mesmo projeto Supabase                    |
| —                                                             | `AuthContext` não escuta mudanças de sessão; expiração só é detectada pelos serviços |

Corrigidos no código atual (podem ser fechados no GitHub): #6 e #7 (páginas unificadas e
componentizadas), #13 (toasts no lugar de `alert`), #22
(navbar duplicada), #23 (rotas públicas), #32 (valor com vírgula e separador de milhar) e #43
(senha mínima no cadastro).

### Sobre o RLS

As políticas só são criadas quando `auth.users` existe
(`supabase/migrations/1790304277000_create_financial_schema.sql:58`). No
PostgreSQL local (Docker Compose) essa tabela não existe, portanto **o RLS não é aplicado ali**.
Com **Supabase CLI** (`supabase start`), o RLS é real e o isolamento entre dois usuários **é testado**
em `tests/integration/supabase/rls.test.js` (17 testes cobrindo leitura/escrita cross-user).
O teste requer `.env.local` preenchido e `supabase start` rodando — não roda no CI GitHub Actions.

---

## Documentação

Cada assunto tem um único documento canônico. Não há duas fontes para o mesmo fato.

Os identificadores RF01 a RF16, RNF01 a RNF07 e US-001 a US-016 vêm dos documentos da disciplina.
As versões `.docx` desses documentos não são versionadas: o conteúdo relevante está reescrito nos
arquivos abaixo, em Markdown.

### Requisitos e testes

| Documento                                                             | Conteúdo                                                                             |
| :-------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| [Documento de Visão](docs/vision.md)                                  | Escopo, personas, RF01-RF16, RNF01-RNF07, riscos e equipe                            |
| [User Stories](docs/user-stories.md)                                  | `US-001` a `US-016`, derivadas de RF01 a RF16, com critérios de aceitação            |
| [Plano de testes](docs/test-plan.md)                                  | Níveis de teste, 10 casos de integração, matriz US/RF, riscos, papéis                |
| [Plano de teste das iterações 1, 2 e 3](docs/test-plan-iterations.md) | 31 casos de teste com passos, dados de entrada, resultado esperado e sintaxe Gherkin |
| [Testes de mutação](docs/mutation-testing.md)                         | Stryker em `services/`: score 97,10%, evolução por rodada e mutantes aceitos         |
| [Estado atual dos testes](docs/test-state-report.md)                  | Registro histórico do diagnóstico inicial dos testes (estado atual: seção acima)     |

### Planejamento de iterações

| Documento                                    | Conteúdo                                                             |
| :------------------------------------------- | :------------------------------------------------------------------- |
| [Plano de iterações](docs/iteration-plan.md) | 6 iterações no semestre, com distribuição de US por membro e período |
| [Plano da iteração 1](docs/iteration-1.md)   | Tarefas detalhadas, cronograma e critérios de entrada/saída (I1)     |

### Arquitetura e dados

| Documento                                             | Conteúdo                                                                       |
| :---------------------------------------------------- | :----------------------------------------------------------------------------- |
| [Esquema do banco](docs/database-schema.md)           | Tabelas, constraints, índices, 3FN, RLS, limites conhecidos                    |
| [Opções de arquitetura](docs/architecture-options.md) | ADR de 2026-09-22: as opções avaliadas e a adotada                             |
| [Migrações futuras](docs/future-migrations.md)        | Propostas em SQL para `profiles` em inglês, `updated_at` e coerência de `type` |
| [Infraestrutura local](docs/local-infrastructure.md)  | Docker Compose, comandos e o que o Postgres local não valida                   |

### Operação

| Documento                                           | Conteúdo                                                                      |
| :-------------------------------------------------- | :---------------------------------------------------------------------------- |
| [Manual de execução](docs/execution-manual.md)      | Instalação, configuração, execução da aplicação e de todas as suítes de teste |
| [Ambientes](docs/environments.md)                   | Matriz de ambientes, variáveis, o problema do `npm run dev`                   |
| [SonarQube](docs/sonarqube.md)                      | Análise estática no LABENS: escopo medido, cobertura, resultado e pendências  |
| [Decisões de ferramenta](docs/tooling-decisions.md) | Por que cada versão foi escolhida: ESLint 9, Jest, Husky, escopo do Sonar     |

## Scripts principais

| Script                     | Comando                            | Quando usar                                |
| -------------------------- | ---------------------------------- | ------------------------------------------ |
| `npm run dev`              | `concurrently infra:up + next:dev` | **Padrão** — desenvolvimento diário        |
| `npm run infra:up`         | `supabase start`                   | Só sobe infra (já tem `.env.local`)        |
| `npm run next:dev`         | `next dev`                         | Next.js só (infra já rodando)              |
| `npm run infra:down`       | `supabase stop`                    | Para infra                                 |
| `npm run infra:reset`      | `supabase db reset`                | Recria banco + migrations                  |
| `npm run infra:studio`     | `supabase studio`                  | Abre dashboard local                       |
| `npm run infra:status`     | `supabase status`                  | Mostra URLs e chaves                       |
| `npm run services:up`      | `docker compose up -d`             | Postgres puro (sem RLS)                    |
| `npm run migrations:up`    | `node-pg-migrate up`               | Aplica migrations (usa `.env.development`) |
| `npm run test`             | `jest tests/unit`                  | Testes unitários                           |
| `npm run test:integration` | `jest integration`                 | Integração pg-mem                          |
| `npm run test:all`         | unit + pg-mem + regressão + RLS    | Todos os testes                            |
| `npm run test:mutation`    | `stryker run`                      | Testes de mutação em `services/`           |

---

## Trabalho acadêmico em andamento

Issues abertas, em ordem de dependência:

| #                                                             | Assunto                          | Bloqueia |
| :------------------------------------------------------------ | :------------------------------- | :------- |
| [#24](https://github.com/MViniciusCoffe/SpendSmart/issues/24) | Proteção server-side e headers   | —        |
| [#20](https://github.com/MViniciusCoffe/SpendSmart/issues/20) | Separar ambientes                | —        |
| [#33](https://github.com/MViniciusCoffe/SpendSmart/issues/33) | Cobertura de front-end           | —        |
| [#30](https://github.com/MViniciusCoffe/SpendSmart/issues/30) | Isolamento por RLS (teste em CI) | #20      |

Resolvidos pela frente de testes, CI e SonarQube: #2, #10, #15, #16, #17, #18, #19, #21, #25, #26, #29, #31.
Resolvidos pela frente de front-end: #6, #7, #13, #22, #23, #32, #43.

---

## Commits

Conventional Commits, em português:

```text
docs:    feat:    fix:    refactor:    test:    chore:
```

Regra dura: **não misturar migração de banco, refactor visual e infra no mesmo commit.** O corpo
do commit explica o _porquê_, não o _o que_. Nenhum commit deve afirmar que algo funciona sem dizer
como foi verificado.
