# Plano de testes

Plano de testes do SpendSmart, cobre a aplicação em uso: um monolito Next.js (Pages Router) com
Supabase Auth e Supabase PostgreSQL com Row Level Security, sem servidor HTTP próprio.

Os identificadores RF01 a RF16 e RNF01 a RNF07 vêm do documento de visão da disciplina de Testes de
Software (BSI, UFRN, 2026). Os identificadores são preservados para que a rastreabilidade entre
requisito, User Story e caso de teste continue estável. As User Stories estão em
[user-stories.md](user-stories.md).

### Objetivos

- Definir a estratégia e os níveis de teste (unidade, integração, sistema e aceitação) que cobrem os
  16 requisitos funcionais e os 7 requisitos não funcionais do SpendSmart.
- Estabelecer a matriz de rastreabilidade entre requisito, User Story e caso de teste, e os critérios
  de entrada e saída de cada iteração.
- Registrar riscos e contingências que afetam a confiabilidade da evidência de testes, em especial o
  isolamento entre usuários via RLS.
- Orientar a execução das iterações pelo modelo BSI/YP-Agentic, com ao menos 1 User Story por membro
  por iteração e teste de aceitação escrito pelo colega que não desenvolveu a história.

---

## 1. Escopo

### 1.1 No escopo

- As 16 User Stories em [user-stories.md](user-stories.md), com seus critérios de aceitação.
- Os 16 Requisitos Funcionais (RF01 a RF16).
- Os 7 Requisitos Não Funcionais (RNF01 a RNF07) — ver §3.
- A camada de serviço (`services/`), que concentra as regras de negócio e a tradução de domínio.
- As duas rotas serverless de `pages/api/`, que usam privilégio administrativo.
- As políticas RLS de `profiles`, `categories` e `transactions`.
- As migrações de `supabase/migrations/`.

### 1.2 Fora do escopo

- Interface gráfica em geral: validação visual, design responsivo e acessibilidade. Os testes
  tratam comportamento observável, não aparência.
- Testes de carga e desempenho. Não há requisito de desempenho definido e, portanto, não existe
  critério de aceite para medir.
- Compatibilidade entre navegadores e versões de dispositivo.
- Infraestrutura externa do Supabase que não esteja sob controle da equipe.
- Serviços de terceiros não simulados.

---

## 2. Níveis de teste

### 2.1 Testes de unidade

**Alvo:** métodos de `services/` com o cliente Supabase mockado.

**Responsável:** desenvolvedor.

**Foco:** regras de negócio isoladas do banco. São três grupos:

1. **Validação de entrada** — campos obrigatórios, formato de valor numérico, tipo válido.
2. **Mapeamento de erro** — cada código do Postgres deve virar a mensagem correta em português
   (ver `services/categoryService.js:48,88` como referência).
3. **Tradução de domínio** — o DTO devolvido ao frontend deve mapear `income` para `receita` e os
   nomes de coluna do banco para os nomes do frontend.

**Mocks:** o cliente Supabase é substituído por um dublê que devolve `{ data, error }`. O foco é
garantir que o service reaja corretamente a cada par possível, inclusive `error` nulo.

O mock precisa de **factory**, e o falso precisa ser montado **dentro** dela. Duas razões, as duas
verificadas:

1. `infra/supabase.js:6` chama `createClient` no momento do import, e `createClient(undefined, undefined)`
   lança `supabaseUrl is required`. Sem factory, o Jest precisa inspecionar o módulo real para gerá-lo
   automaticamente, e inspecionar significa executar. O teste morre antes da primeira asserção, com
   `Tests: 0 total`.
2. O `jest.mock` é **hoisted** para o topo do arquivo, acima dos imports e das variáveis. Se a
   factory referenciar uma `const` declarada no arquivo, ela ainda está na zona morta temporal e o
   resultado é `ReferenceError: Cannot access 'X' before initialization`.

```js
// Errado 1: sem factory, o módulo real é executado e lança
jest.mock("../../infra/supabase")

// Errado 2: a factory é hoisted acima desta const
const mockSupabase = { from: jest.fn() }
jest.mock("../../infra/supabase", () => ({ supabase: mockSupabase }))

// Certo: o falso nasce dentro da factory e é importado normalmente
jest.mock("../../infra/supabase", () => ({
  supabase: {
    from: jest.fn(),
    auth: { getSession: jest.fn() }
  }
}))

import { supabase } from "../../infra/supabase"

// e reconfigurado por teste
supabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: "u1" } } } })
```

O mesmo vale para `global.fetch`, que `authServices` e `profileService` chamam direto.

**Escopo mínimo por questão da disciplina:** um teste para cada operação CRUD —
`createCategory`, `getCategories`, `updateCategory`, `deleteCategory` e os quatro equivalentes
em `transactionService`.

**Estado atual:** nenhum teste de unidade sobre o código vivo existe. A suíte em `tests/` cobre
apenas `services/categoriaService.js`, que é código morto e não é importado por nenhuma página.
Ver issue [#26](https://github.com/MViniciusCoffe/SpendSmart/issues/26).

### 2.2 Testes de integração

**Alvo:** a fronteira entre rota serverless e banco, e a aplicação do RLS.

**Responsável:** desenvolvedor / testador.

**Casos que só a integração revela:**

| #     | Caso                                                 | Por que só a integração                                                         |
| :---- | :--------------------------------------------------- | :------------------------------------------------------------------------------ |
| IT-01 | Isolamento de leitura entre dois usuários            | Depende das políticas RLS, que vivem no banco. Nenhum mock em JS reproduz isso. |
| IT-02 | Isolamento de escrita entre dois usuários            | Depende do `WITH CHECK` das políticas.                                          |
| IT-03 | Deleção de conta remove tudo em cascata              | Depende das chaves estrangeiras para `auth.users`.                              |
| IT-04 | Exclusão de categoria em uso é rejeitada             | Depende de `ON DELETE RESTRICT`.                                                |
| IT-05 | Unicidade de categoria por (usuário, nome, tipo)     | Depende da constraint `23505`.                                                  |
| IT-06 | `amount` não negativo e não zero                     | Depende do `CHECK (amount > 0)`.                                                |
| IT-07 | `transactions.type` deve bater com `categories.type` | Invariante que hoje não existe no banco. Ver §6.                                |
| IT-08 | `/api/createProfile` rejeita requisição sem token    | Depende do `getUser(token)` na rota.                                            |
| IT-09 | `/api/deleteAccount` rejeita token inválido com 401  | Idem.                                                                           |
| IT-10 | Migrações aplicam do zero sem erro                   | Verifica o guard `to_regclass` e a ordem de execução.                           |

**Ambiente:** a stack local do Supabase CLI, que traz Postgres, Auth e as políticas RLS de verdade.
Não usar o banco de desenvolvimento — ver [environments.md](environments.md) e issue
[#20](https://github.com/MViniciusCoffe/SpendSmart/issues/20).

### 2.3 Testes de sistema e aceitação

**Alvo:** o fluxo completo pela interface, executado manualmente com dados sintéticos.

**Fluxo principal:** criar conta -> entrar -> ver dashboard vazio -> criar categoria de receita ->
criar categoria de despesa -> registrar receita -> registrar despesa -> conferir saldo ->
alterar perfil -> sair -> entrar de novo -> excluir conta e confirmar que tudo sumiu.

**Critério de saída da iteração** (adaptado do modelo BSI):

- [ ] 100% dos casos de aceitação planejados foram executados
- [ ] Nenhum defeito de prioridade alta ou crítica permanece aberto
- [ ] Os testes de unidade e integração das funcionalidades estão concluídos
- [ ] As User Stories atendem aos próprios critérios de aceitação

---

## 3. Estratégia por requisito não funcional

Os RNF definem as qualidades que a aplicação precisa manter. A coluna "Como verificar" aponta o
teste ou a inspeção que cobre cada um.

| ID    | Requisito não funcional                                                                                                                   | Como verificar                            |
| :---- | :---------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------- |
| RNF01 | Roda sobre Node.js, sem servidor HTTP próprio. As únicas rotas server-side são as duas funções em `pages/api/`.                           | Inspecionar `package.json` e `pages/api/` |
| RNF02 | Toda comunicação é JSON: o cliente fala com o Supabase via PostgREST, e as duas rotas serverless recebem e devolvem JSON.                 | Teste de unidade das rotas                |
| RNF03 | Persistência em PostgreSQL, com constraints e índices aplicados por migration.                                                            | IT-10, IT-04, IT-05, IT-06                |
| RNF04 | Sessão gerenciada pelo Supabase Auth e nenhum dado de um usuário visível a outro.                                                         | IT-01, IT-02, IT-08, IT-09, CA-002.02     |
| RNF05 | O acesso do navegador ao Supabase depende da configuração de CORS feita no painel do projeto, não no código.                              | Configuração do projeto Supabase          |
| RNF06 | Servidor na porta 3000 em desenvolvimento; a Vercel não expõe porta.                                                                      | Ver [environments.md](environments.md)    |
| RNF07 | Separação entre interface, regra de negócio, cliente e operações privilegiadas: `pages/`, `services/`, `infra/supabase.js`, `pages/api/`. | Inspeção estática + revisão               |

**RNF04 é o requisito de segurança central.** Ele se verifica por observação do resultado, e não
pela presença de um mecanismo: o que importa é que uma consulta com o usuário A não devolva linha
do usuário B. Os testes IT-01 e IT-02 são a verificação disso, e por isso são os únicos dois casos
que exigem ambiente com RLS ativo.

---

## 4. Matriz de casos de teste

Cobertura de US por nível. "Un." = unidade, "Int." = integração, "Sist." = sistema. O detalhamento
por critério de aceitação está em [user-stories.md](user-stories.md).

| US                       | Un.   | Int.         | Sist. | Observação                                            |
| :----------------------- | :---- | :----------- | :---- | :---------------------------------------------------- |
| US-001 Criar conta       | IT-08 | x            | x     | Falta rollback — issue #25                            |
| US-002 Entrar            | x     |              | x     | Mapeamento de erro é 100% cliente                     |
| US-003 Perfil            | x     |              | x     | Alteração de senha tem validação pendente — issue #11 |
| US-004 Excluir conta     | x     | IT-03, IT-09 | x     |                                                       |
| US-005 Privacidade       |       | IT-01, IT-02 | x     | **Nunca exercitado.** Ver §6                          |
| US-006 Criar categoria   | x     | IT-05        | x     |                                                       |
| US-007 Listar categorias | x     | IT-01        | x     | Falta estado vazio                                    |
| US-008 Alterar categoria | x     |              | x     | CA-008.03 não atendido                                |
| US-009 Excluir categoria | x     | IT-04        | x     | CA-009.03 mostra "0" fixo                             |
| US-010 Registrar receita | x     | IT-06        | x     | CA-010.03 quebrado — issues #10, #21                  |
| US-011 Listar receitas   | x     | IT-01        | x     |                                                       |
| US-012 Excluir receita   | x     |              | x     |                                                       |
| US-013 Registrar despesa | x     | IT-06        | x     | CA-013.03 quebrado — issue #21                        |
| US-014 Listar despesas   | x     | IT-01        | x     |                                                       |
| US-015 Excluir despesa   | x     |              | x     |                                                       |
| US-016 Dashboard         |       | IT-07        | x     | Agregação hoje é no cliente                           |

**Total: 16 User Stories, 10 casos de integração, 4 arquivos de service e 14 métodos sob teste.**

Os 14 métodos de `services/` têm 100% de cobertura. O `logoutUser` deixou de ser código morto em 2026-09: `pages/accountConfig.js` e `components/Navbar/navbarApp.js` passaram a chamar o service em vez de `supabase.auth.signOut()` direto. Ver #26.

---

## 5. Ambiente de testes

| Item              | Definição                                                         |
| :---------------- | :---------------------------------------------------------------- |
| Suporte           | PostgreSQL 16                                                     |
| Autenticação      | Supabase Auth                                                     |
| Sessão            | Tokens do Supabase, persistidos no navegador                      |
| Isolamento        | RLS por `auth.uid()`                                              |
| Ambiente          | Stack local do Supabase CLI, separada do Supabase remoto          |
| Dados             | Sintéticos, criados e removidos por script de seed                |
| Serviços externos | Nenhum; `supabase.auth` é o único e é mockado no nível de unidade |

A separação é em dois níveis, porque nem toda verificação precisa de Auth:

| Nível                        | Sobe com             | Cobre                                                   | Não cobre                                                          |
| :--------------------------- | :------------------- | :------------------------------------------------------ | :----------------------------------------------------------------- |
| `tests/integration/postgres` | Postgres 16 puro     | Constraints, chaves estrangeiras, unicidade, migrations | RLS — o guard `to_regclass` não cria as políticas sem `auth.users` |
| `tests/integration/supabase` | Stack local completa | RLS, isolamento entre usuários, cascata de `auth.users` | Nada de mais lento que a stack em si                               |

> O repositório ainda não tem essa separação. Detalhes em
> [environments.md](environments.md) e issue
> [#20](https://github.com/MViniciusCoffe/SpendSmart/issues/20).

---

## 6. Riscos e contingências

| Risco                                       | Impacto no teste                                                                                                       | Mitigação                                                                                                     |
| :------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------ |
| **RLS só é criado se `auth.users` existir** | Alto. No PostgreSQL local o RLS nunca é aplicado, então o ambiente de teste pode passar vazando dados sem acusar erro. | Testar contra a stack local do Supabase, que tem `auth.users`. Nunca só com Postgres puro. Ver IT-01 e IT-02. |
| **A suíte atual exercita código morto**     | Alto. `npm test` falha e não cobre nenhuma funcionalidade.                                                             | Remover `categoriaService.js` e reescrever a suíte. Issue #26.                                                |
| **Ausência de ambiente de teste dedicado**  | Médio. Sem ele, IT-01 a IT-10 rodariam contra o banco de desenvolvimento.                                              | Stack local do Supabase CLI. Issue #20.                                                                       |
| **Contrato de DTO inconsistente**           | Médio. A UI lê nomes que o service não devolve; o teste pode validar o service enquanto a tela quebra.                 | Centralizar o DTO. Issues #10 e #21.                                                                          |
| **Invariante `type` não verificada**        | Médio. Um lançamento pode apontar para categoria de tipo oposto, corrompendo o dashboard.                              | Constraint ou trigger. Registrado no plano; issue própria a criar.                                            |
| **`updated_at` nunca atualizado**           | Baixo. A coluna existe em 3 tabelas e não tem trigger.                                                                 | Trigger de `updated_at`.                                                                                      |
| **Linguagem divergente entre colunas**      | Baixo. `profiles` usa português, `categories` e `transactions` usam inglês.                                            | Migration futura, ver [future-migrations.md](future-migrations.md).                                           |
| **Estado vazio inexistente**                | Baixo. Várias telas não se distinguem entre "sem registros" e "falhou ao carregar".                                    | Issue #13 cobre parte disso.                                                                                  |

---

## 7. Critérios de entrada e saída

### Entrada

- [ ] Código da branch `main` disponível
- [ ] Ambiente de teste Supabase funcional e isolado
- [ ] Schema aplicado via migrations
- [ ] Dados de teste criados
- [ ] Testes de unidade da funcionalidade executados e aprovados

### Saída

- [ ] Todos os casos de aceitação executados
- [ ] Nenhum defeito de prioridade alta ou crítica aberto
- [ ] Testes de unidade e integração concluídos
- [x] Relatório de cobertura gerado em formato `lcov` — `coverage/lcov.info`, 100% em `services/`
- [ ] As User Stories atendem aos próprios critérios de aceitação

---

## 8. Ferramentas

| Categoria            | Ferramenta                                               | Uso                                                                                                         |
| :------------------- | :------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------- |
| Testes unitários     | Jest 30                                                  | Testes de `services/` com o cliente Supabase mockado                                                        |
| Transformação        | `babel-jest` com `preset-env` inline no `jest.config.js` | Converte ESM. Não existe `babel.config.js` no repositório, de propósito                                     |
| Cobertura            | Jest `--coverage`, formato `lcov`                        | Relatório consumido pelo SonarQube — ver [sonarqube.md](sonarqube.md)                                       |
| Testes de integração | Jest + Postgres 16 e stack local do Supabase             | IT-01 a IT-10                                                                                               |
| Gestão de casos      | GitHub Issues                                            | Rastreabilidade US / CT / RF                                                                                |
| Lint                 | ESLint 9, flat config                                    | `eslint.config.js`. Erro e aviso                                                                            |
| Formatação           | Prettier 3                                               | Arquivos de staged, via `lint-staged` no `pre-commit`                                                       |
| Padrão de commit     | Commitlint + Husky                                       | Conventional Commits                                                                                        |
| Análise estática     | SonarQube Community Build (LABENS), projeto `spendsmart` | Análise, cobertura LCOV e code smells — ver [sonarqube.md](sonarqube.md)                                    |
| Execução contínua    | GitHub Actions                                           | `install` -> `test` -> `coverage` -> `sonar`. Três workflows separados: `lint.yml`, `test.yml`, `sonar.yml` |
| Banco                | PostgreSQL 16                                            | Persistência e verificação de constraints                                                                   |

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

| Nível             | Responsável      | Quem revisa                                 |
| :---------------- | :--------------- | :------------------------------------------ |
| Unidade           | Desenvolvedor    | QA executa `npm test` e confere a cobertura |
| Integração        | Desenvolvedor    | QA confere o resultado no PR                |
| Sistema/Aceitação | QA (José Samuel) | Product Owner / cliente                     |

Regra de dupla verificação: **ninguém aprova a própria US.** O relatório de Testes de Aceitação de
cada iteração é sempre escrito pelo colega que não desenvolveu a história, conforme
[iteration-plan.md](iteration-plan.md) §3.

---

## 10. Referências

- Modelo BSI - Doc 004 - Plano de Testes. Processo de Desenvolvimento BSI, UFRN, CERS, DCT.
- Modelo YP-Agentic - Plano Geral de Testes (`tacianosilva/engenharia-software/yp-agentic/templates/plano-geral-testes.md`).
- [vision.md](vision.md) — escopo, requisitos funcionais (RF01 a RF16) e não funcionais (RNF01 a RNF07).
- [user-stories.md](user-stories.md) — US-001 a US-016 com critérios de aceitação.
- [test-state-report.md](test-state-report.md) — estado atual da suíte e historico de falhas.
- [environments.md](environments.md) — ambientes local, de desenvolvimento e de produção.
- [sonarqube.md](sonarqube.md) - configuração do SonarQube e explicação dos painéis.
- Enunciados da disciplina: `softwaretesting/20262/tarefas/P2.md` e `P3.md` (`tacianosilva/bsi-tasks`).
