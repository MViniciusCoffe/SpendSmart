# Plano de testes

Plano Geral de Testes (PTG) do SpendSmart, no modelo YP-Agentic. Cobre a aplicação em uso: um
monolito Next.js (App Router) com Supabase Auth e Supabase PostgreSQL com Row Level Security, sem
servidor HTTP próprio.

| Item       | Valor                                                                                   |
| :--------- | :-------------------------------------------------------------------------------------- |
| Disciplina | Testes de Software, BSI, UFRN, 2026.2                                                   |
| Equipe     | José Samuel Silva Lima (Gerente / QA), Marcus Vinícius de Souza Azevedo (Desenvolvedor) |
| Versão     | 2.0 (2026-11-05): inclui o escopo da P3 e corrige o estado da suíte                     |
| Versão 1.0 | Entrega da P2 (Plano Geral de Testes e CI com SonarQube)                                |

Os identificadores RF01 a RF16 e RNF01 a RNF07 vêm do [documento de visão](vision.md) e são
preservados para que a rastreabilidade entre requisito, User Story e caso de teste continue estável.
As User Stories e os cenários BDD/Gherkin estão em [user-stories.md](user-stories.md); o
detalhamento por iteração, em [test-plan-iterations.md](test-plan-iterations.md).

### Objetivos

- Definir a estratégia e os níveis de teste (unidade, integração, sistema e aceitação) que cobrem os
  16 requisitos funcionais e os 7 requisitos não funcionais do SpendSmart.
- Automatizar os testes de sistema (ponta a ponta, E2E) a partir dos cenários BDD/Gherkin das User
  Stories, e comparar essa automação com o teste instrumental conduzido por um agente de IA (P3).
- Avaliar a usabilidade (Capacidade de Interação, ISO/IEC 25010:2023, e Heurísticas de Nielsen) e a
  acessibilidade (WCAG 2.2, níveis A e AA) das telas principais, corrigindo pelo menos 2 problemas.
- Manter a matriz de rastreabilidade entre requisito, User Story e caso de teste, e os critérios de
  entrada e saída de cada iteração.
- Registrar riscos e contingências que afetam a confiabilidade da evidência de testes, em especial o
  isolamento entre usuários via RLS.

### Tarefas da disciplina que este plano atende

| Tarefa | Conteúdo                                                                         | Onde está a evidência                                                                            |
| :----- | :------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------- |
| P2     | Plano Geral de Testes, Plano de Teste das Iterações, SonarQube e CI              | Este documento, [test-plan-iterations.md](test-plan-iterations.md), [sonarqube.md](sonarqube.md) |
| P3     | Testes de sistema (E2E), teste instrumental com IA, usabilidade e acessibilidade | §2.3, §2.5 e §10 deste documento; relatório em `docs/relatorio-testes-sistema-ia.md` (a criar)   |

---

## 1. Escopo

### 1.1 No escopo

- As 16 User Stories em [user-stories.md](user-stories.md), com seus critérios de aceitação.
- Os 16 Requisitos Funcionais (RF01 a RF16).
- Os 7 Requisitos Não Funcionais (RNF01 a RNF07) — ver §3.
- A camada de serviço (`src/services/`), que concentra as regras de negócio e a tradução de domínio.
- As rotas serverless privilegiadas de `src/app/api/` (`createProfile`, `deleteAccount`), que usam a
  `service_role`. As rotas `health` e `status` são públicas e só leem estado.
- As políticas RLS de `profiles`, `categories` e `transactions`.
- As migrations de `supabase/migrations/`.
- **(P3)** Os fluxos ponta a ponta pela interface (`src/app/`), executados num navegador real contra
  a stack local do Supabase.
- **(P3)** Usabilidade e acessibilidade das telas: `/login`, `/register`, `/dashboard`,
  `/transactions`, `/categories` e `/settings`.

### 1.2 Fora do escopo

- Validação visual pixel a pixel e design responsivo: os testes tratam comportamento observável e
  critérios verificáveis (WCAG, heurísticas), não aparência.
- Desempenho, carga e estresse, e testes de segurança da informação (varredura, pentest, headers).
  A P3 deixa esses testes para uma tarefa posterior da disciplina. Até lá, as falhas de segurança já
  conhecidas seguem registradas em issue (#50, #51, #54, #67). Os headers de segurança (CSP com
  nonce, `nosniff`, `frame-ancestors`, `Referrer-Policy`, `Permissions-Policy`) são verificados pelo
  teste de regressão da #24.
- Compatibilidade entre navegadores: o E2E roda no Chromium do Playwright (ver §2.3.1).
- Infraestrutura externa do Supabase que não esteja sob controle da equipe.
- Serviços de terceiros não simulados.
- Execução de testes contra os projetos Supabase de Preview ou de Produção (ver §5).

---

## 2. Níveis de teste

| Nível                            | Pasta / artefato                        | Comando                             | Situação        |
| :------------------------------- | :-------------------------------------- | :---------------------------------- | :-------------- |
| Unidade (services)               | `tests/unit/`                           | `npm test`                          | 221 testes      |
| Mutação                          | `src/services/` (Stryker)               | `npm run test:mutation`             | 97,10%          |
| Unidade de lógica do front-end   | `tests/unit/` (Jest)                    | `npm test`                          | Planejado       |
| Componentes (#33)                | a definir                               | a definir                           | Adiado          |
| Integração do front-end          | `tests/e2e/` (Playwright, rede mockada) | a definir na implementação          | Planejado       |
| Integração (pg-mem)              | `tests/integration/postgres/`           | `npm run test:integration`          | 24 testes       |
| Integração (RLS, Supabase local) | `tests/integration/supabase/`           | `npm run test:integration:supabase` | 17 testes       |
| Regressão                        | `tests/regression/`                     | `npx jest tests/regression`         | 27 testes       |
| Sistema (E2E automatizado)       | `tests/e2e/` (Playwright)               | a definir na implementação          | P3              |
| Sistema (instrumental por IA)    | sessão registrada no relatório da P3    | —                                   | P3              |
| Aceitação (manual)               | `docs/acceptance-test-report-*.md`      | —                                   | Iterações 1 a 3 |
| Usabilidade e acessibilidade     | relatório da P3                         | ferramenta de auditoria (§2.5)      | P3              |

### 2.1 Testes de unidade

**Alvo:** métodos de `src/services/` com o cliente Supabase mockado.

**Responsável:** desenvolvedor.

**Foco:** regras de negócio isoladas do banco. São três grupos:

1. **Validação de entrada** — campos obrigatórios, formato de valor numérico, tipo válido.
2. **Mapeamento de erro** — cada código do Postgres deve virar a mensagem correta em português
   (ver os mapas de mensagens de `createCategory` e `updateCategory` em
   `src/services/categoryService.js` como referência).
3. **Mapeamento para DTO** — o service devolve só os campos do mapper (`src/services/utils/mappers.js`),
   nunca a linha crua do banco. O `type` continua `income`/`expense`: os rótulos "Receita" e
   "Despesa" são da interface.

**Mocks:** o cliente Supabase é substituído por um dublê que devolve `{ data, error }`. O foco é
garantir que o service reaja corretamente a cada par possível, inclusive `error` nulo.

O mock precisa de **factory**, e o falso precisa ser montado **dentro** dela. Duas razões, as duas
verificadas:

1. `src/lib/supabase.js:6` chama `createClient` no momento do import, e `createClient(undefined, undefined)`
   lança `supabaseUrl is required`. Sem factory, o Jest precisa inspecionar o módulo real para gerá-lo
   automaticamente, e inspecionar significa executar. O teste morre antes da primeira asserção, com
   `Tests: 0 total`.
2. O `jest.mock` é **hoisted** para o topo do arquivo, acima dos imports e das variáveis. Se a
   factory referenciar uma `const` declarada no arquivo, ela ainda está na zona morta temporal e o
   resultado é `ReferenceError: Cannot access 'X' before initialization`.

```js
// Errado 1: sem factory, o módulo real é executado e lança
jest.mock("@/lib/supabase")

// Errado 2: a factory é hoisted acima desta const
const mockSupabase = { from: jest.fn() }
jest.mock("@/lib/supabase", () => ({ supabase: mockSupabase }))

// Certo: o falso nasce dentro da factory e é importado normalmente
jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
    auth: { getSession: jest.fn() }
  }
}))

import { supabase } from "@/lib/supabase"

// e reconfigurado por teste
supabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: "u1" } } } })
```

O mesmo vale para `global.fetch`, que `authServices` e `profileService` chamam direto.

**Estado atual:** 221 testes em `tests/unit/`, com 100% de cobertura de linhas, ramos e funções em
`src/services/`. A suíte antiga, que cobria só o código morto `categoriaService.js`, foi substituída
(issue [#26](https://github.com/MViniciusCoffe/SpendSmart/issues/26)).

### 2.1.1 Testes de mutação

A cobertura de 100% em `services/` mostra que as linhas são executadas, não que os testes detectam
defeitos. Para medir a eficácia da suíte unitária, o Stryker gera mutantes de `src/services/` e
verifica se algum teste falha com cada um.

| Item            | Valor                                                                                       |
| :-------------- | :------------------------------------------------------------------------------------------ |
| Comando         | `npm run test:mutation`                                                                     |
| Escopo          | `src/services/**/*.js`, executando só o project `unit` do Jest                              |
| Meta            | Mutation score ≥ 85% (`break` do `stryker.conf.json`: abaixo disso o comando e o CI falham) |
| Resultado atual | **97,10%** (535 mortos, 16 sobreviventes aceitos e justificados)                            |

Resultados por rodada, mutantes aceitos e justificativas em [mutation-testing.md](mutation-testing.md).

### 2.1.2 Testes do front-end

O front-end (`src/app/`, `src/components/`, `src/contexts/`, `src/lib/`) ainda não tem teste
automatizado. Os níveis abaixo seguem a divisão do guia de testes do Next.js 16
(`node_modules/next/dist/docs/01-app/02-guides/testing/`). O que muda de um nível para o outro é
quanto do sistema real é executado.

| Nível                      | O que roda de verdade                            | O que é simulado              | Exemplo no SpendSmart                                                                                                                                      | Ferramenta                           | Prioridade       |
| :------------------------- | :----------------------------------------------- | :---------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------- | :--------------- |
| 1. Unidade (lógica)        | Uma função pura                                  | Nada                          | `parseAmount`, `formatCurrency` e `formatDate` em `src/lib/utils/format.js` (origem do #32); o cálculo de saldo do dashboard, depois de extraído da página | Jest (já instalado)                  | Média            |
| 2. Componente              | Um componente renderizado isoladamente           | Services, roteador, contexto  | `TransactionForm` envia os campos que o service espera (classe de defeito de #10/#21)                                                                      | Jest + jsdom + Testing Library (#33) | Baixa: adiado    |
| 3. Integração do front-end | A aplicação inteira num navegador real           | **Só a rede** para o Supabase | Supabase devolve 500 e a página mostra toast em vez de quebrar; sessão expirada e `withAuth` redireciona para `/login`                                     | Playwright (`page.route()`)          | Alta             |
| 4. Sistema (E2E)           | Tudo: navegador, Next.js, Auth, Postgres com RLS | Nada                          | ST-01 e ST-02 (§2.3.1)                                                                                                                                     | Playwright                           | Obrigatória (P3) |

O nível 3 existe porque o E2E contra o Supabase real só alcança o caminho feliz e os erros que a
interface consegue provocar (e-mail duplicado, senha curta). Falha do banco, queda de rede no meio
de um envio, token expirado e "lista vazia" × "falhou ao carregar" quase não se reproduzem assim.
Interceptando a chamada (`page.route("**/rest/v1/transactions*", ...)`), o teste escolhe a resposta,
com a mesma ferramenta e a mesma pasta do E2E, sem dependência nova.

O nível 2 fica adiado: exige 3 a 4 dependências novas (issue
[#33](https://github.com/MViniciusCoffe/SpendSmart/issues/33)) e um componente que renderiza prova
pouco. O component testing do Playwright (`@playwright/experimental-ct-react`) ainda é experimental
e não resolve sem mocks as peças do Next.js (`next/navigation`, `next/image`).

Consequências da organização:

- O Playwright tem test runner próprio. Os testes ficam em `tests/e2e/`, e essa pasta precisa ser
  ignorada pelo Jest: o padrão do Jest também casa `*.spec.js` e tentaria executar os arquivos do
  Playwright.
- Os níveis 3 e 4 não geram `coverage/lcov.info`. O escopo do Sonar continua `src/services/`; a
  cobertura do front-end é medida por fluxos e cenários Gherkin cobertos, não por linhas.
- A configuração do Playwright recusa `NEXT_PUBLIC_SUPABASE_URL` que não seja local, como a suíte de
  RLS (§2.2).

### 2.2 Testes de integração

**Alvo:** a fronteira entre rota serverless e banco, as constraints do schema e a aplicação do RLS.

**Responsável:** desenvolvedor / testador.

**Casos que só a integração revela:**

| #     | Caso                                                 | Por que só a integração                                                         | Situação                                                                                         |
| :---- | :--------------------------------------------------- | :------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------------------- |
| IT-01 | Isolamento de leitura entre dois usuários            | Depende das políticas RLS, que vivem no banco. Nenhum mock em JS reproduz isso. | `rls.test.js`: conjunto exato de linhas; falha com o RLS desligado (verificado em 2026-11-05)    |
| IT-02 | Isolamento de escrita entre dois usuários            | Depende do `WITH CHECK` das políticas.                                          | `rls.test.js`                                                                                    |
| IT-03 | Deleção de conta remove tudo em cascata              | Depende das chaves estrangeiras para `auth.users`.                              | **Sem teste**                                                                                    |
| IT-04 | Exclusão de categoria em uso é rejeitada             | Depende de `ON DELETE RESTRICT`.                                                | pg-mem (`categoryConstraints.test.js`)                                                           |
| IT-05 | Unicidade de categoria por (usuário, nome, tipo)     | Depende da constraint `23505`.                                                  | pg-mem (`categoryConstraints.test.js`)                                                           |
| IT-06 | `amount` não negativo e não zero                     | Depende do `CHECK (amount > 0)`.                                                | pg-mem (CT10.02, CT13.02)                                                                        |
| IT-07 | `transactions.type` deve bater com `categories.type` | Invariante que hoje não existe no banco. Ver §6.                                | **Sem teste e sem constraint**                                                                   |
| IT-08 | `/api/createProfile` rejeita requisição sem token    | Depende do `getUser(token)` na rota.                                            | **Sem teste** (o unitário só verifica a chamada `fetch` do service)                              |
| IT-09 | `/api/deleteAccount` rejeita token inválido com 401  | Idem.                                                                           | **Sem teste**                                                                                    |
| IT-10 | Migrations aplicam do zero sem erro                  | Verifica o guard `to_regclass` e a ordem de execução.                           | Implícito: o pg-mem monta o schema a partir dos `.sql` e o job `rls` do CI roda `supabase start` |

Se a chave `service_role` for eliminada da aplicação (proposta registrada no AGENTS.md §14.3: trigger
de criação de perfil e RPC `delete_own_account()`), IT-08 e IT-09 passam a ser testes do trigger e da
RPC no Supabase local.

**Ambiente:** os dois modos estão em [environments.md §6](environments.md#6-testes).

- `tests/integration/postgres/` roda em pg-mem por padrão: o schema vem das próprias migrations,
  sem RLS, políticas, GRANT e triggers. Com `TEST_DATABASE_URL`, roda contra um Supabase local
  descartável; o `tests/integration/db.js` recusa o banco se `auth.users` tiver conta com e-mail,
  porque o `beforeEach` apaga as tabelas inteiras.
- `tests/integration/supabase/` roda contra a stack local do Supabase CLI, com Auth e RLS reais. A
  suíte cria e remove só os próprios 2 usuários, e recusa `NEXT_PUBLIC_SUPABASE_URL` que não seja
  `127.0.0.1`/`localhost`.

### 2.3 Testes de sistema e aceitação

**Alvo:** o comportamento do sistema completo (navegador → Next.js → Supabase Auth/PostgREST →
Postgres com RLS), validado a partir dos cenários BDD/Gherkin das User Stories.

São três formas complementares, e a comparação entre as duas primeiras é parte da entrega da P3:

| Forma                                | Quem executa                         | Determinística? | Para que serve                                                 |
| :----------------------------------- | :----------------------------------- | :-------------- | :------------------------------------------------------------- |
| E2E automatizado por script (§2.3.1) | Ferramenta, local e no CI            | Sim             | Regressão dos fluxos críticos a cada mudança                   |
| Teste instrumental por IA (§2.3.2)   | Agente de IA no navegador real       | Não             | Exploração, diagnóstico e descoberta de defeitos não previstos |
| Aceitação manual (§2.3.3)            | QA (colega que não desenvolveu a US) | Não             | Aceite da iteração com o cliente                               |

#### 2.3.1 E2E automatizado por script (P3, Passos 2 e 4)

**Ferramenta: Playwright.** A pesquisa comparativa exigida pela P3 (Selenium WebDriver/IDE, Cypress e
Playwright) e a justificativa completa ficam no relatório `docs/relatorio-testes-sistema-ia.md`.
Critérios da comparação, conforme o enunciado: licença e limitações da versão gratuita, arquitetura
de execução (WebDriver HTTP, CDP/WebSockets ou execução no navegador), aderência à stack
(JavaScript, Next.js 16, React 19), gravação, depuração visual e relatórios, e execução headless no
GitHub Actions.

Razões que pesaram para o projeto, além dos critérios gerais:

- Um só runner cobre os níveis 3 e 4 de §2.1.2: E2E contra o Supabase local e estados de erro com a
  rede interceptada (`page.route()`).
- `@axe-core/playwright` leva a auditoria de acessibilidade (§2.5) para dentro dos próprios fluxos.
- O Playwright MCP, usado pelo Claude Code no teste instrumental (§2.3.2), executa o mesmo motor, o
  que torna a comparação script × agente mais direta.
- `webServer` na configuração sobe a aplicação antes da suíte, e o modo headless roda no GitHub
  Actions sem serviço extra.

**Escopo mínimo:** 1 fluxo ponta a ponta por integrante, com caminho feliz e pelo menos uma regra de
erro, rastreado diretamente a cenários Gherkin de [user-stories.md](user-stories.md). Para respeitar
a regra de dupla verificação (§9), cada integrante automatiza uma US desenvolvida pelo colega:

| ID    | Fluxo                         | Cenários Gherkin rastreados                | Autor do script (proposta) | US desenvolvida por |
| :---- | :---------------------------- | :----------------------------------------- | :------------------------- | :------------------ |
| ST-01 | Criar conta e entrar          | CA-001.01, CA-001.02, CA-001.03, CA-001.04 | Marcus                     | José (US-001)       |
| ST-02 | Registrar e consultar despesa | CA-013.01, CA-013.02, CA-013.03, CA-013.04 | José                       | Marcus (US-013)     |

Fluxos adicionais, se houver tempo, em ordem de valor:

| ID    | Fluxo                                                                                                                      | Por que                                                                                 |
| :---- | :------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- |
| ST-03 | Fluxo principal: criar conta → categorias de receita e despesa → lançamentos → saldo no dashboard (US-016) → excluir conta | Cobre o roteiro de §2.3.3 inteiro e o IT-03 pela interface                              |
| ST-04 | Sair e entrar com outro usuário na mesma aba                                                                               | Exercita o defeito conhecido do cache de sessão (AGENTS.md §14.3); esperado falhar hoje |
| ST-05 | Excluir categoria com lançamentos (CA-009.02, CA-009.05)                                                                   | Soft delete visível na interface                                                        |

**Execução:** contra a aplicação local (`npm run dev`) e o Supabase CLI local, nunca contra a Vercel
ou os bancos remotos. Cada execução cria usuários próprios (`e2e-<execução>@test.local`) pela tela de
cadastro e os remove ao final, como a suíte de RLS. Evidências (saída do terminal, relatório HTML,
capturas ou vídeo) vão para o relatório da P3.

**CI (recomendado pela P3):** um job headless no `test.yml` que reaproveita a subida do Supabase do
job `rls`, faz `next build` e `next start` e roda a suíte E2E.

#### 2.3.2 Teste instrumental por agente de IA (P3, Passos 3 e 5)

Diferença central: no E2E por script, a IA pode ajudar a **escrever** o código de teste, que depois
roda sem ela. No teste instrumental, o agente **opera a aplicação em execução**: controla o
navegador, lê a árvore DOM e a de acessibilidade, preenche campos, lê console e rede, e valida o
estado em tempo real.

| Item       | Definição                                                                                                                                     |
| :--------- | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| Agentes    | Claude Code com um servidor MCP de navegador (Playwright MCP ou Chrome DevTools MCP) e/ou Google Antigravity (Browser Subagent)               |
| Entrada    | Um cenário de aceitação Gherkin do projeto, entregue ao agente com o papel de QA Instrumental                                                 |
| Ambiente   | Aplicação local (`npm run dev`) com dados sintéticos; nunca Preview ou Produção                                                               |
| Registro   | Agente e ambiente, prompt, passos executados, evidências (capturas, console, rede) e diagnóstico                                              |
| Comparação | Script (§2.3.1) × instrumental: determinismo, reprodutibilidade, custo de manutenção, tempo de execução e descoberta exploratória de defeitos |

Sugestão de cenário: o mesmo de um fluxo automatizado (por exemplo, CA-013.02), para que a
comparação seja sobre a mesma especificação.

#### 2.3.3 Aceitação manual

**Fluxo principal:** criar conta -> entrar -> ver dashboard vazio -> criar categoria de receita ->
criar categoria de despesa -> registrar receita -> registrar despesa -> conferir saldo ->
alterar perfil -> sair -> entrar de novo -> excluir conta e confirmar que tudo sumiu.

Os relatórios de aceitação por iteração estão em `docs/acceptance-test-report-*.md`, sempre escritos
pelo colega que não desenvolveu a história.

**Critério de saída da iteração** (adaptado do modelo BSI):

- [ ] 100% dos casos de aceitação planejados foram executados
- [ ] Nenhum defeito de prioridade alta ou crítica permanece aberto
- [ ] Os testes de unidade e integração das funcionalidades estão concluídos
- [ ] As User Stories atendem aos próprios critérios de aceitação

### 2.4 Testes de regressão

Todo defeito corrigido ganha um teste em `tests/regression/`, nomeado pela issue (ex.:
`issue10-21-transactionService.test.js`). Hoje são 27 testes, cobrindo #10/#21, #32, fuso horário em
`formatDate`, nome de categoria deletada e propagação do tipo da categoria. Eles rodam só localmente
(`npx jest tests/regression` ou `npm run test:all`): **nenhum workflow do CI os executa**, o que está
registrado como risco em §6.

Os fluxos E2E de §2.3.1 também cumprem papel de regressão para os defeitos de interface já corrigidos
(#10, #21, #22, #23, #43).

### 2.5 Usabilidade e acessibilidade (P3, Passo 6)

**Acessibilidade (WCAG 2.2, níveis A e AA).** Auditoria automática com ferramenta livre (Lighthouse,
axe-core / `@axe-core/playwright`, WAVE ou Pa11y), complementada por inspeção do agente de IA e por
verificação manual do que a ferramenta não mede: navegação só por teclado, foco visível, ordem de
foco e leitura por leitor de tela.

**Usabilidade.** Avaliação heurística pelas 10 Heurísticas de Nielsen e pelas subcaracterísticas da
Capacidade de Interação da ISO/IEC 25010:2023 (reconhecimento de adequação, aprendizagem,
operabilidade, proteção contra erro do usuário, engajamento, inclusividade, assistência ao usuário e
autodescrição), combinando a inspeção do agente de IA com a revisão crítica da equipe.

| Item              | Definição                                                                                                 |
| :---------------- | :-------------------------------------------------------------------------------------------------------- |
| Telas             | `/login`, `/register`, `/dashboard`, `/transactions`, `/categories`, `/settings`                          |
| Linha de base     | Pontuação e lista de violações de cada tela, antes de qualquer correção                                   |
| Correção          | Pelo menos 2 problemas reais corrigidos no código, priorizando violações de nível A e AA de maior impacto |
| Evidência         | Antes × Depois (código, tela e pontuação) no relatório, com link do PR das melhorias                      |
| Achados restantes | Viram issues no repositório do projeto, com o critério WCAG ou a heurística correspondente                |

Com `@axe-core/playwright`, a verificação de acessibilidade entra nos próprios fluxos de §2.3.1, para
que uma regressão de acessibilidade falhe o CI.

---

## 3. Estratégia por requisito não funcional

Os RNF definem as qualidades que a aplicação precisa manter. A coluna "Como verificar" aponta o
teste ou a inspeção que cobre cada um.

| ID    | Requisito não funcional                                                                                                                             | Como verificar                               |
| :---- | :-------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------- |
| RNF01 | Roda sobre Node.js, sem servidor HTTP próprio. As únicas rotas server-side são as funções serverless em `src/app/api/`.                             | Inspecionar `package.json` e `src/app/api/`  |
| RNF02 | Toda comunicação é JSON: o cliente fala com o Supabase via PostgREST, e as rotas serverless recebem e devolvem JSON.                                | IT-08, IT-09 (**sem teste hoje**)            |
| RNF03 | Persistência em PostgreSQL, com constraints e índices aplicados por migration.                                                                      | IT-10, IT-04, IT-05, IT-06                   |
| RNF04 | Sessão gerenciada pelo Supabase Auth e nenhum dado de um usuário visível a outro.                                                                   | IT-01, IT-02, IT-08, IT-09, CA-002.02, ST-04 |
| RNF05 | O acesso do navegador ao Supabase depende da configuração de CORS feita no painel do projeto, não no código.                                        | Configuração do projeto Supabase             |
| RNF06 | Servidor na porta 3000 em desenvolvimento; a Vercel não expõe porta.                                                                                | Ver [environments.md](environments.md)       |
| RNF07 | Separação entre interface, regra de negócio, cliente e operações privilegiadas: `src/app/`, `src/services/`, `src/lib/supabase.js`, `src/app/api/`. | Inspeção estática + revisão                  |

**RNF04 é o requisito de segurança central.** Ele se verifica por observação do resultado, e não
pela presença de um mecanismo: o que importa é que uma consulta com o usuário A não devolva linha
do usuário B. Os testes IT-01 e IT-02 são a verificação disso, e por isso são os únicos dois casos
que exigem ambiente com RLS ativo.

### 3.1 Características de qualidade avaliadas na P3

Usabilidade e acessibilidade não têm RNF próprio no [documento de visão](vision.md). A P3 as avalia
como características de qualidade, com os critérios de §2.5. Se a equipe decidir que viram requisito
(por exemplo, "WCAG 2.2 AA nas telas principais"), o RNF novo nasce no documento de visão e só então
ganha linha na tabela acima.

| Característica                        | Referência                  | Abordagem                                                    | Critério                                                   |
| :------------------------------------ | :-------------------------- | :----------------------------------------------------------- | :--------------------------------------------------------- |
| Acessibilidade                        | WCAG 2.2, A e AA            | Ferramenta de auditoria + teclado + IA                       | Linha de base registrada; ≥ 2 correções com Antes × Depois |
| Capacidade de Interação (usabilidade) | ISO/IEC 25010:2023, Nielsen | Avaliação heurística assistida por IA e revisada pela equipe | Problemas classificados por heurística e severidade        |

---

## 4. Matriz de casos de teste

Cobertura de US por nível. "Un." = unidade, "Int." = integração, "E2E" = sistema automatizado
(§2.3.1), "Aceit." = aceitação manual. O detalhamento por critério de aceitação está em
[user-stories.md](user-stories.md).

| US                       | Un. | Int.            | E2E   | Aceit. | Observação                                                                                                            |
| :----------------------- | :-- | :-------------- | :---- | :----- | :-------------------------------------------------------------------------------------------------------------------- |
| US-001 Criar conta       | x   | pg-mem (perfil) | ST-01 | x      | Rollback resolvido (#25, PR #47); IT-08 sem teste                                                                     |
| US-002 Entrar            | x   |                 | ST-01 | x      | Mapeamento de erro é 100% cliente                                                                                     |
| US-003 Perfil            | x   |                 |       |        | Senha idêntica sem tratamento (#11)                                                                                   |
| US-004 Excluir conta     | x   | IT-03, IT-09    | ST-03 |        | IT-03 e IT-09 sem teste                                                                                               |
| US-005 Privacidade       |     | IT-01, IT-02    | ST-04 |        | IT-01/IT-02 comparam o conjunto exato (#66)                                                                           |
| US-006 Criar categoria   | x   | IT-05           | ST-03 |        |                                                                                                                       |
| US-007 Listar categorias | x   | IT-01, service  | ST-03 | ?      | `categoryService` real no Supabase local, com estado vazio (CA-007.02); sem relatório de aceitação próprio em `docs/` |
| US-008 Alterar categoria | x   |                 |       |        | CA-008.03 atendido (diálogo e propagação do tipo)                                                                     |
| US-009 Excluir categoria | x   | IT-04           | ST-05 |        | Soft delete; CA-009.03 com contagem real                                                                              |
| US-010 Registrar receita | x   | IT-06           | ST-03 | x      | #10 e #21 resolvidos (PR #42)                                                                                         |
| US-011 Listar receitas   | x   | IT-01           | ST-03 |        |                                                                                                                       |
| US-012 Excluir receita   | x   |                 |       |        |                                                                                                                       |
| US-013 Registrar despesa | x   | IT-06           | ST-02 | x      | #21 resolvido (PR #42)                                                                                                |
| US-014 Listar despesas   | x   | IT-01           | ST-02 |        |                                                                                                                       |
| US-015 Excluir despesa   | x   |                 |       |        |                                                                                                                       |
| US-016 Dashboard         |     | IT-07           | ST-03 | x      | Agregação no cliente; IT-07 sem constraint nem teste                                                                  |

**Total: 16 User Stories, 10 casos de integração (IT), 2 fluxos E2E obrigatórios e 3 opcionais (ST).**

**Cobertura atual: 289 testes automatizados (221 unidade + 24 pg-mem + 17 Supabase local + 27 regressão),
conferidos em 2026-11-05.** Os testes E2E da P3 entram nesta conta quando forem implementados.

Lacunas conhecidas, em ordem de prioridade: IT-03,
IT-08 e IT-09 sem teste, IT-07 sem constraint, US-003/US-012/US-015 sem integração nem E2E.

---

## 5. Ambiente de testes

Os ambientes (local, Preview e Produção) estão em [environments.md](environments.md). Os testes
usam **somente** a máquina local.

| Item              | Definição                                                                                                        |
| :---------------- | :--------------------------------------------------------------------------------------------------------------- |
| Banco             | Supabase CLI local (Postgres 17, `supabase/config.toml`) e pg-mem                                                |
| Autenticação      | Supabase Auth local, com confirmação de e-mail desligada (`enable_confirmations = false`)                        |
| Sessão            | Tokens do Supabase, persistidos no navegador                                                                     |
| Isolamento        | RLS por `auth.uid()`                                                                                             |
| Aplicação (E2E)   | `npm run dev` em `http://localhost:3000`                                                                         |
| Dados             | Sintéticos, criados e removidos pela própria suíte (`tests/helpers/factory.js` e cadastro pela interface no E2E) |
| Serviços externos | Nenhum; no nível de unidade, `supabase` e `fetch` são mockados                                                   |
| Proibido          | Rodar qualquer suíte contra os projetos Supabase de Preview ou de Produção                                       |

A separação por nível:

| Nível                        | Sobe com                         | Cobre                                                   | Não cobre                                             |
| :--------------------------- | :------------------------------- | :------------------------------------------------------ | :---------------------------------------------------- |
| `tests/integration/postgres` | pg-mem (padrão, inclusive no CI) | Constraints, chaves estrangeiras, unicidade, migrations | RLS, GRANT e triggers, descartados ao montar o schema |
| `tests/integration/supabase` | Stack local completa             | RLS, isolamento entre usuários                          | Interface                                             |
| E2E (P3)                     | Stack local + `npm run dev`      | Fluxo completo pela interface                           | Navegadores fora do escolhido; desempenho             |

---

## 6. Riscos e contingências

| Risco                                              | Impacto no teste                                                                                                              | Mitigação                                                                                                            |
| :------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------- |
| **RLS só é criado se `auth.users` existir**        | Alto. Em Postgres puro o RLS nunca é aplicado, e o teste pode passar vazando dados sem acusar erro.                           | RLS só se testa na stack local do Supabase. Nunca só com Postgres puro. Ver IT-01 e IT-02.                           |
| **Teste destrutivo apontado para banco com dados** | Alto. Em 2026-11-04 o `beforeEach` da integração apagou o Supabase local por causa de um `TEST_DATABASE_URL` no `.env.local`. | `db.js` recusa banco com contas com e-mail; a suíte RLS recusa URL não local; o E2E segue a mesma regra.             |
| **Fluxo E2E instável (flaky)**                     | Médio. Esperas por tempo fixo e dados compartilhados entre execuções geram falso negativo.                                    | Usuário próprio por execução, seletores por papel/rótulo acessível e espera por estado, nunca por tempo.             |
| **Teste instrumental por IA não é reprodutível**   | Médio. Duas sessões com o mesmo prompt podem seguir caminhos diferentes.                                                      | Registrar prompt, passos e evidências; usar o instrumental para exploração e diagnóstico, e o script para regressão. |
| **Regressão fora do CI**                           | Médio. Os 27 testes de `tests/regression/` só rodam localmente.                                                               | Incluir `tests/regression` no `test.yml`.                                                                            |
| **Defeitos de sessão no front-end**                | Médio. Cache de sessão nunca limpo e `AuthContext` sem `onAuthStateChange` (AGENTS.md §14.3).                                 | ST-04 os exercita; correção junto com os testes de front-end.                                                        |
| **Invariante `type` não verificada**               | Médio. Um lançamento pode apontar para categoria de tipo oposto, corrompendo o dashboard.                                     | Constraint ou trigger (IT-07). Registrado no plano; issue própria a criar.                                           |
| **Rotas privilegiadas sem teste (IT-08, IT-09)**   | Médio. A validação de token das rotas com `service_role` não é verificada automaticamente.                                    | Testar as rotas, ou eliminar a `service_role` da aplicação (AGENTS.md §14.3).                                        |
| **Front-end fora da cobertura medida (#33)**       | Baixo para a P3. A cobertura de 100% vale só para `src/services/`.                                                            | E2E cobre o comportamento da interface; testes de componente depois da P3.                                           |

Riscos já mitigados: asserções vacuamente verdadeiras no RLS (#66, as leituras comparam o conjunto
exato e a suíte falha com o RLS desligado); suíte sobre código morto (#26), ausência de ambiente de teste
dedicado (#20), contrato de DTO inconsistente (#10, #21), `updated_at` sem trigger e estado vazio
inexistente (#13).

---

## 7. Critérios de entrada e saída

### Entrada

- [x] Código da branch `main` disponível
- [x] Ambiente de teste Supabase funcional e isolado (Supabase CLI local, #20)
- [x] Schema aplicado via migrations
- [x] Dados de teste criados e removidos pela própria suíte
- [x] Testes de unidade das funcionalidades executados e aprovados
- [x] (P3) Ferramenta E2E escolhida: Playwright
- [ ] (P3) Playwright instalado e configurado, com comando documentado

### Saída

- [ ] Todos os casos de aceitação executados
- [ ] Nenhum defeito de prioridade alta ou crítica aberto
- [ ] Testes de unidade e integração concluídos
- [x] Relatório de cobertura gerado em formato `lcov` — `coverage/lcov.info`, 100% em `services/`
- [ ] As User Stories atendem aos próprios critérios de aceitação
- [ ] (P3) ST-01 e ST-02 passando localmente, com evidência no relatório
- [ ] (P3) Sessão de teste instrumental registrada, com análise comparativa
- [ ] (P3) Linha de base de acessibilidade e usabilidade registrada e ≥ 2 melhorias aplicadas

---

## 8. Ferramentas

| Categoria                   | Ferramenta                                               | Uso                                                                                                   |
| :-------------------------- | :------------------------------------------------------- | :---------------------------------------------------------------------------------------------------- |
| Testes unitários            | Jest 30                                                  | Testes de `services/` com o cliente Supabase mockado                                                  |
| Transformação               | `babel-jest` com `jest.babel.config.js`                  | Converte ESM e JSX e resolve os aliases `@/...` (`babel-plugin-module-resolver`)                      |
| Testes de mutação           | Stryker 10 (`npm run test:mutation`)                     | Score 97,10% em `services/` — ver [mutation-testing.md](mutation-testing.md)                          |
| Cobertura                   | Jest `--coverage`, formato `lcov`                        | Relatório consumido pelo SonarQube — ver [sonarqube.md](sonarqube.md)                                 |
| Testes de integração        | Jest + pg-mem e Supabase CLI local                       | IT-01 a IT-10                                                                                         |
| Testes de sistema (E2E)     | Playwright                                               | ST-01 a ST-05 e integração do front-end com rede interceptada (§2.1.2)                                |
| Teste instrumental por IA   | Claude Code + MCP de navegador e/ou Google Antigravity   | Sessão exploratória a partir de um cenário Gherkin                                                    |
| Auditoria de acessibilidade | Lighthouse, axe-core, WAVE ou Pa11y                      | Linha de base e Antes × Depois (WCAG 2.2 A/AA)                                                        |
| Gestão de casos             | GitHub Issues                                            | Rastreabilidade US / CT / RF                                                                          |
| Lint                        | ESLint 9, flat config                                    | `eslint.config.js`. Erro e aviso                                                                      |
| Formatação                  | Prettier 3                                               | Arquivos de staged, via `lint-staged` no `pre-commit`                                                 |
| Padrão de commit            | Commitlint + Husky                                       | Conventional Commits                                                                                  |
| Análise estática            | SonarQube Community Build (LABENS), projeto `spendsmart` | Análise, cobertura LCOV e code smells — ver [sonarqube.md](sonarqube.md)                              |
| Execução contínua           | GitHub Actions                                           | `test.yml` (unidade + pg-mem; job `rls` com Supabase local), `lint.yml`, `sonar.yml` e `mutation.yml` |
| Banco                       | PostgreSQL 17 (Supabase CLI) e pg-mem                    | Persistência e verificação de constraints                                                             |

**Por que o ESLint está na série 9 e não na 10.** O `typescript-eslint@8.70.1` que vem no
`eslint-config-next` não implementa `scopeManager.addGlobals`, exigido pelo ESLint 10. Como o
`peerDependencies` declara suporte a 10, não há aviso de conflito na instalação e o erro só
aparece ao lintar um arquivo nomeado. Demais detalhes em [tooling-decisions.md](tooling-decisions.md).

---

## 9. Papéis e responsabilidades

| Membro                           | Papel no projeto | Responsabilidade nos testes                                                                                    |
| :------------------------------- | :--------------- | :------------------------------------------------------------------------------------------------------------- |
| José Samuel Silva Lima           | Gerente / QA     | Aceitação das iterações, execução e relatório dos casos de aceitação da US do colega, decisão de entrada/saída |
| Marcus Vinícius de Souza Azevedo | Desenvolvedor    | Testes de unidade e integração da própria implementação, cobertura, correção dos achados do SonarQube          |

Distribuição por nível:

| Nível                        | Responsável                                       | Quem revisa                                 |
| :--------------------------- | :------------------------------------------------ | :------------------------------------------ |
| Unidade                      | Desenvolvedor                                     | QA executa `npm test` e confere a cobertura |
| Integração                   | Desenvolvedor                                     | QA confere o resultado no PR                |
| Sistema (E2E)                | Cada integrante, 1 fluxo da US do colega (§2.3.1) | O colega, no PR                             |
| Teste instrumental por IA    | Equipe (divisão no relatório da P3)               | Equipe, na análise comparativa              |
| Usabilidade e acessibilidade | Equipe (divisão no relatório da P3)               | Equipe                                      |
| Aceitação                    | QA (José Samuel)                                  | Product Owner / cliente                     |

Regra de dupla verificação: **ninguém aprova a própria US.** O relatório de Testes de Aceitação de
cada iteração é sempre escrito pelo colega que não desenvolveu a história, conforme
[iteration-plan.md](iteration-plan.md) §3. Na P3, a mesma regra orienta a autoria dos fluxos E2E.

---

## 10. Entregáveis da P3

| Entregável                                                                                                     | Onde                                                      | Situação |
| :------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------- | :------- |
| Issue "P3 - Testes de Sistema, Testes Instrumentais com IA, Usabilidade e Acessibilidade - Grupo <Nome>"       | `bsi-tasks` e repositório do projeto                      | A fazer  |
| Branches da entrega (ex.: `docs/#<id>-testes-sistema-ia`, `test/#<id>-e2e-suite`)                              | Repositório do projeto                                    | A fazer  |
| Pesquisa comparativa de ferramentas E2E e decisão técnica                                                      | `docs/relatorio-testes-sistema-ia.md`                     | A fazer  |
| Pesquisa sobre IA em testes de sistema e teste instrumental                                                    | `docs/relatorio-testes-sistema-ia.md`                     | A fazer  |
| Scripts E2E (ST-01, ST-02) e comando de execução documentado                                                   | `tests/e2e/` e [execution-manual.md](execution-manual.md) | A fazer  |
| Evidências da execução E2E (e job headless no CI, recomendado)                                                 | Relatório e `.github/workflows/test.yml`                  | A fazer  |
| Sessão de teste instrumental por IA e análise comparativa                                                      | `docs/relatorio-testes-sistema-ia.md`                     | A fazer  |
| Auditoria de acessibilidade e de usabilidade (linha de base)                                                   | `docs/relatorio-testes-sistema-ia.md`                     | A fazer  |
| ≥ 2 melhorias de usabilidade/acessibilidade (Antes × Depois)                                                   | PR para `main`, referenciado no relatório                 | A fazer  |
| Links atualizados em `softwaretesting/20262/README.md`                                                         | `bsi-tasks`                                               | A fazer  |
| Texto no SIGAA: grupo, integrantes e usuários do GitHub, issue, PRs, relatório, scripts E2E e PR das melhorias | SIGAA                                                     | A fazer  |

Commits convencionais referenciam a issue da P3 (`#<id>`), e as entregas chegam à `main` por Pull
Request.

---

## 11. Referências

- Modelo BSI - Doc 004 - Plano de Testes. Processo de Desenvolvimento BSI, UFRN, CERS, DCT.
- Modelo YP-Agentic - Plano Geral de Testes (`tacianosilva/engenharia-software/yp-agentic/templates/plano-geral-testes.md`).
- Enunciados da disciplina (`tacianosilva/bsi-tasks`): `softwaretesting/20262/tarefas/README.md`,
  [P2.md](https://github.com/tacianosilva/bsi-tasks/blob/main/softwaretesting/20262/tarefas/P2.md) e
  [P3.md](https://github.com/tacianosilva/bsi-tasks/blob/main/softwaretesting/20262/tarefas/P3.md).
- ISO/IEC 25010:2023 — modelo de qualidade de produto (Capacidade de Interação).
- W3C — Web Content Accessibility Guidelines (WCAG) 2.2.
- Nielsen, J. — 10 Usability Heuristics for User Interface Design.
- [vision.md](vision.md) — escopo, requisitos funcionais (RF01 a RF16) e não funcionais (RNF01 a RNF07).
- [user-stories.md](user-stories.md) — US-001 a US-016 com critérios de aceitação e cenários Gherkin.
- [test-plan-iterations.md](test-plan-iterations.md) — casos de teste por iteração (PTI).
- [test-state-report.md](test-state-report.md) — estado atual da suíte e histórico de falhas.
- [environments.md](environments.md) — ambientes local, Preview e Produção, e regras dos testes.
- [sonarqube.md](sonarqube.md) — configuração do SonarQube e explicação dos painéis.
