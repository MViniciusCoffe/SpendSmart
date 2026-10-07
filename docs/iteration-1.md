# Plano da Iteração 1

Plano detalhado da **Iteração 1** do SpendSmart, entrega da P1. Período: **10/09/2026 a
23/09/2026** (14 dias).

Contexto: [iteration-plan.md](iteration-plan.md) (visão geral das 6 iterações) e
[test-plan-iterations.md](test-plan-iterations.md) (casos de teste desta iteração).

---

## 1. Objetivos

1. Especificar e implementar as duas User Stories alocadas na iteração, com testes automatizados.
2. Estabelecer o fluxo de QA contínuo: cada membro testa a US do colega e registra um relatório.
3. Deixar a análise estática do SonarQube limpa para o código entregue.

No aspecto técnico, os testes devem verificar a criação de conta e o registro de receitas no
monolito Next.js + Supabase: chamadas aos services com o cliente mockado (unidade) e persistência
real no banco (integração).

---

## 2. User Stories da iteração

| US         | Título            | Requisitos | Membro responsável | Tamanho | Prioridade |
| :--------- | :---------------- | :--------- | :----------------- | :------ | :--------- |
| **US-001** | Criar conta       | RF01       | José Samuel        | M       | Alta       |
| **US-010** | Registrar receita | RF10       | Marcus Vinícius    | M       | Alta       |

Especificação completa, com critérios de aceitação e cenários BDD/Gherkin, em
[user-stories.md](user-stories.md) e [test-plan-iterations.md](test-plan-iterations.md).

### 2.1 US-001 — Criar conta (José Samuel)

- **Foco:** corrigir a ausência de rollback: se a gravação do perfil falhar, a conta permanece no
  Auth sem perfil e sem caminho de recuperação (issue #25).
- **RF01:** cadastro com nome, e-mail, senha, data de nascimento e telefone; e-mail duplicado
  impedido.
- **Critérios de aceitação:** CA-001.01 a CA-001.04.

### 2.2 US-010 — Registrar receita (Marcus Vinícius)

- **Foco:** corrigir a receita gravada sem título (input ligado a `nome`, envio usa `fonteRenda` —
  issue #10) e a divergência de campos entre UI e service (issue #21).
- **RF10:** registro com categoria, valor, título, data e forma de pagamento.
- **Critérios de aceitação:** CA-010.01 a CA-010.04.

---

## 3. Tarefas distribuídas

### 3.1 José Samuel — US-001

| #   | Tarefa                                                            | Entregável                                                   |
| :-- | :---------------------------------------------------------------- | :----------------------------------------------------------- |
| 1   | Especificar US-001 com cenários Gherkin (`Dado / Quando / Então`) | Atualização de `user-stories.md` e `test-plan-iterations.md` |
| 2   | Implementar rollback do cadastro (Auth + perfil)                  | Código na branch da issue do projeto                         |
| 3   | Escrever testes de unidade do fluxo de cadastro com mocks         | Casos em `tests/unit/authServices.test.js`                   |
| 4   | Escrever ao menos um teste de integração do cadastro              | `tests/integration/` (ambiente: issue #20)                   |
| 5   | Cobertura e análise estática                                      | `npm run test:coverage` + SonarQube verde                    |
| 6   | **Executar a spec de QA da US-010 de Marcus**                     | Relatório de Testes de Aceitação (QA)                        |
| 7   | Abrir o PR do projeto com implementação, testes e link do QA      | Pull Request                                                 |

### 3.2 Marcus Vinícius — US-010

| #   | Tarefa                                                                | Entregável                                                   |
| :-- | :-------------------------------------------------------------------- | :----------------------------------------------------------- |
| 1   | Especificar US-010 com cenários Gherkin                               | Atualização de `user-stories.md` e `test-plan-iterations.md` |
| 2   | Corrigir o título não gravado (#10) e alinhar o contrato de DTO (#21) | Código na branch da issue do projeto                         |
| 3   | Escrever/ampliar testes de unidade de `transactionService` com mocks  | Casos em `tests/unit/transactionService.test.js`             |
| 4   | Escrever ao menos um teste de integração do registro de receita       | `tests/integration/` (ambiente: issue #20)                   |
| 5   | Cobertura e análise estática (limpar code smells apontados)           | `npm run test:coverage` + SonarQube verde                    |
| 6   | **Executar a spec de QA da US-001 de José**                           | Relatório de Testes de Aceitação (QA)                        |
| 7   | Abrir o PR do projeto com implementação, testes e link do QA          | Pull Request                                                 |

---

## 4. Cronograma

| Período       | José Samuel                     | Marcus Vinícius                 |
| :------------ | :------------------------------ | :------------------------------ |
| 10/09 a 11/09 | Especificação Gherkin da US-001 | Especificação Gherkin da US-010 |
| 12/09 a 16/09 | Implementação do rollback (#25) | Correções #10 e #21             |
| 17/09 a 19/09 | Testes de unidade + integração  | Testes de unidade + integração  |
| 20/09 a 21/09 | **QA da US-010** + relatório    | **QA da US-001** + relatório    |
| 22/09 a 23/09 | Ajustes, SonarQube e PR         | Ajustes, SonarQube e PR         |

---

## 5. Critérios de entrada

- [x] Código da branch `main` disponível
- [ ] Especificação das US-001 e US-010 com cenários Gherkin
- [ ] Suíte de unidade existente e passando (base: 65 testes — ver
      [test-state-report.md](test-state-report.md))
- [ ] Ambiente de integração disponível (issue #20)
- [ ] Análise estática configurada no LABENS

## 6. Critérios de saída

- [ ] 100% dos casos de teste de aceitação da iteração executados
      ([test-plan-iterations.md](test-plan-iterations.md))
- [ ] Nenhum defeito de prioridade alta ou crítica aberto nas US da iteração
- [ ] Testes de unidade e pelo menos um teste de integração concluídos por membro
- [ ] Cobertura gerada (`coverage/lcov.info`) e SonarQube sem code smells novos
- [ ] US-001 e US-010 atendem aos próprios critérios de aceitação
- [ ] Relatórios de QA trocados entre os membros

---

## 7. Entregáveis da iteração

| Entregável                                        | Onde                                        |
| :------------------------------------------------ | :------------------------------------------ |
| Issue individual (Tarefa 02)                      | `tacianosilva/bsi-tasks`                    |
| `tarefa02.md` com links                           | `softwaretesting/20262/tarefas/<username>/` |
| PR da implementação no projeto do grupo           | Este repositório                            |
| Relatório de Testes de Aceitação (QA)             | `docs/` do repositório do grupo             |
| Atualização de `user-stories.md` (spec + Gherkin) | `docs/user-stories.md`                      |

---

## 8. Riscos da iteração

| Risco                                                                                   | Ação mitigatória                                                                                   |
| :-------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------- |
| `tests/integration/` não existe e a stack local do Supabase não foi montada (issue #20) | Pré-requisito da iteração: montar o ambiente antes de 17/09 ou registrar formalmente o impedimento |
| Correções em US-010 e US-013 compartilham a issue #21 (contrato de DTO)                 | Resolver o DTO em I1 para destravar I2                                                             |
| QA depende da branch do colega                                                          | Trocar branches até 20/09; relatório com passos de reprodução                                      |
