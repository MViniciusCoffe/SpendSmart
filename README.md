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
npm run dev                       # verifica/sobe a infra e inicia o Next.js
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
    services/       camada de negócio: validação, mapeamento para DTO e de erros
    lib/            cliente Supabase (supabase.js), formatadores (utils/format.js), config
    styles/         globals.css e design-tokens.css (variáveis de cor, espaço, raio, sombra...)
  supabase/migrations/   schema do banco (.sql aplicados pelo Supabase CLI)
  infra/          Docker Compose do Postgres puro
  tests/          suíte Jest — ver o estado real abaixo
  docs/           documentação
```

A separação de responsabilidades adotada:

| Camada       | Arquivo               | Responsabilidade                                                                |
| :----------- | :-------------------- | :------------------------------------------------------------------------------ |
| Interface    | `src/app/`            | React, validação de formulário, chamada ao service                              |
| Componentes  | `src/components/`     | UI reutilizável; CSS Modules com os tokens de `design-tokens.css`               |
| Sessão       | `src/contexts/`       | `AuthContext` é a fonte única do usuário logado (Header, `withAuth`)            |
| Negócio      | `src/services/`       | Regra de negócio, validação, mapeamento para DTO, mensagem de erro em português |
| Cliente      | `src/lib/supabase.js` | Instância única do `createClient`                                               |
| Privilegiado | `src/app/api/`        | Único lugar que lê `SUPABASE_SERVICE_ROLE_KEY`                                  |

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
5. **`type` é `income` ou `expense` do banco até a interface.** O service e os DTOs usam esses
   valores; "Receita" e "Despesa" são só rótulos de exibição nos componentes.
6. **Nunca concatenar input em SQL.**
7. **Exclusão é lógica (`deleted_at`).** Uma categoria com transações pode ser excluída (US-009):
   as transações continuam no histórico e no dashboard, exibindo a categoria como "Nome (deletada)",
   e a categoria pode ser restaurada. Mudar o tipo de uma categoria com transações pede confirmação
   e propaga o tipo às transações (CA-008.03).
8. **Sem `alert`/`confirm`.** Feedback por toast e confirmações pelo `ConfirmDialog`.
9. **`SUPABASE_SERVICE_ROLE_KEY` só no servidor**, sem prefixo `NEXT_PUBLIC_`, lida apenas por
   `src/app/api/_lib/supabaseAdmin.js` e na requisição. Rota de API valida o token antes e nunca
   devolve a mensagem de erro interna ao cliente.
10. **Colunas explícitas nos services** (nem `select("*")` nem `.select()` vazio) e nada carregado de
    outra origem no navegador (a CSP com nonce bloqueia).

As demais convenções de código, com o motivo de cada uma, estão em
[Convenções de código](docs/code-conventions.md).

---

## Estado real do projeto

| Item                                        | Estado                                                                                                                                                                                                                          |
| :------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Cadastro, login, logout, perfil             | Funcionando                                                                                                                                                                                                                     |
| Categorias: criar, listar, alterar, excluir | Funcionando, com exclusão lógica, contagem de usos e restauração                                                                                                                                                                |
| Transações: criar, listar, editar, excluir  | Funcionando — uma página com abas, seleção de linha e ações no cabeçalho da tabela                                                                                                                                              |
| Dashboard com gráficos                      | Funcionando                                                                                                                                                                                                                     |
| Excluir conta                               | Funcionando                                                                                                                                                                                                                     |
| Interface                                   | Toda em português, tema escuro, valores em R$ e datas em dd/mm/aaaa                                                                                                                                                             |
| Testes de unidade                           | **237 testes, 100% de linhas, ramos e funções em `src/services/`**                                                                                                                                                              |
| Testes de integração (pg-mem)               | **4 suítes, 24 testes** (constraints, FK, unicidade)                                                                                                                                                                            |
| Testes de integração (Supabase/RLS)         | **2 suítes, 21 testes** (`rls.test.js`: isolamento real entre 2 usuários; `categoryService.test.js`: o service real autenticado)                                                                                                |
| Testes de regressão                         | **9 suítes, 67 testes** (issues #10, #21, #11, #24, #32, rotas de API, data no fuso, categoria excluída/tipo)                                                                                                                   |
| `npm test`                                  | **Passa** — 210/210                                                                                                                                                                                                             |
| Build de produção (`next build`)            | **Passa** — 15 rotas                                                                                                                                                                                                            |
| CI no GitHub Actions                        | **7 workflows** — `test.yml` (unit, pg-mem, regressão, `npm audit`, RLS), `lint.yml` (com `check:agents`), `sonar.yml`, `mutation.yml`, `codeql.yml`, `deploy.yml` (produção com aprovação) e `release.yml`; Dependabot semanal |
| RLS aplicado e validado                     | **Validado** via `tests/integration/supabase/rls.test.js` (requer `supabase start` + `.env.local`)                                                                                                                              |
| Testes de front-end                         | **E2E com Playwright** (P3): ST-01 (cadastro e login, 5 testes) e auditoria WCAG A/AA das 6 telas (axe), no CI; sem testes de componente (issue #33)                                                                            |
| Ambientes separados                         | **Sim** — Supabase local, projeto de Preview e projeto de Produção ([environments.md](docs/environments.md))                                                                                                                    |

### Defeitos conhecidos

| #                                                             | Problema                                                                                                                                              |
| :------------------------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------- |
| [#67](https://github.com/MViniciusCoffe/SpendSmart/issues/67) | Rotas privadas sem proteção no servidor (a sessão do Supabase fica no `localStorage`)                                                                 |
| [#67](https://github.com/MViniciusCoffe/SpendSmart/issues/67) | `AuthContext` não escuta mudanças de sessão; expiração só é detectada pelos serviços                                                                  |
| [#76](https://github.com/MViniciusCoffe/SpendSmart/issues/76) | Cache de sessão (`baseService.js`) nunca é limpo: logout e login de outro usuário na mesma aba em até 5 min deixam os services com o `user_id` antigo |
| [#75](https://github.com/MViniciusCoffe/SpendSmart/issues/75) | `src/app/settings/page.js` chama `/api/deleteAccount` direto, sem passar por um service                                                               |
| [#77](https://github.com/MViniciusCoffe/SpendSmart/issues/77) | `profileService` fora do padrão: sem `withSession`/`withErrorHandling`, sem filtro de `deleted_at`, sem `profileTypeMap`                              |
| [#75](https://github.com/MViniciusCoffe/SpendSmart/issues/75) | `/api/createProfile` grava com a chave de serviço sem passar pelos validadores                                                                        |

Os quatro últimos foram encontrados por leitura de código (2026-11-03) e ficam para a frente de
testes de front-end e sistema (P3), corrigidos junto com os testes que os cobrem. Os dois da [#75](https://github.com/MViniciusCoffe/SpendSmart/issues/75)
somem com a remoção das rotas privilegiadas (perfil criado por trigger no banco e exclusão por RPC).
Também aberta: [#78](https://github.com/MViniciusCoffe/SpendSmart/issues/78), o tipo da transação garantido pelo banco (IT-07).

Corrigidos no código atual (podem ser fechados no GitHub): #6 e #7 (páginas unificadas e
componentizadas), #13 (toasts no lugar de `alert`), #22
(navbar duplicada), #23 (rotas públicas), #32 (valor com vírgula e separador de milhar) e #43
(senha mínima no cadastro). Na branch `chore/tech-debt`: #8, #11, #20, #24 e #66.

### Sobre o RLS

As políticas só são criadas quando `auth.users` existe
(`supabase/migrations/1790304277000_create_financial_schema.sql:58`). No
PostgreSQL local (Docker Compose) essa tabela não existe, portanto **o RLS não é aplicado ali**.
Com **Supabase CLI** (`supabase start`), o RLS é real e o isolamento entre dois usuários **é testado**
em `tests/integration/supabase/rls.test.js` (12 testes cobrindo leitura/escrita cross-user).
O teste requer `.env.local` preenchido e `supabase start` rodando; no CI, o job `rls` do `test.yml`
executa a suíte contra o Supabase local.

---

## Documentação

Cada assunto tem um único documento canônico. Não há duas fontes para o mesmo fato.

Os identificadores RF01 a RF16, RNF01 a RNF07 e US-001 a US-016 vêm dos documentos da disciplina.
As versões `.docx` desses documentos não são versionadas: o conteúdo relevante está reescrito nos
arquivos abaixo, em Markdown.

### Requisitos e testes

| Documento                                                             | Conteúdo                                                                               |
| :-------------------------------------------------------------------- | :------------------------------------------------------------------------------------- |
| [Documento de Visão](docs/vision.md)                                  | Escopo, personas, RF01-RF16, RNF01-RNF07, riscos e equipe                              |
| [User Stories](docs/user-stories.md)                                  | `US-001` a `US-016`, derivadas de RF01 a RF16, com critérios de aceitação              |
| [Plano de testes](docs/test-plan.md)                                  | Níveis de teste, 10 casos de integração, matriz US/RF, riscos, papéis                  |
| [Plano de teste das iterações 1, 2 e 3](docs/test-plan-iterations.md) | 31 casos de teste com passos, dados de entrada, resultado esperado e sintaxe Gherkin   |
| [Relatório da P3](docs/relatorio-testes-sistema-ia.md)                | E2E (Playwright), teste instrumental por IA, auditoria de usabilidade e acessibilidade |
| [Testes de mutação](docs/mutation-testing.md)                         | Stryker em `services/`: score 97,12%, evolução por rodada e mutantes aceitos           |
| [Estado atual dos testes](docs/test-state-report.md)                  | Registro histórico do diagnóstico inicial dos testes (estado atual: seção acima)       |

### Planejamento de iterações

| Documento                                    | Conteúdo                                                             |
| :------------------------------------------- | :------------------------------------------------------------------- |
| [Plano de iterações](docs/iteration-plan.md) | 6 iterações no semestre, com distribuição de US por membro e período |
| [Plano da iteração 1](docs/iteration-1.md)   | Tarefas detalhadas, cronograma e critérios de entrada/saída (I1)     |

### Arquitetura e dados

| Documento                                             | Conteúdo                                                                       |
| :---------------------------------------------------- | :----------------------------------------------------------------------------- |
| [Convenções de código](docs/code-conventions.md)      | Services, páginas, CSP, rotas de API e o que o `check:agents` bloqueia         |
| [Esquema do banco](docs/database-schema.md)           | Tabelas, constraints, índices, 3FN, RLS, privilégios, limites conhecidos       |
| [Opções de arquitetura](docs/architecture-options.md) | ADR de 2026-09-22: as opções avaliadas e a adotada                             |
| [Migrações futuras](docs/future-migrations.md)        | Propostas em SQL para `profiles` em inglês, `updated_at` e coerência de `type` |
| [Infraestrutura local](docs/local-infrastructure.md)  | Docker Compose, comandos e o que o Postgres local não valida                   |

### Operação

| Documento                                           | Conteúdo                                                                      |
| :-------------------------------------------------- | :---------------------------------------------------------------------------- |
| [Manual de execução](docs/execution-manual.md)      | Instalação, configuração, execução da aplicação e de todas as suítes de teste |
| [Ambientes](docs/environments.md)                   | Matriz de ambientes, variáveis, o problema do `npm run dev`                   |
| [SonarQube](docs/sonarqube.md)                      | Análise estática no LABENS: escopo medido, cobertura, resultado e pendências  |
| [Política de segurança](SECURITY.md)                | Como reportar vulnerabilidade (reporte privado do GitHub) e o escopo          |
| [Decisões de ferramenta](docs/tooling-decisions.md) | Por que cada versão foi escolhida: ESLint 9, Jest, Husky, escopo do Sonar     |

## Scripts principais

| Script                     | Comando                                       | Quando usar                                          |
| -------------------------- | --------------------------------------------- | ---------------------------------------------------- |
| `npm run dev`              | `node scripts/dev.js`                         | **Padrão** — sobe a infra se preciso e inicia o Next |
| `npm run infra:up`         | `supabase start`                              | Só sobe infra (já tem `.env.local`)                  |
| `npm run next:dev`         | `next dev`                                    | Next.js só (infra já rodando)                        |
| `npm run infra:down`       | `supabase stop`                               | Para infra                                           |
| `npm run infra:reset`      | `supabase db reset`                           | Recria banco + migrations (**apaga os dados**)       |
| `npm run infra:studio`     | `supabase studio`                             | Abre dashboard local                                 |
| `npm run infra:status`     | `supabase status`                             | Mostra URLs e chaves                                 |
| `npm run services:up`      | `docker compose up -d --wait`                 | Postgres puro (sem RLS)                              |
| `npm run migrations:new`   | `supabase migration new`                      | Cria migration `.sql` com timestamp                  |
| `npm run migrations:up`    | `supabase migration up --local`               | Aplica as migrations pendentes no banco local        |
| `npm run migrations:list`  | `scripts/db-migrations.js list --target ...`  | Histórico de migrations num banco remoto/compose     |
| `npm run migrations:push`  | `scripts/db-migrations.js push --target ...`  | Aplica migrations (dry-run sem `--apply`)            |
| `npm run test`             | `jest tests/unit`                             | Testes unitários                                     |
| `npm run test:integration` | `jest tests/integration/postgres --runInBand` | Integração pg-mem                                    |
| `npm run test:regression`  | `jest tests/regression`                       | Testes de regressão (também no CI)                   |
| `npm run test:e2e`         | `playwright test`                             | E2E e acessibilidade (build + Supabase local)        |
| `npm run test:all`         | unit + pg-mem + regressão + RLS               | Todos os testes                                      |
| `npm run build`            | `next build`                                  | Build de produção (o mesmo que a Vercel roda)        |
| `npm run test:mutation`    | `stryker run`                                 | Testes de mutação em `services/`                     |

---

## Trabalho acadêmico em andamento

Issues abertas, em ordem de dependência:

| #                                                             | Assunto                       | Bloqueia |
| :------------------------------------------------------------ | :---------------------------- | :------- |
| [#67](https://github.com/MViniciusCoffe/SpendSmart/issues/67) | Proteção server-side e sessão | —        |
| [#33](https://github.com/MViniciusCoffe/SpendSmart/issues/33) | Cobertura de front-end        | —        |

Resolvidos pela frente de testes, CI e SonarQube: #2, #10, #15, #16, #17, #18, #19, #21, #25, #26, #29, #30, #31.
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
