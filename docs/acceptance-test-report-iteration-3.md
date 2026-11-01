# Relatório de Testes de Aceitação — Iteração 3

Relatório de QA dos Testes de Aceitação (Testes de Sistema) da Iteração 3 do SpendSmart.
**Escopo deste documento: US-016 — Consultar o dashboard**, implementada por Marcus Vinícius,
conforme o [plano da Iteração 3](test-plan-iterations.md#62-us-016--consultar-o-dashboard-rf10-a-rf15-agregados)
e os casos CT16.01–CT16.07 de [test-plan-iterations.md](test-plan-iterations.md). A US-002 — Entrar
na conta é tratada na Seção 6, reservada ao QA responsável por essa US.

> **Nota de execução.** A execução ocorreu em 2026-11-01, após o fechamento previsto da I3
> (20/10), sobre o commit `2aac43a` (30/10). O arquivo `src/app/dashboard/page.js` não muda desde
> `33bbfd7` (correção do MEL-01, saldo zero); os commits seguintes da `main` são de documentação,
> CI e dependências.

---

## 1. Identificação

| Campo                  | Valor                                                              |
| :--------------------- | :----------------------------------------------------------------- |
| QA Engineer / Testador | José Samuel Lima — `@Jose-Samuel-Lima` — jose.lima.146@ufrn.edu.br |
| Desenvolvedor da US    | Marcus Vinícius — `@MViniciusCoffe`                                |
| Escopo oficial         | US-016 — Consultar o dashboard (CT16.01 a CT16.07)                 |
| Escopo complementar    | US-002 — Entrar na conta (Seção 6, a preencher)                    |
| Branch testada         | `main`                                                             |
| Commit testado         | `2aac43a` (`build: corrige vulnerabilidades on dependências`)      |
| Data da execução       | 2026-11-01                                                         |

---

## 2. Ambiente de teste e método de execução

| Item         | Valor                                                                               |
| :----------- | :---------------------------------------------------------------------------------- |
| SO           | Windows 11 Home Single Language                                                     |
| Node.js      | v24.21.0                                                                            |
| npm          | 11.19.0                                                                             |
| Next.js      | 16.4.2                                                                              |
| Supabase CLI | 2.122.0                                                                             |
| Navegador    | Google Chrome 156.0.8078.74 (headless, controlado por Playwright)                   |
| Aplicação    | `npm run next:dev` em `http://localhost:3000`                                       |
| Banco        | Supabase local (`supabase start`): Postgres, Auth, Kong e migrations aplicadas      |
| Suíte        | Jest 9 suítes / 210 testes unitários passando; RLS 12/12 passando no ambiente local |

### 2.1 Dados de teste

Contas locais criadas para a execução (senha `QaSenha123!`, descartáveis):

| Usuário | E-mail             | Receitas                               | Despesas                             | Observação                        |
| :------ | :----------------- | :------------------------------------- | :----------------------------------- | :-------------------------------- |
| A       | `qa.a@example.com` | Salário `2500,00` + Freelance `300,00` | Mercado `87,40` + Aluguel `1200,00`  | 4 categorias, 4 lançamentos       |
| B       | `qa.b@example.com` | —                                      | —                                    | Sem categorias e sem lançamentos  |
| C       | `qa.c@example.com` | Salário `1000,00`                      | Mercado `87,40` (categoria excluída) | Saldo `912,60`; testa soft delete |
| D       | `qa.d@example.com` | Receita avulsa `500,00`                | Despesa avulsa `500,00`              | Saldo exatamente zero             |

Os dados foram inseridos com a chave `service_role` apenas no _seed_. A aplicação e as consultas de
isolamento usaram a chave pública (`anon`/publishable), com sessão real de cada usuário.

### 2.2 Método

1. **Execução em navegador real** — as páginas foram abertas no Chrome contra o Next.js e o Supabase
   local em execução. Cada caso seguiu os passos do PTI; a coleta de resultados foi feita por
   asserções no DOM e na instância Chart.js (legendas, dados e callback de tooltip), não por
   inspeção visual de pixels.
2. **Isolamento (CT16.07)** — além da conferência visual dos dois dashboards, o mesmo teste foi
   executado via `@supabase/supabase-js` com a chave pública: leitura das tabelas como A e como B e
   tentativa de escrita de B em nome de A.
3. **Evidências** — capturas de tela em [`docs/evidence/iteration-3/`](evidence/iteration-3/),
   referenciadas em cada caso. Os valores exibidos foram conferidos pelas asserções antes da
   captura.
4. **Falha de dados (CT16.04)** — em vez de derrubar toda a stack, as requisições REST de
   `categories` e `transactions` foram abortadas no navegador, mantendo o Auth ativo. Isso isola
   exatamente a falha de busca de dados do dashboard e evita que o `withAuth` redirecione para o
   login por perda de sessão. O banner exibido foi o mesmo previsto no caso.

**Limitações declaradas:**

- O dashboard não tem teste automatizado no CI (issue #33). A execução foi feita por um harness de
  navegador, mas esse harness não faz parte do repositório nem do pipeline; os casos continuam
  marcados como **Manual** no PTI.
- A verificação foi funcional e de dados; aparência/visual e compatibilidade entre navegadores estão
  fora do escopo do plano.
- O ambiente é de desenvolvimento (`next:dev`), não o build de produção.

---

## 3. Resumo da execução

### 3.1 Escopo oficial — US-016 (7 casos)

| ✅ Passaram | ❌ Falharam | ⏭️ Não executados | 🚫 Bloqueados |
| :---------- | :---------- | :---------------- | :------------ |
| 7           | 0           | 0                 | 0             |

Foram registradas **34 asserções** de apoio (cartões, legendas, tooltips, estados vazios, banner,
RLS). Todas passaram.

### 3.2 Escopo complementar — US-002

| ✅ Passaram | ❌ Falharam | ⏭️ Não executados | 🚫 Bloqueados |
| :---------- | :---------- | :---------------- | :------------ |
| —           | —           | —                 | —             |

Seção reservada ao QA da US-002 (Seção 6); não contabilizada neste parecer.

Legenda: ✅ Passou · ❌ Falhou · ⏭️ Não executado · 🚫 Bloqueado

---

## 4. Escopo oficial — US-016: Consultar o dashboard

Tela: `src/app/dashboard/page.js` · Services: `transactionService.getTransactions()` e
`categoryService.getCategories({ includeDeleted: true })`.

| ID      | Cenário / Descrição                   | Dados de entrada                                                       | Resultado esperado                                                                  | Resultado obtido                                                                                                                                                                                                                                    | Status | Evidência                                                                                                                                 |
| :------ | :------------------------------------ | :--------------------------------------------------------------------- | :---------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| CT16.01 | Saldo e totais formatados             | Usuário A: receitas `2500,00` + `300,00`; despesas `87,40` + `1200,00` | Receitas R$ 2.800,00; Despesas R$ 1.287,40; Saldo R$ 1.512,60                       | Os três cartões exibem **R$ 2.800,00**, **R$ 1.287,40** e **R$ 1.512,60**; os badges do cabeçalho repetem os totais.                                                                                                                                | ✅     | [ct16-01-usuario-a.png](evidence/iteration-3/ct16-01-usuario-a.png)                                                                       |
| CT16.02 | Gráficos por categoria                | Usuário A; passar o mouse sobre as fatias                              | Cada fatia mostra nome, valor em R$ e percentual; soma das fatias = total do cartão | Tooltips: **Aluguel: R$ 1.200,00 (93.2%)**, **Mercado: R$ 87,40 (6.8%)**, **Freelance: R$ 300,00 (10.7%)**, **Salário: R$ 2.500,00 (89.3%)**. Legendas batem com os dados; somas `1287,40` e `2800,00`; tooltip visível nas duas fatias de despesa. | ✅     | [tooltip Aluguel](evidence/iteration-3/ct16-02-tooltip-aluguel.png) · [tooltip Mercado](evidence/iteration-3/ct16-02-tooltip-mercado.png) |
| CT16.03 | Usuário sem lançamentos               | Usuário B, sem nenhum lançamento                                       | Cartões "Sem dados"; gráficos em estado vazio; nenhum NaN; tela não quebra          | Os três cartões exibem **Sem dados**; os cinco gráficos exibem os estados vazios esperados; nenhum `NaN`; nenhum banner de erro.                                                                                                                    | ✅     | [ct16-03-usuario-b-sem-lancamentos.png](evidence/iteration-3/ct16-03-usuario-b-sem-lancamentos.png)                                       |
| CT16.04 | Falha ao buscar dados                 | Abortar as consultas REST e recarregar `/dashboard`                    | Banner "Não foi possível carregar os dados do dashboard." em vez de tela vazia      | Banner exibido com o texto exato; cartões e gráficos ficam em estado vazio, sem quebra. O cliente PostgREST ainda repete a consulta com backoff antes de desistir (ver OBS-02).                                                                     | ✅     | [ct16-04-falha-ao-carregar.png](evidence/iteration-3/ct16-04-falha-ao-carregar.png)                                                       |
| CT16.05 | Categoria excluída com lançamentos    | Usuário C; categoria "Mercado" com uma despesa de `87,40`, excluída    | A despesa continua nos totais e o gráfico mostra "Mercado (deletada)"               | Despesas **R$ 87,40**, saldo **R$ 912,60**; legenda **Mercado (deletada) R$ 87,40**.                                                                                                                                                                | ✅     | [ct16-05-categoria-excluida.png](evidence/iteration-3/ct16-05-categoria-excluida.png)                                                     |
| CT16.06 | Saldo exatamente zero com lançamentos | Usuário D: receita `500,00`; despesa `500,00`                          | Cartão de saldo mostra R$ 0,00, não "Sem dados"                                     | Saldo **R$ 0,00**; receitas **R$ 500,00**; despesas **R$ 500,00**; o cartão não cai no estado "Sem dados".                                                                                                                                          | ✅     | [ct16-06-saldo-zero.png](evidence/iteration-3/ct16-06-saldo-zero.png)                                                                     |
| CT16.07 | Isolamento entre usuários             | Usuários A e B                                                         | Nenhum valor de A aparece para B (filtro por `user_id` + RLS)                       | UI de B não mostra valores nem categorias de A. Via API com a chave pública: A lê 4 categorias e 4 transações; B lê 0 e 0; tentativa de B inserir lançamento com `user_id` de A é rejeitada com `42501`.                                            | ✅     | [dashboard A](evidence/iteration-3/ct16-07-usuario-a.png) · [dashboard B](evidence/iteration-3/ct16-07-usuario-b.png)                     |

### 4.1 Detalhamento das evidências

- **CT16.01** — valores extraídos dos cartões e dos badges do cabeçalho. A formatação usa
  `Intl.NumberFormat("pt-BR", BRL)`; o separador de milhar e a vírgula decimal estão corretos.
- **CT16.02** — a soma das fatias foi comparada com o total do cartão correspondente. As legendas
  de "Despesas por Categoria" e "Receitas por Categoria" foram lidas do DOM; os textos de tooltip
  foram obtidos do callback do Chart.js e conferidos com o mouse sobre as fatias.
- **CT16.03** — estados vazios encontrados: "Sem dados de despesas", "Sem transações de despesa",
  "Sem dados de receitas", "Sem transações de receita" e "Sem dados de transações". Não há `NaN` no
  texto renderizado nem exceção no console.
- **CT16.04** — o banner é o único `role="alert"` de conteúdo da página; o texto foi conferido
  exatamente. As consultas abortadas não deixaram a tela em branco.
- **CT16.05** — a categoria excluída é carregada com `includeDeleted: true`; o sufixo `(deletada)`
  vem de `formatCategoryName`. O valor continua entrando no total de despesas e no saldo.
- **CT16.06** — regressão do MEL-01: `hasTransactions` testa a existência de lançamentos, não
  `balance !== 0` (`src/app/dashboard/page.js:275-276`), por isso o zero é formatado como moeda.
- **CT16.07** — a UI foi conferida com duas sessões distintas; a API confirmou o RLS nas leituras e
  na escrita. O erro `42501` é a rejeição de política de RLS do Postgres.

### 4.2 Rastreabilidade

| Caso    | Critério de aceitação | Cobertura adicional                                 |
| :------ | :-------------------- | :-------------------------------------------------- |
| CT16.01 | CA-016.01             | Formatação monetária `pt-BR`/BRL                    |
| CT16.02 | CA-016.02             | Agregação por categoria e tooltip com percentual    |
| CT16.03 | CA-016.03             | Estado vazio dos cinco gráficos e ausência de `NaN` |
| CT16.04 | CA-016.04             | Erro visível ao usuário em falha de consulta        |
| CT16.05 | CA-016.02             | US-009 (soft delete de categoria)                   |
| CT16.06 | CA-016.01             | Regressão do MEL-01 (saldo zero)                    |
| CT16.07 | CA-016.03             | US-005 / RLS (leitura e escrita entre usuários)     |

---

## 5. Bugs e apontamentos

### 5.1 Bugs encontrados no escopo

Nenhum defeito novo ou bloqueante foi encontrado na US-016. Os sete casos executáveis passaram.

### 5.2 Regressão do MEL-01 — resolvida

O MEL-01 da Iteração 1 (saldo zero indistinguível de "sem dados") foi corrigido em `33bbfd7` e
validado por CT16.06. A tela agora diferencia:

- **sem lançamentos** → cartões "Sem dados";
- **com lançamentos e saldo zero** → **R$ 0,00**.

O comportamento está coberto pelo caso de regressão CT16.06 do plano da I3.

### 5.3 Observações (não bloqueantes)

- **OBS-01 — Dashboard sem teste automatizado no CI.** O front-end continua fora da cobertura
  (issue #33). Os casos CT16 são manuais no PTI; esta execução usou um harness de navegador, mas ele
  não está versionado. Recomenda-se converter os cenários críticos (CT16.01, CT16.03, CT16.06,
  CT16.07) em testes E2E/componente para evitar regressões.
- **OBS-02 — Latência do banner em falha de rede.** O cliente PostgREST repete a consulta algumas
  vezes com backoff exponencial antes de desistir; no teste, o banner apareceu após cerca de 7
  segundos. O critério de aceitação não define prazo e o banner aparece corretamente, mas, se a
  experiência for prioridade, vale desabilitar/limitar as retentativas nessa chamada para dar
  feedback mais rápido.
- **OBS-03 — Escopo da execução.** O CT16.04 foi executado com bloqueio das consultas REST, não com
  `supabase stop`, para preservar a sessão e testar apenas a falha de dados. O comportamento
  observado é o mesmo previsto no critério; a alternativa (derrubar a stack) também levaria ao
  banner, mas poderia redirecionar ao login por falha de Auth.

---

## 6. Escopo complementar — US-002: Entrar na conta

> **Seção reservada.** A US-002 (CT02.01–CT02.07) é avaliada pelo QA responsável por essa US,
> conforme a divisão da Iteração 3, e deve ser preenchida no mesmo formato da Seção 4 antes da
> entrega. Casos, pré-condições e cenários: [test-plan-iterations.md §6.1](test-plan-iterations.md#61-us-002--entrar-na-conta-rf02).

---

## 7. Parecer do QA

- [x] Todos os 7 casos do escopo oficial foram executados
- [x] Toda aprovação tem evidência de execução (asserção + captura de tela)
- [x] Nenhum defeito novo no escopo da US-016
- [x] Regressão do MEL-01 (CT16.06) aprovada
- [x] Isolamento entre usuários (CT16.07) verificado na UI e no RLS real
- [ ] Dashboard sem teste automatizado no CI (issue #33) — **recomendação**, não bloqueio de aceite
- [ ] Seção da US-002 preenchida pelo QA responsável

**Resultado consolidado (US-016):** 7 de 7 casos aprovados; 0 falhas; 0 bloqueios.

**Parecer sobre a US-016 no commit testado:** ☒ **Aprovado** &nbsp;&nbsp; ☐ Aprovado com ressalvas
&nbsp;&nbsp; ☐ Reprovado

**Justificativa e condições de aceite:** os critérios CA-016.01 a CA-016.04 estão atendidos no
commit `2aac43a`, incluindo a regressão do saldo zero e o isolamento por RLS. Não há condição
pendente para o aceite da US-016. As observações da Seção 5.3 são recomendações de evolução
(automação do dashboard e latência do banner), não impedimentos.

---

_Assinatura do QA:_ José Samuel Lima — 2026-11-01
