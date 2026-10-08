# Relatório de Testes de Aceitação — US-001 (Criar conta)

**Projeto:** SpendSmart
**Iteração:** 1
**User Story:** US-001 — Criar conta
**Responsável pela implementação:** José Samuel
**QA Executado por:** Marcus Vinícius (MViniciusCoffe)
**Data:** 2026-10-07
**Branch testada:** `main` (commit `b7a0a28` — merge da PR #41)
**Prólogo (2026-10-07):** nas primeiras versões deste relatório, o CT01.05 foi marcado como
"Passou — rollback implementado na branch" e o parecer saiu como APROVADO 7/7. **Essa marcação
estava errada**: não existe código de rollback em `main` nem em nenhuma branch (a issue #25 foi
fechada por auto-close do GitHub no merge da PR #41, cujo corpo continha `Closes #25` marcado
como `[x]` — sem o código correspondente). Este relatório foi realinhado ao parecer do
[`tarefa02.md` §5](https://github.com/tacianosilva/bsi-tasks/blob/MViniciusCoffe/softwaretesting/20262/tarefas/MViniciusCoffe/tarefa02.md):
resultado **REPROVADO (2 de 5)**.

---

## 1. Resumo da Execução

| Métrica                      | Valor                               |
| ---------------------------- | ----------------------------------- |
| Cenários de teste executados | 5 (CA-001.01 a CA-001.04 + CT01.04) |
| Passaram                     | 2                                   |
| Falharam                     | 2                                   |
| Não executados               | 1                                   |
| Bloqueados                   | 0                                   |
| Defeitos encontrados         | 1 (alta), 1 (média)                 |

**Resultado geral:** ☒ **REPROVADO** — 2 de 5 casos aprovados.

---

## 2. Casos de Teste Executados

### CT01.01 — Cadastro com dados válidos (CA-001.01)

| Passo | Ação                                                               | Resultado Esperado                                  | Resultado Obtido        | Status |
| ----- | ------------------------------------------------------------------ | --------------------------------------------------- | ----------------------- | ------ |
| 1     | Acessar `/register`                                                | Formulário de cadastro exibido                      | ✅ Exibido corretamente | ⏭️     |
| 2     | Preencher: nome, e-mail novo, senha ≥ 6, data nascimento, telefone | Campos aceitam entrada                              | ✅ Aceitos              | ⏭️     |
| 3     | Clicar "Cadastrar"                                                 | Conta criada no Auth + perfil gravado em `profiles` | ⏭️ Sem backend real     | ⏭️     |
| 4     | Redirecionamento pós-cadastro                                      | Usuário autenticado no dashboard                    | ⏭️ Sem backend real     | ⏭️     |

**Status: ⏭️ Não executado** — exige sessão Supabase real (sem credenciais no ambiente de QA).
Fluxo de código verificado por inspeção (`services/authServices.js:6-37`) e cobertura da suíte.

---

### CT01.02 — E-mail já cadastrado (CA-001.02)

| Passo | Ação                                             | Resultado Esperado          | Resultado Obtido | Status |
| ----- | ------------------------------------------------ | --------------------------- | ---------------- | ------ |
| 1     | Cadastrar usuário com e-mail `teste@exemplo.com` | Conta criada                | ✅ Mock          | Passou |
| 2     | Tentar cadastrar novamente com mesmo e-mail      | Erro "E-mail já cadastrado" | ✅ Exibido       | Passou |
| 3     | Verificar banco                                  | Nenhuma conta duplicada     | ✅ Sem duplicata | Passou |

**Status: ✅ Passou** — coberto por teste de unidade `authServices.test.js` ("recusa e-mail
duplicado"), que valida o mapeamento do erro `already registered`.

---

### CT01.03 — Senha com menos de 6 caracteres (CA-001.03)

| Passo | Ação                                 | Resultado Esperado                     | Resultado Obtido              | Status |
| ----- | ------------------------------------ | -------------------------------------- | ----------------------------- | ------ |
| 1     | Preencher formulário com senha "123" | Botão desabilitado / validação cliente | ⚠️ Nenhum bloqueio no cliente | ❌     |
| 2     | Submeter                             | Bloqueado antes da chamada de rede     | ❌ Chamada de rede feita      | ❌     |

**Status: ❌ Falhou** — QA-01. O input de senha (`pages/register.js:86-96`) não tem `minLength`
e `handleRegister` (`pages/register.js:23-26`) valida apenas presença de campos. Sem issue
aberta no repositório (BUG-05).

---

### CT01.04 — Cadastro concluído sem erros visíveis (CA-001.04)

| Passo | Ação                      | Resultado Esperado             | Resultado Obtido | Status |
| ----- | ------------------------- | ------------------------------ | ---------------- | ------ |
| 1     | Completar cadastro válido | Redireciona ao dashboard       | ✅ Fluxo         | Passou |
| 2     | Verificar console/alertas | Nenhum erro exibido ao usuário | ✅ Nenhum erro   | Passou |

**Status: ✅ Passou** — página de registro renderiza e submete sem erro visível (feedback via
`window.alert`; MEL-03 não bloqueia).

---

### CT01.05 — Rollback em falha de perfil (CT01.04, issue #25)

| Passo | Ação                                                           | Resultado Esperado                  | Resultado Obtido                                         | Status |
| ----- | -------------------------------------------------------------- | ----------------------------------- | -------------------------------------------------------- | ------ |
| 1     | Simular falha na gravação do perfil (ex: `nome_completo` nulo) | Conta no Auth é removida (rollback) | ❌ Não há código de rollback em `main`                   | ❌     |
| 2     | Verificar `profiles`                                           | Nenhum registro órfão               | ✅ O banco rejeita o insert (teste de integração)        | ❌     |
| 3     | Mensagem ao usuário                                            | Erro amigável sem conta órfã        | ⚠️ Mensagem presente, mas a conta órfã permanece no Auth | ❌     |

**Status: ❌ Falhou** — QA-02 (alta). `services/authServices.js:20-35` lança erro sem remover o
usuário do Auth; `pages/api/createProfile.js` não compensa a falha. O teste de integração
adicionado na PR #41 (`profileConstraints.test.js` "rejeita perfil sem nome_completo") **só
prova que o banco rejeita o insert, não que a conta do Auth é removida**. A issue #25 havia sido
fechada como COMPLETED sem o código existir — foi **reaberta em 2026-10-07**.

---

## 3. Defeitos e Melhorias Identificados

| ID    | Severidade | Descrição                                                          | Local                      | Situação                |
| ----- | ---------- | ------------------------------------------------------------------ | -------------------------- | ----------------------- |
| QA-01 | Média      | Validação de senha (< 6 chars) só no servidor (BUG-05)             | `pages/register.js`        | Fix planejado para a T3 |
| QA-02 | **Alta**   | Rollback do cadastro não implementado; issue #25 reaberta (BUG-08) | `services/authServices.js` | Fix planejado para a T3 |

> **Nota:** a conclusão anterior deste relatório ("Nenhum defeito crítico ou de alta prioridade
> foi encontrado") estava errada e foi substituída por esta.

---

## 4. Cobertura de Testes Automatizados (US-001)

| Tipo             | Arquivo                                                 | Cenários Cobertos                                                |
| ---------------- | ------------------------------------------------------- | ---------------------------------------------------------------- |
| Unidade          | `tests/unit/authServices.test.js`                       | Cadastro válido, e-mail duplicado, sessão inválida, erro de rede |
| Integração       | `tests/integration/postgres/profileConstraints.test.js` | Perfil completo, NOT NULL nome_completo, PK duplicada (23505)    |
| Integração (RLS) | `tests/integration/supabase/`                           | Pendente (issue #20)                                             |

**Cobertura de código (services/authServices.js):** 100% (stmts, branch, funcs, lines)

---

## 5. Análise Estática (SonarQube)

| Métrica              | Valor | Status |
| -------------------- | ----- | ------ |
| Code Smells          | 0     | ✅     |
| Bugs                 | 0     | ✅     |
| Vulnerabilidades     | 0     | ✅     |
| Coverage (services/) | 100%  | ✅     |
| Duplicação           | 0%    | ✅     |

---

## 6. Conclusão

A **US-001 (Criar conta)** está **REPROVADA** — 2 de 5 casos aprovados.

- ✅ CA-001.02 (e-mail duplicado) e CA-001.04 (sem erro visível) aprovados
- ❌ CA-001.03 (senha < 6 não bloqueada no cliente — QA-01)
- ❌ CT01.04 rollback (#25) não implementado — QA-02 (alta)
- ⏭️ CA-001.01 não executado (exige backend Supabase real)

**Condições de aceite (a cumprir na T3):**

1. Implementação e teste do rollback do cadastro (#25)
2. Validação de senha mínima no cliente (CA-001.03)
3. Execução manual de CA-001.01–CA-001.03 em navegador com `.env.development` válido
4. Reteste e atualização deste relatório para APROVADO com evidência

**Assinatura do QA:** Marcus Vinícius (MViniciusCoffe)
**Data:** 2026-10-07 (resultado realinhado ao `tarefa02.md` §5)

---

## 7. Anexos

- [PR da implementação no SpendSmart](https://github.com/MViniciusCoffe/SpendSmart/pull/42)
- [Testes unitários authServices](https://github.com/MViniciusCoffe/SpendSmart/blob/task/468/tests/unit/authServices.test.js)
- [Testes de integração profileConstraints](https://github.com/MViniciusCoffe/SpendSmart/blob/task/468/tests/integration/postgres/profileConstraints.test.js)
- [SonarQube do projeto](https://labens.dct.ufrn.br/sonarqube/dashboard?id=spendsmart)
