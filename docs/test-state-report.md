# Relatório do Estado Atual dos Testes

Diagnóstico formal do estado dos testes do SpendSmart antes da disciplina de Testes de Software
(BSI, UFRN, 2026), exigido pela entrega P1. Data de referência: **06/10/2026**.

Todas as afirmações numéricas deste relatório foram verificadas por execução local na data de
referência. O comando usado está indicado em cada seção.

---

## 1. Resumo executivo

| Pergunta da disciplina           | Resposta                                                                                |
| :------------------------------- | :-------------------------------------------------------------------------------------- |
| Existem testes de unidade?       | **Sim** — 65 testes em 4 suítes, todos passando                                         |
| Existem testes de integração?    | **Não** — nenhum teste de integração automatizado existe hoje                           |
| Qual a cobertura atual?          | **100%** sobre `services/` (4 arquivos, 348 linhas); 0% sobre o restante do repositório |
| O sistema era legado sem testes? | **Sim** — até 23/09/2026 não havia um único teste no repositório                        |
| Débito técnico identificado      | Sim — listado em §5                                                                     |

Verificação: `npm run test:coverage` em 06/10/2026.

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

## 3. Estado atual (06/10/2026)

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

**Nenhum existe.** A situação é de dois níveis diferentes:

| Situação             | Detalhe                                                                                                                            |
| :------------------- | :--------------------------------------------------------------------------------------------------------------------------------- |
| `tests/integration/` | **O diretório não existe.** Os scripts `npm run test:integration` e `test:integration:rls` apontam para pastas vazias e falhariam. |
| Cobertura pretendida | 10 casos (IT-01 a IT-10) especificados em [test-plan.md](test-plan.md) §2.2                                                        |
| Ambiente necessário  | Stack local do Supabase CLI (Postgres + Auth + RLS de verdade) — ainda não montada (issue #20)                                     |

Consequência prática: **o isolamento entre usuários (RLS) nunca foi exercitado em nenhum
ambiente.** Nenhuma garantia de privacidade foi provada por teste até hoje.

### 3.3 Testes de sistema e aceitação

Executados manualmente, sem automação. Os critérios de aceitação de cada User Story estão em
[user-stories.md](user-stories.md) e a matriz de cobertura por nível está em
[test-plan.md](test-plan.md) §4.

### 3.4 Análise estática e CI

| Ferramenta          | Estado                                                                                                    |
| :------------------ | :-------------------------------------------------------------------------------------------------------- |
| ESLint 9 + Prettier | Configurados; `eslint .` com 0 erros e 21 avisos (12 `no-alert`, 8 `no-img-element`, 1 `exhaustive-deps`) |
| SonarQube LABENS    | Projeto `spendsmart` analisando; 100% de cobertura no escopo `services/`, 14 code smells                  |
| GitHub Actions      | 3 workflows: `test.yml`, `lint.yml`, `sonar.yml` (com geração de cobertura antes do scan)                 |

Verificado em 06/10/2026 por `npm run lint:eslint:check` e `npx prettier --check .`; o resultado
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

| Débito                                                          | Impacto | Esforço | Onde/Issue                                              |
| :-------------------------------------------------------------- | :------ | :------ | :------------------------------------------------------ |
| Nenhum teste de integração automatizado                         | Alto    | Médio   | [test-plan.md](test-plan.md) §2.2, issues #16 e #20     |
| RLS nunca validado com dois usuários                            | Alto    | Médio   | Issue #20 (bloqueia a prova do requisito RNF04)         |
| `tests/integration/` inexistente com scripts apontando para ela | Médio   | Baixo   | Scripts `test:integration*` em `package.json`           |
| Front-end sem cobertura (`pages/`, `components/`)               | Médio   | Médio   | Issue #33                                               |
| 14 code smells no SonarQube (12 `S2223`, 2 `parseFloat`)        | Baixo   | Baixo   | [sonarqube.md](sonarqube.md) §7 — issue própria a criar |
| Defeitos conhecidos de contrato de UI (`#10`, `#21`)            | Médio   | Baixo   | README "Defeitos conhecidos"                            |
| Ambiente único: `npm run dev` aplica migrations no banco remoto | Alto    | Médio   | Issue #20, [environments.md](environments.md)           |
| Cobertura do Sonar limitada ao escopo `services/`               | Baixo   | Baixo   | Decisão registrada em [sonarqube.md](sonarqube.md) §4   |

---

## 6. Conclusão

O repositório saiu de **zero testes** para 65 testes de unidade com 100% de cobertura na camada de
negócio, lint e análise estática rodando na CI, em cerca de duas semanas de trabalho (23/09 a
06/10/2026). A camada de negócio é hoje a parte mais bem coberta do sistema.

O débito principal é a **ausência total de testes de integração**: sem eles, o requisito central
de privacidade (RNF04) continua sem evidência, e os scripts de integração já existentes apontam
para diretórios que ainda não foram criados. Esse é o principal risco aberto e está planejado nas
iterações seguintes ([iteration-plan.md](iteration-plan.md)).
