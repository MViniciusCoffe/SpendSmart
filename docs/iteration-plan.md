# Plano de Iterações Geral

Plano das entregas do SpendSmart no semestre 2026.2 da disciplina de Testes de Software: **6
iterações**, distribuídas em 3 unidades (2 iterações por unidade).

Regra obrigatória da entrega P1: **cada membro recebe pelo menos uma User Story por iteração.**
A distribuição abaixo respeita a regra em todas as 6 iterações.

As User Stories estão em [user-stories.md](user-stories.md); os testes de aceitação das iterações 1
e 2 estão em [test-plan-iterations.md](test-plan-iterations.md); o plano detalhado da iteração 1
está em [iteration-1.md](iteration-1.md).

---

## 1. Calendário

| Unidade | Iteração | Período                 | Situação               |
| :------ | :------- | :---------------------- | :--------------------- |
| 1       | **I1**   | 10/09/2026 a 23/09/2026 | Definida               |
| 1       | **I2**   | 24/09/2026 a 06/10/2026 | Definida               |
| 2       | **I3**   | 07/10/2026 a 20/10/2026 | Proposta — a conciliar |
| 2       | **I4**   | 21/10/2026 a 03/11/2026 | Proposta — a conciliar |
| 3       | **I5**   | 04/11/2026 a 17/11/2026 | Proposta — a conciliar |
| 3       | **I6**   | 18/11/2026 a 01/12/2026 | Proposta — a conciliar |

As iterações 1 e 2 cobrem o período das entregas P1, P2, Tarefa 02 e Tarefa 03 (todas com prazo em
06/10/2026). Os períodos das iterações 3 a 6 são propostas de continuidade e serão ajustados quando
as unidades 2 e 3 forem conciliadas.

---

## 2. Distribuição de User Stories por iteração e membro

| Iteração  | José Samuel (Gerente / QA)                      | Marcus Vinícius (Desenvolvedor)            | Total de US |
| :-------- | :---------------------------------------------- | :----------------------------------------- | :---------- |
| **I1**    | US-001 — Criar conta                            | US-010 — Registrar receita                 | 2           |
| **I2**    | US-007 — Listar categorias                      | US-013 — Registrar despesa                 | 2           |
| **I3**    | US-002 — Entrar na conta                        | US-016 — Consultar o dashboard             | 2           |
| **I4**    | US-003 — Ver e editar perfil                    | US-011, US-012 — Listar e excluir receitas | 3           |
| **I5**    | US-004, US-006 — Excluir conta, criar categoria | US-014, US-015 — Listar e excluir despesas | 4           |
| **I6**    | US-005, US-008 — Privacidade, alterar categoria | US-009 — Excluir categoria                 | 3           |
| **Total** | 8 US                                            | 8 US                                       | 16          |

Verificações da regra:

- **Todo membro tem pelo menos 1 US em toda iteração.** ✅
- **As 16 US-001 a US-016 são alocadas exatamente uma vez.** ✅
- Rastreabilidade RF -> US está fechada em [user-stories.md](user-stories.md) (seção
  "Rastreabilidade"); aqui a distribuição cobre as 16 US.

### 2.1 Justificativa da alocação

- **I1 e I2 (entregas Tarefa 02 / Tarefa 03):** as US escolhidas têm trabalho real de implementação
  identificado — US-001 cobre o rollback do cadastro (issue #25) e US-010/US-013 cobrem os defeitos
  #10 e #21 de contrato entre UI e service. São as US com defeitos conhecidos mais bem definidos.
- **I3 e I4:** fecham o bloco de visualização (dashboard) e o bloco de receitas.
- **I5 e I6:** fecham conta, privacidade (RLS — depende do ambiente da issue #20) e categorias.

---

## 3. O que cada iteração entrega

Cada iteração segue o mesmo fluxo, copiado das instruções das Tarefas 02 e 03 da disciplina:

| Etapa                                           | Papel         | Entrega                                                              |
| :---------------------------------------------- | :------------ | :------------------------------------------------------------------- |
| 1. Especificação da US com cenários BDD/Gherkin | Analista/Dev  | Atualização de [user-stories.md](user-stories.md)                    |
| 2. Implementação da funcionalidade              | Desenvolvedor | Código na branch da issue do projeto                                 |
| 3. Testes de unidade com mocks                  | Desenvolvedor | Suíte em `tests/unit/`                                               |
| 4. Pelo menos 1 teste de integração             | Desenvolvedor | Suíte de integração (ver §5)                                         |
| 5. Cobertura e SonarQube limpo                  | Desenvolvedor | `npm run test:coverage` + análise verde no LABENS                    |
| 6. QA da US do colega                           | QA Engineer   | Relatório de Testes de Aceitação no repositório do grupo             |
| 7. Pull Request                                 | Desenvolvedor | PR no repositório do projeto com implementação + testes + link do QA |

### 3.1 Tarefas da disciplina vinculadas

| Iteração | Tarefa individual | Conteúdo                                                |
| :------- | :---------------- | :------------------------------------------------------ |
| I1       | Tarefa 02         | Implementar US-001 ou US-010 + fazer QA da US do colega |
| I2       | Tarefa 03         | Implementar US-007 ou US-013 + fazer QA da US do colega |

---

## 4. Dependências entre iterações

| Iteração | Depende de                                        | Por quê                                                                               |
| :------- | :------------------------------------------------ | :------------------------------------------------------------------------------------ |
| I1       | Nada                                              | —                                                                                     |
| I2       | Correção do contrato de DTO (#21, prevista em I1) | O detalhe de transação só passa a exibir dados corretos depois da normalização do DTO |
| I3       | I1, I2                                            | Login pressupõe conta criada                                                          |
| I5–I6    | Ambiente de testes com RLS (issue #20)            | US-005 só pode ser provada com stack local do Supabase                                |

---

## 5. Pendência estrutural das iterações 2 em diante

Os testes de integração exigidos por iteração não têm onde rodar hoje: `tests/integration/` não
existe e a stack local do Supabase não foi montada (issue #20). Criar o diretório e o ambiente é
**pré-requisito da iteração I2**, senão a exigência de "pelo menos um teste de integração" fica
descumprida de iteração em iteração. Detalhes em [test-state-report.md](test-state-report.md) §3.2.
