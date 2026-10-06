# Plano de Teste das Iterações 1 e 2 (PTI)

Plano de Teste das Iterações 1 e 2 do SpendSmart, entrega da P2, no modelo YP-Agentic. Cobre as
User Stories alocadas em [iteration-plan.md](iteration-plan.md) §2 para os períodos 10/09–23/09/2026
(I1) e 24/09–06/10/2026 (I2).

Requisitos de cada caso: **ID, pré-condições, passos de execução, dados de entrada e resultado
esperado**. Os cenários de aceitação estão também em sintaxe BDD/Gherkin, para uso direto nas
Tarefas 02 e 03 da disciplina.

---

## 1. Identificação e objetivos

| Campo      | Valor                                    |
| :--------- | :--------------------------------------- |
| Projeto    | SpendSmart                               |
| Documento  | Plano de Teste das Iterações 1 e 2 (PTI) |
| Iteração 1 | 10/09/2026 a 23/09/2026 (US-001, US-010) |
| Iteração 2 | 24/09/2026 a 06/10/2026 (US-007, US-013) |
| Entrega    | P2 — Planos de Teste e CI com SonarQube  |
| Unidade 1  | 17/08/2026 a 06/10/2026                  |

### Objetivos

- Definir, para cada User Story alocada, casos de teste com pré-condições, passos, dados de entrada
  e resultado esperado, cobrindo os critérios de aceitação de [user-stories.md](user-stories.md).
- Executar os 17 casos planejados nas duas iterações e registrar as evidências no Relatório de
  Testes de Aceitação, escrito pelo QA que não desenvolveu a história.
- Registrar os defeitos conhecidos (issues #10, #21, #25) como casos de regressão, transformando-os
  em aprovados quando as issues forem resolvidas.
- Exercitar o isolamento entre usuários (RLS) sempre que os casos de regressão de isolamento forem
  executáveis no ambiente local do Supabase (issue #20).

---

## 2. Cronograma

| Milestone               | I1                 | I2                 |
| :---------------------- | :----------------- | :----------------- |
| Desenvolvimento da US   | US-001 e US-010    | US-007 e US-013    |
| Testes de unidade       | até 20/09/2026     | até 02/10/2026     |
| Execução dos casos (QA) | 21/09 a 23/09/2026 | 04/10 a 06/10/2026 |
| Relatório de aceitação  | 23/09/2026         | 06/10/2026         |
| Revisão e fechamento    | 23/09/2026         | 06/10/2026         |

---

## 3. Escopo

| Iteração | US     | Título            | Requisitos | Responsável     |
| :------- | :----- | :---------------- | :--------- | :-------------- |
| I1       | US-001 | Criar conta       | RF01       | José Samuel     |
| I1       | US-010 | Registrar receita | RF10       | Marcus Vinícius |
| I2       | US-007 | Listar categorias | RF07       | José Samuel     |
| I2       | US-013 | Registrar despesa | RF13       | Marcus Vinícius |

**Fora do escopo:** visual/aparência, testes de carga, compatibilidade de navegadores — conforme
[test-plan.md](test-plan.md) §1.2.

### Pré-condições gerais

Valem para todos os casos, salvo indicação no caso:

- Aplicação implantada em ambiente de homologação acessível ao testador.
- Banco com schema aplicado por migrations e dados de teste sintéticos preparados.
- Navegador logado em uma sessão válida, quando o caso exigir usuário autenticado.
- Contas de teste deduplicadas entre execuções (e-mail único por execução).

---

## 4. Iteração 1

### 4.1 US-001 — Criar conta (RF01)

**Pré-condições específicas:** e-mail `novo.usuario@exemplo.com` ainda não cadastrado; e-mail
`duplicado@exemplo.com` já cadastrado.

**Cenários Gherkin**

```gherkin
Cenário: Cadastro com sucesso
  Dado que sou um visitante no formulário de cadastro
  Quando submeto nome, e-mail inexistente, senha válida, data de nascimento e telefone
  Então a conta é criada, o perfil é gravado e nenhum erro aparece

Cenário: E-mail já cadastrado
  Dado que sou um visitante no formulário de cadastro
  Quando submeto um e-mail já cadastrado
  Então vejo a mensagem "E-mail já cadastrado" e nenhuma conta é criada

Cenário: Senha curta
  Dado que sou um visitante no formulário de cadastro
  Quando submeto uma senha com menos de 6 caracteres
  Então o envio é bloqueado no cliente antes de qualquer chamada à rede
```

| ID      | Cenário / Descrição                    | Passos para execução                                                                                   | Dados de entrada                                                                   | Resultado esperado                                                                                     | Tipo   |
| :------ | :------------------------------------- | :----------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- | :----- |
| CT01.01 | Cadastro com dados válidos             | 1. Abrir cadastro<br>2. Preencher campos<br>3. Submeter<br>4. Conferir redirecionamento                | Nome "Teste Um"; `novo.usuario@exemplo.com`; `senha123`; 01/01/1995; `84999990001` | Conta criada, perfil gravado, redireciona sem erros                                                    | Auto   |
| CT01.02 | E-mail duplicado                       | 1. Repetir CT01.01 com e-mail já cadastrado<br>2. Ler a mensagem exibida                               | `duplicado@exemplo.com` + demais campos válidos                                    | Mensagem "E-mail já cadastrado"; nenhuma conta nova; contagem de usuários inalterada                   | Manual |
| CT01.03 | Senha com menos de 6 caracteres        | 1. Preencher campos com senha curta<br>2. Submeter<br>3. Observar a rede                               | Senha `abc12`                                                                      | Envio bloqueado no cliente; nenhuma requisição enviada                                                 | Manual |
| CT01.04 | Falha na gravação do perfil (rollback) | 1. Simular falha do `insert` em `profiles` (mock ou banco indisponível)<br>2. Submeter cadastro válido | E-mail válido; serviço de perfil falhando                                          | **Defeito conhecido:** conta nasce sem perfil (issue #25). Esperado: rollback total e mensagem de erro | Manual |

> CT01.04 cobre o limite conhecido da US-001 e é o principal teste de regressão da iteração.

### 4.2 US-010 — Registrar receita (RF10)

**Pré-condições específicas:** sessão autenticada; usuário com ao menos duas categorias de tipo
`receita`.

**Cenários Gherkin**

```gherkin
Cenário: Registrar receita
  Dado que estou autenticado na tela de receitas
  Quando informo categoria, valor, título, data e forma de pagamento
  Então a receita aparece na listagem com todos os campos preenchidos

Cenário: Valor inválido
  Dado que estou autenticado na tela de receitas
  Quando submeto um valor vazio, não numérico ou zero
  Então o envio é bloqueado no cliente

Cenário: Detalhe da receita
  Dado que registrei uma receita
  Quando abro o detalhe dela
  Então título, data e forma de pagamento são exibidos
```

| ID      | Cenário / Descrição                      | Passos para execução                                                                                                      | Dados de entrada                                                            | Resultado esperado                                                                                                                       | Tipo   |
| :------ | :--------------------------------------- | :------------------------------------------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------- | :----- |
| CT10.01 | Registro válido                          | 1. Abrir tela de receitas<br>2. Preencher categoria, valor, título, data e pagamento<br>3. Salvar<br>4. Conferir listagem | Categoria "Salário"; valor `2500,00`; título "Pagamento"; 05/10/2026; "Pix" | Receita visível na listagem; total de entradas recalculado                                                                               | Auto   |
| CT10.02 | Valor vazio, não numérico ou zero        | 1. Submeter formulário sem valor / com `abc` / com `0`<br>2. Observar envio                                               | Campos válidos, valor inválido                                              | Cliente bloqueia o envio; nada é persistido                                                                                              | Manual |
| CT10.03 | Detalhe preenchido (regressão #10 e #21) | 1. Registrar receita (CT10.01)<br>2. Abrir o detalhe do lançamento                                                        | Receita gravada                                                             | **Defeito conhecido:** título e data divergem entre UI e service (issues #10, #21). Esperado: título, data e forma de pagamento exibidos | Manual |
| CT10.04 | Formatação monetária                     | 1. Registrar receita<br>2. Ler o valor na listagem e no dashboard                                                         | Valor `1234,5`                                                              | Valor com 2 casas decimais, nunca negativo, em R$                                                                                        | Auto   |
| CT10.05 | Isolamento entre usuários                | 1. Registrar receita como usuário A<br>2. Listar como usuário B                                                           | Duas contas de teste                                                        | Usuário B não vence nenhuma linha de A (filtro + RLS)                                                                                    | Manual |

---

## 5. Iteração 2

### 5.1 US-007 — Listar categorias (RF07)

**Pré-condições específicas:** usuário com categorias de receita e despesa cadastradas; usuário sem
categorias.

**Cenários Gherkin**

```gherkin
Cenário: Listagem do próprio usuário
  Dado que estou autenticado na tela de categorias
  Quando a tela carrega
  Então vejo apenas as minhas categorias, com o tipo traduzido

Cenário: Usuário sem categorias
  Dado que estou autenticado e não tenho categorias
  Quando a tela carrega
  Então vejo a indicação de que não há registros
```

| ID      | Cenário / Descrição       | Passos para execução                                            | Dados de entrada         | Resultado esperado                                                                | Tipo   |
| :------ | :------------------------ | :-------------------------------------------------------------- | :----------------------- | :-------------------------------------------------------------------------------- | :----- |
| CT07.01 | Listagem com dados        | 1. Autenticar<br>2. Abrir tela de categorias                    | Usuário com 3 categorias | Somente as categorias do usuário aparecem, com tipo traduzido                     | Auto   |
| CT07.02 | Estado vazio              | 1. Autenticar com usuário novo<br>2. Abrir tela de categorias   | Usuário sem categorias   | **Defeito conhecido:** não há estado vazio. Esperado: mensagem "não há registros" | Manual |
| CT07.03 | Isolamento entre usuários | 1. Listar como usuário A<br>2. Trocar de sessão para B e listar | Duas contas de teste     | Nenhuma categoria de A aparece para B                                             | Manual |

### 5.2 US-013 — Registrar despesa (RF13)

**Pré-condições específicas:** sessão autenticada; categoria de tipo `despesa` existente.

**Cenários Gherkin**

```gherkin
Cenário: Registrar despesa
  Dado que estou autenticado na tela de despesas
  Quando informo categoria, valor, título, data e forma de pagamento
  Então a despesa aparece na listagem

Cenário: Detalhe da despesa
  Dado que registrei uma despesa
  Quando abro o detalhe dela
  Então data e forma de pagamento são exibidos
```

| ID      | Cenário / Descrição                | Passos para execução                                                                              | Dados de entrada                                                          | Resultado esperado                                                                                                                                                         | Tipo   |
| :------ | :--------------------------------- | :------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----- |
| CT13.01 | Registro válido                    | 1. Abrir tela de despesas<br>2. Preencher categoria, valor, título, data e pagamento<br>3. Salvar | Categoria "Mercado"; valor `87,40`; título "Compra"; 06/10/2026; "Débito" | Despesa visível na listagem; total de saídas e saldo recalculados                                                                                                          | Auto   |
| CT13.02 | Valor negativo ou vazio            | 1. Submeter com valor `-10` / vazio<br>2. Observar envio                                          | Campos válidos, valor inválido                                            | Cliente bloqueia o envio; nada é persistido                                                                                                                                | Manual |
| CT13.03 | Detalhe preenchido (regressão #21) | 1. Registrar despesa (CT13.01)<br>2. Abrir o detalhe                                              | Despesa gravada                                                           | **Defeito conhecido:** a UI lê `data`/`forma_pagamento` e o service devolve `data_ocorrencia`/`metodo_pagamento` (issue #21). Esperado: data e forma de pagamento exibidas | Manual |
| CT13.04 | Formatação monetária               | 1. Registrar despesa<br>2. Ler valor na listagem e no dashboard                                   | Valor `1234,5`                                                            | Valor com 2 casas decimais, em R$                                                                                                                                          | Auto   |
| CT13.05 | Coerência categoria/transação      | 1. Registrar despesa vinculada a categoria de receita (burlando a validação)                      | Tipo de categoria oposto                                                  | **Invariante não existe hoje** (`test-plan.md` §6). Esperado: rejeição                                                                                                     | Manual |

---

## 6. Rastreabilidade

| US     | Casos           | RF   | Defeitos de regressão |
| :----- | :-------------- | :--- | :-------------------- |
| US-001 | CT01.01–CT01.04 | RF01 | #25                   |
| US-010 | CT10.01–CT10.05 | RF10 | #10, #21              |
| US-007 | CT07.01–CT07.03 | RF07 | —                     |
| US-013 | CT13.01–CT13.05 | RF13 | #21                   |

**Total: 4 US, 17 casos de teste** (10 manuais, 4 automáticos de unidade, 3 manuais com
verificação de isolamento).

---

## 7. Critérios de entrada e saída

### 7.1 Entrada (quando os testes podem iniciar)

- [ ] Código das US da iteração disponível na branch destinada aos testes
- [ ] Testes de unidade das funcionalidades executados e aprovados
- [ ] Ambiente de homologação atualizado e funcional
- [ ] Banco aplicado por migrations e dados de teste preparados
- [ ] Casos de teste revisados pelo QA que vai executá-los

### 7.2 Saída (quando a iteração é aceita)

- [ ] 100% dos 17 casos planejados executados
- [ ] Todos os casos obrigatórios com resultado aprovado ou reprovação formal registrada
- [ ] Nenhum bug de prioridade Alta ou Crítica aberto nas US da iteração
- [ ] Testes de unidade e ao menos um de integração concluídos por membro
- [ ] Relatório de Testes de Aceitação (QA) gerado e anexado ao PR
- [ ] SonarQube sem code smells novos no código entregue

---

## 8. Riscos

| Risco                                                                      | Impacto                          | Mitigação / Contingência                                                                                       |
| :------------------------------------------------------------------------- | :------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| RLS não ativo no banco local (`to_regclass('auth.users')` não é criado)    | Alto. Isolamento não exercitado  | CT07.03 e CT10.05 rodam apenas na stack local do Supabase; sem ela, registrar como **bloqueada** (issue #20).  |
| Defeitos conhecidos das US (issues #10, #21, #25) podem falhar na execução | Médio. Confundir plano reprovado | Casos marcados **Defeito conhecido** devem resultar em "Falhou" com evidência, sem reprovar o plano.           |
| Datas das iterações 3 a 6 ainda não conciliadas com o usuário              | Baixo. Atraso no planejamento    | Nenhum impacto na I1/I2; revisar o cronograma na reunião de fechamento da unidade 1.                           |
| Falta de dupla verificação (QA aprova a própria US)                        | Médio. Vaidade no aceite         | Regra de [test-plan.md](test-plan.md) §9: relatório sempre escrito pelo colega que não desenvolveu a história. |
| Falha de ambiente (banco indisponível, migrations não aplicadas)           | Médio. Bloqueio de execução      | Critérios de entrada (§7.1) devem estar marcados antes de iniciar; re-seed dos dados sintéticos.               |

---

## 9. Referências

- Modelo BSI - Doc 005 - Plano de Testes da Iteração. Processo de Desenvolvimento BSI, UFRN, CERS, DCT.
- Modelo YP-Agentic - Plano de Teste da Iteração (`tacianosilva/engenharia-software/yp-agentic/templates/plano-teste-iteracao.md`).
- [test-plan.md](test-plan.md) — plano geral, níveis de teste, matriz US x CT e riscos.
- [user-stories.md](user-stories.md) — critérios de aceitação de US-001, US-007, US-010 e US-013.
- [iteration-plan.md](iteration-plan.md) — cronograma das 6 iterações e distribuição de US.
- [test-state-report.md](test-state-report.md) — estado atual da suíte e defeitos conhecidos.
- Enunciados da disciplina: `softwaretesting/20262/tarefas/P2.md` e `P3.md` (`tacianosilva/bsi-tasks`).

---

## 10. Observações

- Os casos marcados como **Defeito conhecido** documentam o comportamento atual esperado de falhar;
  executá-los hoje deve resultar em **Falhou**, com evidência, e não em reprovação do plano. Eles
  se transformam em aprovados quando as issues correspondentes forem resolvidas.
- CT07.03, CT10.05 e casos de isolamento dependem de RLS ativo: só rodam contra a stack local do
  Supabase (issue #20). Sem esse ambiente, registrar a execução como **bloqueada** e não como
  aprovada.
- A execução dos casos de aceitação manual segue o fluxo principal de
  [test-plan.md](test-plan.md) §2.3.
