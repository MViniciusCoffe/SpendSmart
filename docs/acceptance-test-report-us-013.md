# Relatório de Testes de Aceitação — US-013 (Iteração 2)

Relatório de QA dos Testes de Aceitação (Testes de Sistema) da **US-013 — Registrar despesa**,
implementada por Marcus Vinícius, conforme o [plano da Iteração 2](iteration-plan.md) e os casos
CT13.01–CT13.05 de [test-plan-iterations.md](test-plan-iterations.md).

> Este relatório foi produzido como a **atividade de QA da Tarefa 03** (papel de QA do projeto),
> executado sobre a **branch de trabalho do desenvolvedor** (`task/497`, PR #45) — e não sobre a
> `main`, que ainda não contém a entrega da US-013.

---

## 1. Identificação

| Campo                  | Valor                                                                       |
| :--------------------- | :-------------------------------------------------------------------------- |
| QA Engineer / Testador | José Samuel Lima — `@Jose-Samuel-Lima` — jose.lima.146@ufrn.edu.br          |
| Desenvolvedor da US    | Marcus Vinícius — `@MViniciusCoffe`                                         |
| Escopo oficial         | US-013 — Registrar despesa (CT13.01 a CT13.05)                              |
| Branch testada         | `task/497` (PR [#45](https://github.com/MViniciusCoffe/SpendSmart/pull/45)) |
| Commit testado         | `9621777` (`feat: adiciona testes de integração para expenseRegistration`)  |
| Data da execução       | 2026-10-09                                                                  |

---

## 2. Ambiente de teste e método de execução

| Item    | Valor                                                                                  |
| :------ | :------------------------------------------------------------------------------------- |
| SO      | Windows 11                                                                             |
| Node.js | v24.21.0                                                                               |
| Suíte   | Jest 30 — **97 testes, 92 aprovados, 5 reprovados**, 1 suíte vermelha (`authServices`) |
| Banco   | Postgres em memória (pg-mem) para a camada de integração                               |
| Sistema | Backend Supabase **indisponível no ambiente de QA** (sem credenciais) — ver limitações |

**Método.** Cada cenário foi avaliado por uma ou mais das vias abaixo, indicadas na coluna
"Evidência" de cada tabela:

1. **Suíte automatizada** — testes de unidade (cliente Supabase mockado) e de integração de
   persistência (pg-mem).
2. **Inspeção estática** — verificação direta do código com referência `arquivo:linha`.

**Limitações declaradas (e o que falta executar manualmente):**

- **⏭️ Cenários que exigem sessão autêntica real** não foram executados de ponta a ponta: o
  ambiente de QA não tem `.env.development` nem credenciais Supabase (o projeto só versiona
  `.env.development.example`). A persistência foi validada em nível de integração (pg-mem) e o
  fluxo de UI por inspeção. **Precisam ser executados manualmente em navegador com credenciais
  válidas antes do fechamento da iteração.**
- **Branch com suíte vermelha:** a execução de `npm run test:all` **reprova 5 testes de
  `authServices`** (regressão da própria branch — BUG-09). Enquanto a suíte não voltar a verde, o
  critério de saída da iteração ("testes de unidade e integração aprovados") não é atendido.

---

## 3. Resumo da execução

| ✅ Passaram | ❌ Falharam | ⏭️ Não executados |
| :---------- | :---------- | :---------------- |
| 2           | 1           | 2                 |

> **Bloqueio transversal:** além dos cenários abaixo, a **suíte de testes da branch está
> vermelha** (5 falhas em `authServices` — BUG-09), o que por si só impede o aceite.

Legenda: ✅ Passou · ❌ Falhou · ⏭️ Não executado

---

## 4. Escopo oficial — US-013: Registrar despesa

Tela: `pages/gastosPage.js` · Service: `services/transactionService.js`

| ID      | Cenário / Descrição                 | Resultado obtido                                                                                                                                                                                                     | Status | Evidência                                                                                                              |
| :------ | :---------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----- | :--------------------------------------------------------------------------------------------------------------------- |
| CT13.01 | Registro válido aparece na listagem | Persistência validada (pg-mem): a despesa é gravada com título, valor, tipo, categoria, data e pagamento corretos. Exibição na listagem e recálculo de saldo no dashboard apenas por inspeção (sessão indisponível). | ⏭️     | `tests/integration/postgres/expenseRegistration.test.js` (CT13.01); `pages/gastosPage.js:74`; ⏭️ sistema não executado |
| CT13.02 | Valor vazio ou negativo             | Cliente bloqueia envio sem valor positivo; o banco rejeita `amount <= 0` pela constraint `transactions_amount_positive`. **Ressalva crítica**: a máscara rejeita vírgula (BUG-03/#32).                               | ✅     | `pages/gastosPage.js:18-20, 179-184, 267`; teste CT13.02; BUG-03 (#32)                                                 |
| CT13.03 | Detalhe preenchido (regressão #21)  | **Corrigido na base da branch:** a UI lê `data_ocorrencia` e `metodo_pagamento`, que coincidem com o DTO do service. Evidência de persistência no teste de integração; execução final em navegador pendente.         | ⏭️     | `pages/gastosPage.js:318, 324` ↔ `services/transactionService.js:9, 11`; teste CT13.03                                 |
| CT13.04 | Formatação monetária                | Valor persistido com precisão decimal correta (`1234.5` → `1234.50`); formatação `pt-BR`/`BRL` na listagem e no dashboard por inspeção.                                                                              | ✅     | Teste CT13.04; `pages/gastosPage.js:119-129`; `docs/database-schema.md`                                                |
| CT13.05 | Coerência categoria/transação       | **Invariante não existe:** o banco aceita despesa vinculada a categoria de receita (não há constraint cruzando `transactions.type` com `categories.type`). Defeito conhecido do plano (`test-plan.md` §6).           | ❌     | `tests/integration/db.js` (DDL); `docs/test-plan-iterations.md:192`                                                    |

**Caso de regressão:** CT13.03 é a regressão da issue #21. No estado testado, os campos da UI e do
DTO **estão alinhados** — o defeito não se reproduz mais na base da branch. Falta apenas a
confirmação visual em navegador com sessão real.

---

## 5. Bugs e regressões encontradas no escopo

### BUG-09 — Suíte de testes vermelha na branch `task/497` (bloqueador)

| Campo        | Valor                          |
| :----------- | :----------------------------- |
| Caso afetado | Critério de saída da I2        |
| Severidade   | **Crítica** (bloqueia o merge) |
| Issue        | **A abrir**                    |
| Status       | Aberto                         |

**Passos para reproduzir:**

1. `git fetch origin && git switch --track origin/task/497`
2. `npm ci` (se necessário) e `npm run test:all`

**Esperado:** suíte 100% verde.

**Obtido:** `Test Suites: 1 failed, 7 passed, 8 total` · `Tests: 5 failed, 92 passed, 97 total`.

**Suíte vermelha:** `tests/unit/authServices.test.js` — 5 testes reprovados:

| #   | Teste reprovado                                                      | Causa raiz |
| :-- | :------------------------------------------------------------------- | :--------- |
| 1   | `registerUser › cria a conta e devolve o usuario`                    | BUG-11     |
| 2   | `registerUser › envia o perfil para /api/createProfile com o id ...` | BUG-11     |
| 3   | `registerUser › traduz 'already registered' em e-mail ja cadastrado` | BUG-10     |
| 4   | `registerUser › traduz qualquer outro erro de cadastro`              | BUG-10     |
| 5   | `registerUser › traduz falha do /api/createProfile avisando ...`     | BUG-11     |

---

### BUG-10 — Encoding corrompido nas mensagens de `authServices`

| Campo        | Valor                               |
| :----------- | :---------------------------------- |
| Caso afetado | CA-001.02/CA-001.03 (US-001)        |
| Severidade   | Alta (mensagem ilegível ao usuário) |
| Issue        | **A abrir**                         |
| Status       | Aberto                              |

**Passos para reproduzir:**

1. `git switch --track origin/task/497` e abrir `services/authServices.js`
2. Observar as linhas 15 e 17; ou rodar `npm run test:all` e ler as reprovações 3 e 4

**Esperado:** `"E-mail já cadastrado"` e `"Erro ao registrar usuário. Verifique os dados e tente novamente"`.

**Obtido:** `"E-mail jÃ¡ cadastrado"` e `"Erro ao registrar usuÃ¡rio. Verifique os dados e tente novamente"` (mojibake). A branch também adiciona um BOM (`\uFEFF`) no início do arquivo.

**Evidência:** `services/authServices.js:15, 17` (na branch `task/497`).

---

### BUG-11 — Testes de unidade não acompanharam a nova chamada `getSession`

| Campo        | Valor                       |
| :----------- | :-------------------------- |
| Caso afetado | US-001 (regressão de teste) |
| Severidade   | Alta (suíte vermelha)       |
| Issue        | **A abrir**                 |
| Status       | Aberto                      |

**Esperado:** ao passar a enviar o token (`getSession()` + `Authorization: Bearer`), os mocks de
`tests/unit/authServices.test.js` devem devolver uma sessão válida, e o teste do corpo não deve
mais exigir o `id`.

**Obtido:** `Cannot destructure property 'data' of '(intermediate value)' as it is undefined.` —
o mock de `supabase.auth` não define `getSession`, então o destructuring em
`services/authServices.js:20-22` recebe `undefined`.

**Evidência:** `services/authServices.js:20-28`; `tests/unit/authServices.test.js` (não alterado no diff `origin/main...origin/task/497`).

---

## 6. Apontamentos de melhoria de negócio

### MEL-08 — Branch da US-013 mistura escopo da US-001

- **User Story:** US-013 (entrega), US-001 (código carregado junto)
- **Observação:** além de `services/transactionService.js` e do teste de integração da US-013, a
  branch altera `pages/register.js`, `pages/api/createProfile.js` e `services/authServices.js`
  (correções de segurança #25/#29 e validação de senha #43). Isso é legítimo, mas misturar US-001
  com US-013 no mesmo PR **dificulta a rastreabilidade e o QA** (a suíte vermelha é justamente da
  parte de US-001).
- **Sugestão:** separar as correções de US-001 em PR/branch próprios, ou ao menos isolar os testes
  correspondentes.

### MEL-09 — `TypeError` para valor inválido

- **User Story:** US-013
- **Observação:** a branch troca `throw new Error(...)` por `throw new TypeError(...)` para valor
  inválido em `createTransaction`/`updateTransaction` (`services/transactionService.js:54, 102`).
  O restante do projeto usa `Error`; consumidores que capturam `Error` continuam funcionando, mas a
  mudança é de contrato e não tem justificativa registrada.
- **Sugestão:** voltar a `Error` por consistência, ou documentar a intenção (ex.: distinguir erro
  de validação para o chamador).

### MEL-10 — Listagem de transações continua dependente 100% do RLS

- **User Story:** US-014 (e US-013 pelo detalhe)
- **Observação:** `getTransactions` segue sem `.eq("user_id", session.user.id)`
  (`services/transactionService.js:15-30`) — repete a MEL-05 do relatório da I1. A US-013 não
  agrava, mas também não resolve.
- **Sugestão:** aplicar o mesmo filtro por `user_id` já usado na criação.

---

## 7. Parecer do QA

- [x] Todos os cenários executáveis no ambiente foram executados; os demais têm justificativa e passos para execução manual
- [x] Toda falha tem evidência `arquivo:linha` ou saída de comando registrada
- [ ] Bugs novos (BUG-09, BUG-10, BUG-11) ainda sem issue aberta no repositório — **ação pendente do QA**
- [ ] Reteste obrigatório após a branch voltar a verde
- [ ] Execução manual de CT13.01 e CT13.03 em navegador com credenciais válidas

**Resultado consolidado (escopo US-013):** 2 casos aprovados, 1 reprovado (CT13.05 — invariante
inexistente) e 2 não executados de ponta a ponta (CT13.01 e CT13.03, por falta de sessão). A
regressão #21 (CT13.03) **não se reproduz mais** na base da branch. Como bloqueador, a **suíte da
branch está vermelha** (5 falhas em `authServices`).

**Parecer sobre a US-013 no commit testado:** ☐ Aprovado &nbsp;&nbsp; ☐ Aprovado com ressalvas
&nbsp;&nbsp; ☒ **Reprovado — reteste necessário**

**Justificativa e condições de aceite:** a implementação da US-013 está funcional no que foi
possível verificar (persistência íntegra e regressão #21 resolvida), porém a entrega **não atende
ao critério de saída da iteração** porque a própria suíte de testes da branch falha
(BUG-09/BUG-10/BUG-11). O aceite depende de: **(1)** corrigir o encoding e atualizar os testes de
`authServices` até `npm run test:all` ficar verde; **(2)** reteste de CT13.01 e CT13.03 em navegador
com credenciais; **(3)** decisão do time sobre o CT13.05 (invariante categoria×transação), que segue
em aberto no plano de testes.

---

_Assinatura do QA:_ José Samuel Lima — 2026-10-09
