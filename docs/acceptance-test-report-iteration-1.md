# Relatório de Testes de Aceitação — Iteração 1

Relatório de QA dos Testes de Aceitação (Testes de Sistema) da Iteração 1 do SpendSmart.
**Escopo oficial: US-010 — Registrar receita**, implementada por Marcus Vinícius, conforme o
[plano da Iteração 1](iteration-1.md) e os casos CT10.01–CT10.05 de
[test-plan-iterations.md](test-plan-iterations.md). Como atividade complementar, o QA executou
também uma **varredura** sobre as demais User Stories do sistema (Seção 6), cujos achados ficam
registrados para as próximas iterações.

---

## 1. Identificação

| Campo                  | Valor                                                              |
| :--------------------- | :----------------------------------------------------------------- |
| QA Engineer / Testador | José Samuel Lima — `@Jose-Samuel-Lima` — jose.lima.146@ufrn.edu.br |
| Desenvolvedor da US    | Marcus Vinícius — `@MViniciusCoffe`                                |
| Escopo oficial         | US-010 — Registrar receita (CT10.01 a CT10.05)                     |
| Escopo complementar    | US-001 a US-005, US-011 a US-016 (varredura)                       |
| Branch testada         | `main`                                                             |
| Commit testado         | `41e0aad` (`docs: corrige acentuação em documentação`)             |
| Data da execução       | 2026-10-06                                                         |

> **Nota de reteste:** os defeitos centrais da US-010 (issues #10 e #21) estão sendo corrigidos
> pelo desenvolvedor na branch da Iteração 1 dele. Este relatório registra o estado **anterior à
> correção**; os cenários reprovados devem ser **reexecutados sobre a branch de correção** assim
> que ela for aberta para QA.

---

## 2. Ambiente de teste e método de execução

| Item      | Valor                                                                                     |
| :-------- | :---------------------------------------------------------------------------------------- |
| SO        | Windows 11                                                                                |
| Node.js   | v24.21.0                                                                                  |
| Aplicação | `npm run next:dev` em `http://localhost:3000`                                             |
| Banco     | Backend Supabase **indisponível no ambiente de teste** (sem credenciais) — ver limitações |
| Suíte     | Jest 30 — 75/75 testes aprovados (65 unidade + 10 integração), 100% em `services/`        |

**Método.** Cada cenário foi avaliado por uma ou mais das vias abaixo, indicadas na coluna
"Evidência" de cada tabela:

1. **Sonda HTTP** — requisições reais contra o servidor em execução (rotas de API e páginas).
2. **Suíte automatizada** — comportamento da camada de serviço verificado pelos testes de
   unidade com o cliente Supabase mockado.
3. **Inspeção estática** — verificação direta do código com referência `arquivo:linha`.

**Limitações declaradas (e o que falta executar manualmente):**

- **⏭️ Cenários que exigem sessão autêntica real** (registrar e excluir lançamentos com
  persistência) não foram executados de ponta a ponta: o ambiente de QA não tem credenciais
  Supabase. Estão marcados como ⏭️ _não executado_, com o fluxo de código verificado por
  inspeção e cobertura da suíte. **Precisam ser executados manualmente em navegador com o
  `.env.development` válido antes do fechamento da iteração.**
- **🚫 CT10.05 e demais casos de isolamento estão bloqueados**: dependem de RLS ativo, que só
  existe na stack local do Supabase CLI (issues #20 e #30). Bloqueio de ambiente, não falha de
  implementação — conforme §10 de [test-plan-iterations.md](test-plan-iterations.md).

---

## 3. Resumo da execução

### 3.1 Escopo oficial — US-010 (5 casos)

| ✅ Passaram | ❌ Falharam | ⏭️ Não executados | 🚫 Bloqueados |
| :---------- | :---------- | :---------------- | :------------ |
| 2           | 2           | 0                 | 1             |

> CT10.02 passou **com ressalva crítica**: a validação existe, mas a máscara de valor corrompe
> entradas com vírgula (BUG-03).

### 3.2 Varredura complementar — demais 11 USs (38 critérios)

| ✅ Passaram | ❌ Falharam | ⏭️ Não executados | 🚫 Bloqueados |
| :---------- | :---------- | :---------------- | :------------ |
| 13          | 4           | 17                | 4             |

Legenda: ✅ Passou · ❌ Falhou · ⏭️ Não executado · 🚫 Bloqueado

---

## 4. Escopo oficial — US-010: Registrar receita

Tela: `pages/rendaPage.js` · Service: `services/transactionService.js`

| ID      | Cenário / Descrição                     | Resultado obtido                                                                                                                           | Status | Evidência                                                                    |
| :------ | :-------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------- | :----- | :--------------------------------------------------------------------------- |
| CT10.01 | Registro válido aparece na listagem     | **A receita é gravada sem título**: o envio usa `fonteRenda`, que não tem input; a listagem exibe o título vazio. Defeito conhecido (#10). | ❌     | `pages/rendaPage.js:68, 152-160, 292`; BUG-01                                |
| CT10.02 | Valor vazio, não numérico ou zero       | Botão desabilitado sem valor positivo e regex bloqueia não numéricos — o cliente bloqueia o envio. **Ressalva crítica** → BUG-03.          | ✅     | `pages/rendaPage.js:19-21, 172-177, 260`; BUG-03 (#32)                       |
| CT10.03 | Detalhe preenchido (regressão #10, #21) | **Título vazio (BUG-01) e Data sempre "Sem dados"**: a tela lê `data`, o service devolve `data_ocorrencia`. Defeito conhecido (#10, #21).  | ❌     | `pages/rendaPage.js:311`; `services/transactionService.js:9`; BUG-01, BUG-02 |
| CT10.04 | Formatação monetária                    | `formatValor` completa as casas no blur; banco tem `numeric(12,2)` com `check (amount > 0)`; dashboard formata em `pt-BR`/`BRL`.           | ✅     | `pages/rendaPage.js:113-122`; `pages/dashboard.js:108-113`                   |
| CT10.05 | Isolamento entre usuários               | Depende de RLS ativo (🚫). **Agravante**: `getTransactions` não filtra `user_id` no service — o isolamento depende 100% do RLS (MEL-05).   | 🚫     | `services/transactionService.js:15-31`; issues #20, #30; MEL-05              |

**Casos de regressão:** CT10.01 e CT10.03 são os casos de regressão das issues #10 e #21 —
executados hoje resultam em **Falhou** com evidência, conforme §10 do PTI; devem virar aprovados
quando a correção do desenvolvedor for entregue.

---

## 5. Bugs encontrados no escopo (US-010)

### BUG-01 — Receita gravada sem título (confirma #10)

| Campo        | Valor                                   |
| :----------- | :-------------------------------------- |
| Caso afetado | CT10.01, CT10.03                        |
| Severidade   | Alta                                    |
| Issue        | Confirma `#10`                          |
| Status       | Aberto — correção em andamento pelo dev |

**Passos para reproduzir:**

1. Entrar na tela de receitas (`/rendaPage`), aba "Adicionar"
2. Preencher "Nome da Renda" com "Salário", valor, categoria e data
3. Acionar "Salvar Renda" e recarregar a listagem

**Esperado:** receita gravada e listada com o título "Salário".

**Obtido:** receita gravada com título **vazio**; a listagem e o detalhe exibem título em branco.

**Evidência:** o input "Nome da Renda" atualiza o estado `nome` (`pages/rendaPage.js:152-160`),
mas o envio usa `titulo: fonteRenda` (`pages/rendaPage.js:68`) e **não existe input vinculado a
`fonteRenda`** em toda a tela — o estado nasce `""` e nunca muda (`pages/rendaPage.js:13`).

---

### BUG-02 — Detalhe de transação sempre vazio (confirma #21)

| Campo        | Valor                                   |
| :----------- | :-------------------------------------- |
| Caso afetado | CT10.03 (também CT13.03, na varredura)  |
| Severidade   | Alta                                    |
| Issue        | Confirma `#21`                          |
| Status       | Aberto — correção em andamento pelo dev |

**Passos para reproduzir:**

1. Entrar na aba "Excluir" de `/rendaPage` (ou `/gastosPage`)
2. Selecionar uma transação cadastrada

**Esperado:** detalhe com Data e Forma de Pagamento preenchidos.

**Obtido:** "Data: Sem dados" (receitas e despesas) e "Forma de Pagamento: Sem dados" (despesas).

**Evidência:** a tela de receitas lê `incomeDetails?.data` (`pages/rendaPage.js:311`) e a de
despesas lê `expenseDetails?.data` e `expenseDetails?.forma_pagamento`
(`pages/gastosPage.js:318, 324`). O DTO do service devolve `data_ocorrencia` e
`metodo_pagamento` (`services/transactionService.js:9, 11`). Os campos lidos nunca existem no
objeto — o fallback "Sem dados" é sempre exibido. Na tela de receitas, `metodo_pagamento`
(`pages/rendaPage.js:317`) coincide com o DTO e funciona.

---

### BUG-03 — Máscara de valor descarta a vírgula e grava valor 100x maior (confirma #32)

| Campo        | Valor                                                             |
| :----------- | :---------------------------------------------------------------- |
| Caso afetado | CT10.02 (também CT13.02, na varredura)                            |
| Severidade   | **Crítica** (grava dado financeiro errado)                        |
| Issue        | Confirma `#32`                                                    |
| Status       | Aberto — **fora do plano de correção da I1; recomendado incluir** |

**Passos para reproduzir:**

1. Entrar em `/rendaPage` ou `/gastosPage`, aba "Adicionar"
2. Digitar no campo Valor: `150,50` (padrão brasileiro)
3. Salvar e conferir o valor gravado

**Esperado:** valor gravado de R$ 150,50 — ou bloqueio/aviso de formato.

**Obtido:** a vírgula é **descartada silenciosamente** e o valor gravado é R$ 15.050,00 (100x).

**Evidência:** a regex `/^\d*(\.\d{0,2})?$/` (`pages/rendaPage.js:173`, `pages/gastosPage.js:180`)
só aceita dígitos e ponto. Ao digitar `150,50`, a vírgula é rejeitada e os dígitos seguintes se
acumulam: `150` → `1505` → `15050`. Nenhum aviso é dado ao usuário. O caso CT10.01 do PTI usa
valor `2500,00` com vírgula — **o próprio dado de teste planejado dispara este bug**.

---

## 6. Varredura complementar (fora do escopo da Iteração 1)

Execução adicional sobre as demais User Stories, registrada para alimentar as próximas
iterações. Mesmas regras de status e evidência da Seção 4.

### 6.1 US-001 — Criar conta · `pages/register.js`, `services/authServices.js`

| ID        | Cenário                                                              | Resultado obtido                                                                                                                             | Status | Evidência                                           |
| :-------- | :------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------- | :----- | :-------------------------------------------------- |
| CA-001.01 | E-mail novo → submeter → conta criada e perfil gravado               | Fluxo de código verificado: `signUp` + `POST /api/createProfile`. Persistência real depende de sessão/backend. Risco de conta órfã → BUG-08. | ⏭️     | `services/authServices.js:6-37`; BUG-04, BUG-08     |
| CA-001.02 | E-mail já cadastrado → "E-mail já cadastrado", nada criado           | Mapeamento de erro presente e coberto por teste de unidade.                                                                                  | ✅     | `services/authServices.js:14-16`; suíte 65/65       |
| CA-001.03 | Senha com menos de 6 caracteres → bloqueio no cliente                | **Nenhum bloqueio no cliente**: input sem `minLength` e `handleRegister` não valida tamanho.                                                 | ❌     | `pages/register.js:86-96, 23-26`; BUG-05 (**novo**) |
| CA-001.04 | Criação bem-sucedida → tela carrega → nenhum erro visível ao usuário | Página de registro renderiza sem erros. Feedback de sucesso via `window.alert` (MEL-03).                                                     | ✅     | Sonda `GET /register → 200`; `pages/register.js:40` |

### 6.2 US-002 — Entrar na conta · `pages/login.js`, `services/authServices.js`

| ID        | Cenário                                                           | Resultado obtido                                                                  | Status | Evidência                                     |
| :-------- | :---------------------------------------------------------------- | :-------------------------------------------------------------------------------- | :----- | :-------------------------------------------- |
| CA-002.01 | Credenciais válidas → redirecionado ao dashboard                  | Fluxo de código verificado (`router.push("/dashboard")`). Depende de sessão real. | ⏭️     | `pages/login.js:39-42`                        |
| CA-002.02 | E-mail inexistente ou senha errada → "E-mail ou senha incorretos" | Mensagem mapeada, sem revelar se o e-mail existe. Coberta por teste de unidade.   | ✅     | `services/authServices.js:53-54`; suíte 65/65 |
| CA-002.03 | E-mail não confirmado → orientação para confirmar                 | Mensagem mapeada e coberta por teste de unidade.                                  | ✅     | `services/authServices.js:57-58`; suíte 65/65 |
| CA-002.04 | Muitas tentativas → aviso de espera                               | Erro 429 mapeado para mensagem de espera. Coberto por teste de unidade.           | ✅     | `services/authServices.js:55-56`; suíte 65/65 |

### 6.3 US-003 — Ver e editar meu perfil · `pages/accountConfig.js`, `services/profileService.js`

| ID        | Cenário                                                 | Resultado obtido                                                                                                  | Status | Evidência                                                                       |
| :-------- | :------------------------------------------------------ | :---------------------------------------------------------------------------------------------------------------- | :----- | :------------------------------------------------------------------------------ |
| CA-003.01 | Sessão válida → abrir tela → dados atuais preenchidos   | **A tela nunca carrega o perfil**: campos iniciam vazios e `profileService` não expõe leitura (sem `getProfile`). | ❌     | `pages/accountConfig.js:12-15`; `services/profileService.js`; BUG-06 (**novo**) |
| CA-003.02 | Dados alterados → salvar → alteração registrada         | `updateProfile` monta o update só com campos preenchidos; coberto por teste de unidade. Depende de sessão.        | ⏭️     | `services/profileService.js:28-44`; suíte 65/65                                 |
| CA-003.03 | Nova senha válida → enviar → senha alterada no Auth     | Chamada `auth.updateUser` verificada; depende de sessão real.                                                     | ⏭️     | `services/profileService.js:15-23`                                              |
| CA-003.04 | Senha atual repetida → usuário avisado sem chamar a API | **Não há comparação com a senha atual**: a API é chamada direto e o erro genérico é exibido. Confirma issue #11.  | ❌     | `services/profileService.js:15-23`; BUG-07 (#11)                                |

### 6.4 US-004 — Excluir minha conta · `pages/accountConfig.js`, `pages/api/deleteAccount.js`

| ID        | Cenário                                                     | Resultado obtido                                                                                                         | Status | Evidência                                                                       |
| :-------- | :---------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------- | :----- | :------------------------------------------------------------------------------ |
| CA-004.01 | Sessão válida → solicitar exclusão → confirmação de sucesso | Fluxo com `window.confirm` + rota autenticada verificado; depende de sessão real.                                        | ⏭️     | `pages/accountConfig.js:47-74`; `services/profileService.js:52-78`              |
| CA-004.02 | Exclusão concluída → dados removidos em cascata             | Cascata declarada nas FKs das migrations; depende de banco real para comprovar.                                          | ⏭️     | `supabase/migrations/001_create_financial_schema.js`                            |
| CA-004.03 | Sem token válido → chamar a rota → operação rejeitada       | **Sem token → 401. Com token inválido → 500 "Usuário inválido ou token expirado"** — token validado antes da ação admin. | ✅     | Sonda HTTP: `DELETE /api/deleteAccount → 401`; `Bearer inválido → 500` (MEL-07) |
| CA-004.04 | Após exclusão → acessar rota privada → devolvido ao login   | Guarda `withAuth` redireciona sem sessão; verificação em navegador pendente.                                             | ⏭️     | `components/utils/withAuth.js:15-23`                                            |

### 6.5 US-005 — Acesso restrito às minhas informações · `components/utils/withAuth.js`, RLS

| ID        | Cenário                                                           | Resultado obtido                                                                                                  | Status | Evidência                                                          |
| :-------- | :---------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------- | :----- | :----------------------------------------------------------------- |
| CA-005.01 | Visitante sem sessão → rota privada → redirecionado ao login      | Redirecionamento implementado **somente no cliente**; o servidor devolve 200 com o shell da página (MEL-04, #24). | ⏭️     | `components/utils/withAuth.js:15-17`; sonda `GET /dashboard → 200` |
| CA-005.02 | Usuário A → ler categorias do usuário B → nenhuma linha           | Depende de RLS ativo; nunca exercitado (issues #20, #30).                                                         | 🚫     | `docs/test-plan.md` §6                                             |
| CA-005.03 | Usuário A → alterar/apagar registro de B → rejeitado              | Depende de RLS ativo; nunca exercitado (issues #20, #30).                                                         | 🚫     | `docs/test-plan.md` §6                                             |
| CA-005.04 | Requisição a `/api/deleteAccount` sem token → 401 e nada acontece | **401 "Não autorizado" retornado; nenhuma ação executada.**                                                       | ✅     | Sonda HTTP: `DELETE /api/deleteAccount → 401`                      |

### 6.6 US-011 — Listar receitas · `pages/rendaPage.js`, `services/transactionService.js`

| ID        | Cenário                                                   | Resultado obtido                                                                                                  | Status | Evidência                                      |
| :-------- | :-------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------- | :----- | :--------------------------------------------- |
| CA-011.01 | Receitas cadastradas → abrir tela → todas aparecem        | Listagem implementada filtrando `tipo === "receita"`; exibição real depende de sessão. Títulos vazios por BUG-01. | ⏭️     | `pages/rendaPage.js:47-49, 290-295`            |
| CA-011.02 | Receitas cadastradas → dashboard soma o total de entradas | Soma verificada no código (`reduce` sobre receitas); conferência visual depende de sessão.                        | ⏭️     | `pages/dashboard.js:79-82`                     |
| CA-011.03 | Receitas de outros usuários → nenhuma aparece             | Depende de RLS (🚫). Mesmo agravante do CT10.05 (MEL-05).                                                         | 🚫     | `services/transactionService.js:15-31`; MEL-05 |

### 6.7 US-012 — Excluir receita · `services/transactionService.js`

| ID        | Cenário                                                         | Resultado obtido                                                          | Status | Evidência                                             |
| :-------- | :-------------------------------------------------------------- | :------------------------------------------------------------------------ | :----- | :---------------------------------------------------- |
| CA-012.01 | Receita minha → excluir → linha removida                        | `deleteTransaction` coberto por teste de unidade; depende de sessão real. | ⏭️     | `services/transactionService.js:113-125`; suíte 65/65 |
| CA-012.02 | Após exclusão → dashboard recalcula → total de entradas diminui | O dashboard recalcula a cada carga; conferência visual depende de sessão. | ⏭️     | `pages/dashboard.js:61-105`                           |

### 6.8 US-013 — Registrar despesa · `pages/gastosPage.js`, `services/transactionService.js`

| ID        | Cenário                                                              | Resultado obtido                                                                                                                            | Status | Evidência                                                                            |
| :-------- | :------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------ | :----- | :----------------------------------------------------------------------------------- |
| CA-013.01 | Categoria, valor, título, data e pagamento → aparece na listagem     | Fluxo verificado; a tela envia `titulo: nome` corretamente (o bug do título é exclusivo da tela de receitas).                               | ⏭️     | `pages/gastosPage.js:74, 159-166`                                                    |
| CA-013.02 | Valor ausente, não numérico ou negativo → navegador impede           | Mesmas validações da tela de receitas. **Ressalva crítica**: máscara rejeita vírgula (BUG-03, #32).                                         | ✅     | `pages/gastosPage.js:18-20, 179-184, 267`; BUG-03 (#32)                              |
| CA-013.03 | Despesa registrada → detalhe → data e forma de pagamento preenchidas | **Ambos sempre "Sem dados"**: a tela lê `data` e `forma_pagamento`; o service devolve `data_ocorrencia` e `metodo_pagamento`. Confirma #21. | ❌     | `pages/gastosPage.js:318, 324`; `services/transactionService.js:9, 11`; BUG-02 (#21) |
| CA-013.04 | Valor gravado → consultar → duas casas decimais                      | `formatValor` + `numeric(12,2)` no banco.                                                                                                   | ✅     | `pages/gastosPage.js:119-129`; `docs/database-schema.md`                             |

### 6.9 US-014 — Listar despesas · `pages/gastosPage.js`, `services/transactionService.js`

| ID        | Cenário                                              | Resultado obtido                                                          | Status | Evidência                                      |
| :-------- | :--------------------------------------------------- | :------------------------------------------------------------------------ | :----- | :--------------------------------------------- |
| CA-014.01 | Despesas cadastradas → abrir tela → todas aparecem   | Listagem implementada filtrando `tipo === "despesa"`; depende de sessão.  | ⏭️     | `pages/gastosPage.js:54-56, 297-301`           |
| CA-014.02 | Despesas cadastradas → dashboard soma saídas e saldo | Soma e saldo verificados no código; conferência visual depende de sessão. | ⏭️     | `pages/dashboard.js:84-89`                     |
| CA-014.03 | Despesas de outros usuários → nenhuma aparece        | Depende de RLS (🚫). Mesmo agravante de MEL-05.                           | 🚫     | `services/transactionService.js:15-31`; MEL-05 |

### 6.10 US-015 — Excluir despesa · `services/transactionService.js`

| ID        | Cenário                                             | Resultado obtido                                                          | Status | Evidência                                             |
| :-------- | :-------------------------------------------------- | :------------------------------------------------------------------------ | :----- | :---------------------------------------------------- |
| CA-015.01 | Despesa minha → excluir → linha removida            | `deleteTransaction` coberto por teste de unidade; depende de sessão real. | ⏭️     | `services/transactionService.js:113-125`; suíte 65/65 |
| CA-015.02 | Após exclusão → dashboard recalcula → saldo aumenta | Recálculo a cada carga do dashboard; depende de sessão.                   | ⏭️     | `pages/dashboard.js:61-105`                           |

### 6.11 US-016 — Consultar o dashboard · `pages/dashboard.js`

| ID        | Cenário                                                        | Resultado obtido                                                                                               | Status | Evidência                                 |
| :-------- | :------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------- | :----- | :---------------------------------------- |
| CA-016.01 | Receitas e despesas → valores formatados em real               | Formatação `Intl.NumberFormat("pt-BR", BRL)`. **Ressalva**: valor zero exibe "Sem dados disponíveis" (MEL-01). | ✅     | `pages/dashboard.js:108-113, 293`         |
| CA-016.02 | Lançamentos por categoria → gráficos refletem os valores reais | Agregação por categoria verificada para os quatro gráficos; filtra valores zerados.                            | ✅     | `pages/dashboard.js:116-227`              |
| CA-016.03 | Usuário sem lançamentos → sem NaN e sem quebra                 | Gráficos retornam `null` com estado vazio; `parseFloat(item.valor \|\| 0)` protege contra NaN.                 | ✅     | `pages/dashboard.js:80, 85, 117, 328-378` |
| CA-016.04 | Falha ao buscar dados → mensagem de erro e não uma tela vazia  | `catch` define mensagem exibida no topo da página. Único ponto do projeto com erro visível ao usuário.         | ✅     | `pages/dashboard.js:98-101, 275`          |

---

## 7. Bugs encontrados na varredura

### BUG-04 — `/api/createProfile` aceita escrita sem token (confirma #29)

| Campo        | Valor                           |
| :----------- | :------------------------------ |
| Caso afetado | CA-001.01 (e RNF04 — segurança) |
| Severidade   | **Crítica** (segurança)         |
| Issue        | Confirma `#29`                  |
| Status       | Aberto                          |

**Passos para reproduzir:**

1. Com o servidor em execução, enviar `POST /api/createProfile` **sem** header `Authorization`,
   com corpo `{"id": "...", "nome_completo": "...", ...}`

**Esperado:** rejeição `401`/`403`, como faz `DELETE /api/deleteAccount`.

**Obtido (sonda real):** a rota **aceita** a requisição e tenta a escrita privilegiada com a
`service_role` — na sonda contra backend indisponível, o retorno foi
`500 {"message":"Erro ao criar perfil","error":"TypeError: fetch failed"}`, e não `401`. Em
produção, o `insert` seria executado.

**Evidência:** `pages/api/createProfile.js:9-28` — não há qualquer leitura de
`req.headers.authorization` nem validação de token (contraste com
`pages/api/deleteAccount.js:14-28`).

---

### BUG-05 — Registro não bloqueia senha com menos de 6 caracteres no cliente (**novo**)

| Campo        | Valor                                               |
| :----------- | :-------------------------------------------------- |
| Caso afetado | CA-001.03                                           |
| Severidade   | Média                                               |
| Issue        | **A abrir** (não documentado antes deste relatório) |
| Status       | Aberto                                              |

**Passos para reproduzir:**

1. Entrar em `/register`
2. Preencher todos os campos com senha de 3 caracteres, ex.: `abc`
3. O botão "Criar conta" fica habilitado e o formulário é submetido

**Esperado:** bloqueio no cliente (critério CA-001.03), sem chamada à API.

**Obtido:** o formulário é enviado; só o Supabase rejeitaria a senha, com mensagem genérica
("Erro ao registrar usuário. Verifique os dados e tente novamente"), que não orienta o usuário.

**Evidência:** input de senha sem `minLength` (`pages/register.js:86-96`) e `handleRegister`
valida apenas presença de campos (`pages/register.js:23-26`); o erro do `signUp` cai no ramo
genérico (`services/authServices.js:17`).

---

### BUG-06 — Tela de perfil nunca exibe os dados atuais (**novo**)

| Campo        | Valor                                               |
| :----------- | :-------------------------------------------------- |
| Caso afetado | CA-003.01                                           |
| Severidade   | Alta                                                |
| Issue        | **A abrir** (não documentado antes deste relatório) |
| Status       | Aberto                                              |

**Passos para reproduzir:**

1. Entrar com usuário cadastrado
2. Abrir `/accountConfig`

**Esperado:** nome, data de nascimento e telefone atuais aparecem preenchidos (CA-003.01).

**Obtido:** todos os campos sempre vazios.

**Evidência:** os estados nascem `""` (`pages/accountConfig.js:12-15`) e **não existe nenhum
`useEffect` de leitura** na página; `services/profileService.js` só expõe `updateProfile` e
`deleteAccount` — não há `getProfile` implementado. O dashboard faz a leitura que falta aqui,
direto no componente (`pages/dashboard.js:35-58`).

---

### BUG-07 — Sem validação de senha idêntica à atual (confirma #11)

| Campo        | Valor          |
| :----------- | :------------- |
| Caso afetado | CA-003.04      |
| Severidade   | Média          |
| Issue        | Confirma `#11` |
| Status       | Aberto         |

**Passos para reproduzir:**

1. Entrar e abrir `/accountConfig`
2. Digitar no campo "Nova Senha" exatamente a senha atual e salvar

**Esperado:** aviso ao usuário **sem** chamar a API (CA-003.04).

**Obtido:** `supabase.auth.updateUser` é chamado diretamente; não há comparação no cliente nem
no service.

**Evidência:** `services/profileService.js:15-23` — não há leitura da senha atual nem
comparação antes da chamada.

---

### BUG-08 — Cadastro sem rollback deixa conta órfã (confirma #25)

| Campo        | Valor                                                            |
| :----------- | :--------------------------------------------------------------- |
| Caso afetado | CA-001.01 (regressão CT01.04 da spec de US-001)                  |
| Severidade   | Alta                                                             |
| Issue        | Confirma `#25`                                                   |
| Status       | Aberto — correção designada ao dev de US-001 (José Samuel) na I1 |

**Passos para reproduzir:**

1. Criar conta com dados válidos
2. Simular falha do `POST /api/createProfile` (ex.: tabela `profiles` indisponível)

**Esperado:** conta removida do Auth (rollback) ou caminho de recuperação.

**Obtido:** a conta permanece no Supabase Auth sem perfil e sem caminho de recuperação; o
usuário recebe "Conta criada, mas houve um problema ao salvar dados adicionais".

**Evidência:** `services/authServices.js:20-35` — o erro do `createProfile` apenas lança
exceção; não há chamada administrativa para desfazer o `signUp`.

---

## 8. Apontamentos de melhoria de negócio

### MEL-01 — Saldo zero é indistinguível de "sem dados"

- **User Story:** US-016
- **Observação:** quando `saldo`, `totalReceitas` ou `totalGastos` valem exatamente `0`, o
  dashboard exibe "Sem dados disponíveis" (`pages/dashboard.js:293, 303, 316`). Um usuário cujas
  receitas empatam com as despesas (saldo real de R$ 0,00) vê a mesma mensagem de quem nunca
  lançou nada.
- **Sugestão:** exibir `R$ 0,00` quando houver lançamentos e reservar "Sem dados disponíveis"
  para a ausência de registros.

### MEL-02 — Campo de valor não aceita o formato brasileiro

- **User Story:** US-010, US-013
- **Observação:** a máscara só aceita ponto como separador decimal (raiz do BUG-03). O usuário
  brasileiro digita vírgula e tem o valor multiplicado por 100 sem aviso.
- **Sugestão:** aceitar vírgula na entrada e converter para ponto antes do `parseFloat`, ou
  usar componente de moeda com máscara `pt-BR`.

### MEL-03 — Feedback ao usuário via `window.alert`

- **User Story:** US-001, US-010, US-013 (e demais fluxos)
- **Observação:** sucesso e erro são comunicados com `alert()`/`window.confirm()` bloqueantes
  (`pages/register.js:40`, `pages/rendaPage.js:78`, `pages/gastosPage.js:47-49`, etc.).
- **Sugestão:** substituir por notificações não bloqueantes (issue #13 já aberta).

### MEL-04 — Proteção de rotas apenas no cliente

- **User Story:** US-005
- **Observação:** a guarda `withAuth` executa no navegador; a sonda `GET /dashboard` retorna
  `200` com o HTML da página mesmo sem sessão. O redirecionamento só acontece depois do
  carregamento no cliente (issue #24).
- **Sugestão:** proteção em middleware/server-side, avaliada junto com a issue #24.

### MEL-05 — Listagem de transações depende 100% do RLS

- **User Story:** US-010 (CT10.05), US-011, US-014
- **Observação:** `getTransactions` faz `select("*")` sem filtrar `user_id`
  (`services/transactionService.js:15-31`). A regra 3 do README ("filtrar por `user_id` em toda
  leitura, além da política") não é seguida neste método — se o RLS falhar ou não existir
  (ambiente local), um usuário vê lançamentos de todos.
- **Sugestão:** adicionar `.eq("user_id", session.user.id)` na consulta, como já se faz na
  criação.

### MEL-06 — Alerta bloqueante quando não há categoria de despesa

- **User Story:** US-013
- **Observação:** ao abrir a aba "Adicionar" sem categoria de despesa cadastrada, um `alert()`
  bloqueante é disparado em cada ciclo de atualização (`pages/gastosPage.js:46-51`).
- **Sugestão:** orientação inline na tela (estado vazio com link para criar categoria), em vez
  de alerta.

### MEL-07 — Token inválido retorna 500 em vez de 401

- **User Story:** US-004
- **Observação:** `DELETE /api/deleteAccount` com token inválido/expirado retorna
  `500 "Usuário inválido ou token expirado"` (sonda real). Semântica HTTP incorreta: falha de
  autenticação não é erro de servidor.
- **Sugestão:** mapear `userError || !user` para `401` (`pages/api/deleteAccount.js:28`).

---

## 9. Parecer do QA

- [x] Todos os cenários executáveis no ambiente foram executados; os demais têm bloqueio
      justificado e passos para execução manual
- [x] Toda falha tem evidência `arquivo:linha` ou sonda HTTP registrada
- [ ] Bugs novos (BUG-05 e BUG-06) ainda não têm issue aberta no repositório — **ação pendente do QA**
- [ ] CT10.05 e casos de isolamento seguem bloqueados até a stack local do Supabase (issue #20)
- [ ] Reteste de CT10.01 e CT10.03 sobre a branch de correção do desenvolvedor

**Resultado consolidado (escopo US-010):** 2 de 5 casos aprovados; 2 reprovados (defeitos
conhecidos #10 e #21, já em correção); 1 bloqueado por ambiente. **Ressalva crítica adicional:**
BUG-03 (#32), que o dado de teste planejado do próprio PTI (`2500,00`) dispara.

**Parecer sobre a US-010 no commit testado:** ☐ Aprovado &nbsp;&nbsp; ☐ Aprovado com ressalvas
&nbsp;&nbsp; ☒ **Reprovado (estado anterior à correção)**

**Justificativa e condições de aceite:** os casos de regressão CT10.01 e CT10.03 falham pelos
defeitos conhecidos #10 e #21 — o plano da iteração já prevê a correção pelo desenvolvedor, e o
critério de saída exige os casos aprovados. O aceite depende de: **(1)** reteste aprovado de
CT10.01 e CT10.03 sobre a branch de correção; **(2)** decisão do time sobre o BUG-03 (#32) —
crítico, fora do plano original da I1, recomendado incluir; **(3)** execução manual dos fluxos
com credenciais válidas (Seção 2) e de CT10.05 quando houver stack com RLS.

---

_Assinatura do QA:_ José Samuel Lima — 2026-10-06
