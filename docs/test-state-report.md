# Relatório do Estado Atual dos Testes

> **Registro histórico.** Este documento descreve o projeto na data em que foi escrito e é mantido
> como evidência. Os caminhos citados (`pages/gastosPage.js`, `pages/register.js`, `services/`...)
> eram os da época: o front-end hoje está em `src/app/` (App Router) e os serviços em
> `src/services/`. O estado atual está no `README.md`.

Diagnóstico formal do estado dos testes do SpendSmart antes da disciplina de Testes de Software
(BSI, UFRN, 2026), exigido pela entrega P1. Data de referência: **06/10/2026**. Atualizado em
**21/10/2026** para refletir o estado real completo (incluindo testes RLS).

Todas as afirmações numéricas deste relatório foram verificadas por execução local na data de
referência. O comando usado está indicado em cada seção.

---

## 1. Resumo executivo

| Pergunta da disciplina           | Resposta                                                                                                                        |
| :------------------------------- | :------------------------------------------------------------------------------------------------------------------------------ |
| Existem testes de unidade?       | **Sim** — 65 testes em 4 suítes, todos passando                                                                                 |
| Existem testes de integração?    | **Sim** — 6 suítes: 5 em `tests/integration/postgres/` (`pg-mem`/Postgres real) + 1 em `tests/integration/supabase/` (RLS real) |
| Qual a cobertura atual?          | **100%** sobre `services/` (4 arquivos, 348 linhas); 0% sobre o restante do repositório                                         |
| O sistema era legado sem testes? | **Sim** — até 23/09/2026 não havia um único teste no repositório                                                                |
| Débito técnico identificado      | Sim — listado em §5                                                                                                             |

Verificação: `npm run test:coverage` em 06/10/2026; `npm run test:all` em 21/10/2026.

```text
Test Suites: 4 passed, 4 total
Tests:       65 passed, 65 total
All files              |     100 |      100 |     100 |     100
 authServices.js       |     100 |      100 |     100 |     100
 categoryService.js    |     100 |      100 |     100 |     100
 profileService.js     |     100 |      100 |     100 |     100
 transactionService.js |     100 |      100 |     100 |     100
```

---

## 2. Estado antes da disciplina (até 23/09/2026)

O repositório nasceu em 2023 e passou por um hiato de 20 meses. O histórico completo de `tests/`
contém apenas dois momentos antes da frente de testes:

| Data       | Commit    | O que houve                                                                                                                                     |
| :--------- | :-------- | :---------------------------------------------------------------------------------------------------------------------------------------------- |
| até 22/09  | —         | **Nenhum teste automatizado existia.** Zero arquivos de teste em todo o histórico.                                                              |
| 23/09/2026 | `d5729cb` | José Samuel Silva Lima adicionou a primeira suíte (Tarefa 01 da disciplina): `tests/categoria.test.js` e `tests/categoria.integration.test.js`. |
| 26/09/2026 | `1786c3d` | Essa suíte foi **removida**: ela testava `services/categoriaService.js`, código morto não importado por nenhuma página (issue #26).             |

Diagnóstico do estado legado:

- **Testes de unidade:** nenhum.
- **Testes de integração:** nenhum (o arquivo de integração da Tarefa 01 exercitava o serviço morto
  e não sobreviveu).
- **Cobertura:** não aplicável — não havia suíte nem relatório.
- **CI:** inexistente até a disciplina; o primeiro workflow (`test.yml`) veio junto com a Tarefa 01.
- **Débito:** a aplicação inteira (interface, services, rotas serverless, migrations) estava sem
  qualquer verificação automatizada.

---

## 3. Estado atual (21/10/2026)

### 3.1 Testes de unidade

| Item                     | Valor                                                   |
| :----------------------- | :------------------------------------------------------ |
| Ferramenta               | Jest 30 + `babel-jest` (ESM)                            |
| Localização              | `tests/unit/` — 4 arquivos                              |
| Alvo                     | `services/` com o cliente Supabase mockado por factory  |
| Quantidade               | 65 testes, 4 suítes, 0 falhas                           |
| Comando                  | `npm test`                                              |
| Cobertura (`lcov`)       | `npm run test:coverage` -> `coverage/lcov.info`         |
| Cobertura em `services/` | 100% statements, branch, functions e lines (348 linhas) |

Os 14 métodos dos quatro services estão cobertos. O `logoutUser`, que já foi código morto, tem
consumidor real desde 2026-09 (`pages/accountConfig.js`, `components/Navbar/navbarApp.js`) e
também é testado.

### 3.2 Testes de integração

**Existem 6 suítes no total:**

| Local                         | Suítes | O que cobre                                                            |
| :---------------------------- | :----- | :--------------------------------------------------------------------- |
| `tests/integration/postgres/` | 5      | Constraints, FK, unicidade, migrações (pg-mem ou Postgres real)        |
| `tests/integration/supabase/` | 1      | **RLS real** — isolamento entre 2 usuários (requer Supabase CLI local) |

**Detalhe das 5 suítes `postgres/`:**

| Suite                         | O que cobre                                                                                    |
| :---------------------------- | :--------------------------------------------------------------------------------------------- |
| `profileConstraints.test.js`  | Gravação do perfil no cadastro (CT01.04, #25)                                                  |
| `incomeRegistration.test.js`  | Cadastro de receita com dados válidos e valores inválidos (CT10.01, CT10.02)                   |
| `expenseRegistration.test.js` | Cadastro de despesa com dados válidos, valores inválidos, detalhe preenchido (CT13.01-CT13.04) |
| `categoryListing.test.js`     | Listagem de categorias isolada por usuário (US-007)                                            |
| `categoryConstraints.test.js` | Unicidade de categoria por (usuário, nome, tipo) e exclusão com FK (IT-04, IT-05)              |

**Detalhe da suíte `supabase/rls.test.js`:**

| Teste                                         | Casos | O que valida                                                                  |
| :-------------------------------------------- | :---- | :---------------------------------------------------------------------------- |
| Categories: leitura isolada                   | 2     | user1 vê só suas categorias; user2 vê só suas                                 |
| Categories: insert/update/delete cross-user   | 3     | user1 não consegue inserir/atualizar/deletar categorias do user2 (erro 42501) |
| Transactions: leitura isolada                 | 2     | user1 vê só suas transações; user2 vê só suas                                 |
| Transactions: insert/update/delete cross-user | 3     | user1 não consegue inserir/atualizar/deletar transações do user2 (erro 42501) |
| Profiles: leitura isolada                     | 2     | user1 vê seu perfil; user1 NÃO vê perfil do user2                             |

| Situação             | Detalhe                                                                                                                     |
| :------------------- | :-------------------------------------------------------------------------------------------------------------------------- |
| `tests/integration/` | **Existe** com 6 suítes. `npm run test:integration` roda pg-mem; `npm run test:integration:supabase` roda RLS real.         |
| Cobertura pretendida | 10 casos (IT-01 a IT-10) especificados em [test-plan.md](test-plan.md) §2.2 — **IT-01, IT-02 cobertos pela suíte RLS real** |
| Ambiente necessário  | Stack local do Supabase CLI (Postgres + Auth + RLS de verdade) — `supabase start` + `.env.local` preenchido                 |

**Consequência prática:** O isolamento por RLS **já é testado** em ambiente local Supabase CLI.
O teste **não roda no CI GitHub Actions** (precisa stack local), mas valida IT-01 e IT-02.
O comentário em `categoryListing.test.js:10-13` foi atualizado para refletir isso.

### 3.3 Testes de regressão

Existe 1 suíte de regressão em `tests/regression/issue10-21-transactionService.test.js` cobrindo:
validação de título (#10), DTO com `data_ocorrencia`/`metodo_pagamento` (#21), tradução de tipo e
validação de valor.

### 3.4 Testes de sistema e aceitação

Executados manualmente, sem automação. Os critérios de aceitação de cada User Story estão em
[user-stories.md](user-stories.md) e a matriz de cobertura por nível está em
[test-plan.md](test-plan.md) §4.

### 3.5 Análise estática e CI

| Ferramenta           | Estado                                                                                                                           |
| :------------------- | :------------------------------------------------------------------------------------------------------------------------------- |
| ESLint 9 + Prettier  | Configurados; `eslint .` com 0 erros e 20 avisos (12 `no-alert`, 8 `no-img-element`)                                             |
| SonarQube LABENS     | Projeto `spendsmart` analisando; 100% de cobertura no escopo `services/`, 0 code smells                                          |
| GitHub Actions       | 3 workflows: `test.yml`, `lint.yml`, `sonar.yml` (com geração de cobertura antes do scan)                                        |
| **Scripts de teste** | `test` (unit), `test:watch`, `test:coverage`, `test:integration` (pg-mem), `test:integration:supabase` (RLS), `test:all` (todos) |

Verificado em 21/10/2026 por `npm run lint:eslint:check` e `npx prettier --check .`; o resultado
do SonarQube está registrado em [sonarqube.md](sonarqube.md) §7.

---

## 4. O que a cobertura de 100% significa — e o que não significa

O número é real, mas está **escopado em `services/`**, que é o único diretório medido
(`jest.config.js: collectCoverageFrom: ["services/**/*.js"]`). A aritmética completa está em
[sonarqube.md](sonarqube.md) §4:

| Diretório    | Arquivos | Linhas    | Medido? |
| :----------- | :------- | :-------- | :------ |
| `services`   | 4        | 348       | sim     |
| `pages`      | 12       | 1.834     | não     |
| `components` | 3        | 112       | não     |
| `infra`      | 3        | 82        | não     |
| `supabase`   | 2        | 155       | não     |
| **Total**    | **24**   | **2.531** | **348** |

Medir o repositório inteiro hoje mostraria cerca de 14%. Isso não é cobertura "ruim": é cobertura
**ainda não começada** fora da camada de negócio. A issue #33 é a que mantém o front-end fora do
escopo.

---

## 5. Débito técnico identificado

| Débito                                                       | Impacto | Esforço | Onde/Issue                                                        |
| :----------------------------------------------------------- | :------ | :------ | :---------------------------------------------------------------- |
| RLS testado apenas local (não no CI)                         | Alto    | Médio   | Issue #20 (bloqueia CI de RLS), #30                               |
| Front-end sem cobertura (`pages/`, `components/`)            | Médio   | Médio   | Issue #33                                                         |
| 14 code smells corrigidos (12 `S2223`, 2 `parseFloat`)       | —       | —       | [sonarqube.md](sonarqube.md) §7 — verificado 2026-10              |
| Defeitos conhecidos de contrato de UI (`#32`, `#43`)         | Médio   | Baixo   | README "Defeitos conhecidos"                                      |
| Ambiente único: Dev/Preview/Prod no mesmo banco Supabase     | Alto    | Médio   | Issue #20, [environments.md](environments.md)                     |
| Cobertura do Sonar limitada ao escopo `services/`            | Baixo   | Baixo   | Decisão registrada em [sonarqube.md](sonarqube.md) §4             |
| Duplicação de migração de soft delete (2 arquivos idênticos) | Baixo   | Baixo   | `supabase/migrations/1790304277050_*.sql` + `1791833057050_*.sql` |

---

## 6. Conclusão

O repositório saiu de **zero testes** para **116 testes** (65 unit + 28 pg-mem + 12 RLS + 8 regression)
com 100% de cobertura na camada de negócio, 6 suítes de testes de integração (pg-mem + Supabase real),
lint e análise estática rodando na CI, em cerca de um mês de trabalho (23/09 a 21/10/2026). A camada de
negócio é hoje a parte mais bem coberta do sistema.

O débito principal é o **RLS não rodar no CI**: o teste `rls.test.js` valida IT-01/IT-02 localmente,
mas precisa de stack Supabase CLI que não está no GitHub Actions. A issue #30 captura isso.
O requisito central de privacidade (RNF04) tem evidência automatizada local, mas não na CI.
Isso está planejado nas iterações seguintes ([iteration-plan.md](iteration-plan.md), issues #20, #30).
