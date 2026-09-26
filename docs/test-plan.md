# Plano de testes

Plano de testes do SpendSmart, cobre a aplicacao em uso: um monolito Next.js (Pages Router) com
Supabase Auth e Supabase PostgreSQL com Row Level Security, sem servidor HTTP proprio.

Os identificadores RF01 a RF16 e RNF01 a RNF07 vem do documento de visao da disciplina de Testes de
Software (BSI, UFRN, 2026). Os identificadores sao preservados para que a rastreabilidade entre
requisito, User Story e caso de teste continue estavel. As User Stories estao em
[user-stories.md](user-stories.md).

---

## 1. Escopo

### 1.1 No escopo

- As 16 User Stories em [user-stories.md](user-stories.md), com seus criterios de aceitacao.
- Os 16 Requisitos Funcionais (RF01 a RF16).
- Os 7 Requisitos Nao Funcionais (RNF01 a RNF07) — ver §3.
- A camada de servico (`services/`), que concentra as regras de negocio e a traducao de dominio.
- As duas rotas serverless de `pages/api/`, que usam privilegio administrativo.
- As politicas RLS de `profiles`, `categories` e `transactions`.
- As migrations de `supabase/migrations/`.

### 1.2 Fora do escopo

- Interface grafica em geral: validacao visual, design responsivo e acessibilidade. Os testes
  tratam comportamento observavel, nao aparncia.
- Testes de carga e desempenho. Nao ha requisito de desempenho definido, e portanto nao existe
  criterio de aceite para medir.
- Compatibilidade entre navegadores e versoes de dispositivo.
- Infraestrutura externa do Supabase que nao esteja sob controle da equipe.
- Servicos de terceiros nao simulados.

---

## 2. Niveis de teste

### 2.1 Testes de unidade

**Alvo:** metodos de `services/` com o cliente Supabase mockado.

**Responsavel:** desenvolvedor.

**Foco:** regras de negocio isoladas do banco. Sao tres grupos:

1. **Validacao de entrada** — campos obrigatorios, formato de valor numerico, tipo valido.
2. **Mapeamento de erro** — cada codigo do Postgres deve virar a mensagem correta em portugues
   (ver `services/categoryService.js:48,88` como referencia).
3. **Traducao de dominio** — o DTO devolvido ao frontend deve mapear `income` para `receita` e os
   nomes de coluna do banco para os nomes do frontend.

**Mocks:** o cliente Supabase e substituido por um duble que devolve `{ data, error }`. O foco e
garantir que o service reaja corretamente a cada par possivel, inclusive `error` nulo.

O mock precisa de **factory**, e o falso precisa ser montado **dentro** dela. Duas razoes, as duas
verificadas:

1. `infra/supabase.js:6` chama `createClient` no momento do import, e `createClient(undefined,
undefined)` lanca `supabaseUrl is required`. Sem factory o Jest precisa inspecionar o modulo
   real para gerar o falso automatico, e inspecionar significa executar. O teste morre antes da
   primeira asercao, com `Tests: 0 total`.
2. O `jest.mock` e **hoisted** para o topo do arquivo, acima dos imports e das variaveis. Se a
   factory referenciar uma `const` declarada no arquivo, ela ainda esta na zona morta temporal e o
   resultado e `ReferenceError: Cannot access 'X' before initialization`.

```js
// Errado 1: sem factory, o modulo real e executado e lanca
jest.mock("../../infra/supabase")

// Errado 2: a factory e hoisted acima desta const
const mockSupabase = { from: jest.fn() }
jest.mock("../../infra/supabase", () => ({ supabase: mockSupabase }))

// Certo: o falso nasce dentro da factory e e importado normalmente
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

**Escopo minimo por questao da disciplina:** um teste para cada operacao CRUD —
`createCategory`, `getCategories`, `updateCategory`, `deleteCategory` e os quatro equivalentes
em `transactionService`.

**Estado atual:** nenhum teste de unidade sobre o codigo vivo existe. A suite em `tests/` cobre
apenas `services/categoriaService.js`, que e codigo morto e nao e importado por nenhuma pagina.
Ver issue [#26](https://github.com/MViniciusCoffe/SpendSmart/issues/26).

### 2.2 Testes de integracao

**Alvo:** a fronteira entre rota serverless e banco, e aopolicao do RLS.

**Responsavel:** desenvolvedor / testador.

**Casos que so a integracao revela:**

| #     | Caso                                                 | Por que so a integracao                                                         |
| ----- | ---------------------------------------------------- | ------------------------------------------------------------------------------- |
| IT-01 | Isolamento de leitura entre dois usuarios            | Depende das politicas RLS, que vivem no banco. Nenhum mock em JS reproduz isso. |
| IT-02 | Isolamento de escrita entre dois usuarios            | Depende do `WITH CHECK` das politicas.                                          |
| IT-03 | Delecao de conta remove tudo em cascata              | Depende das chaves estrangeiras para `auth.users`.                              |
| IT-04 | Exclusao de categoria em uso e rejeitada             | Depende de `ON DELETE RESTRICT`.                                                |
| IT-05 | Unicidade de categoria por (usuario, nome, tipo)     | Depende da constraint `23505`.                                                  |
| IT-06 | `amount` nao negativo e nao zero                     | Depende do `CHECK (amount > 0)`.                                                |
| IT-07 | `transactions.type` deve bater com `categories.type` | Invariante que hoje nao existe no banco. Ver §6.                                |
| IT-08 | `/api/createProfile` rejeita requisicao sem token    | Depende do `getUser(token)` na rota.                                            |
| IT-09 | `/api/deleteAccount` rejeita token invalido com 401  | Idem.                                                                           |
| IT-10 | Migrations aplicam do zero sem erro                  | Verifica o guard `to_regclass` e a ordem de execucao.                           |

**Ambiente:** a stack local do Supabase CLI, que traz Postgres, Auth e as politicas RLS de verdade.
Nao usar o banco de desenvolvimento — ver [environments.md](environments.md) e issue
[#20](https://github.com/MViniciusCoffe/SpendSmart/issues/20).

### 2.3 Testes de sistema e aceitacao

**Alvo:** o fluxo completo pela interface, executado manualmente com dados sinteticos.

**Fluxo principal:** criar conta -> entrar -> ver dashboard vazio -> criar categoria de receita ->
criar categoria de despesa -> registrar receita -> registrar despesa -> conferir saldo ->
alterar perfil -> sair -> entrar de novo -> excluir conta e confirmar que tudo sumiu.

**Criterio de saida da iteracao** (adaptado do modelo BSI):

- [ ] 100% dos casos de aceitacao planejados foram executados
- [ ] Nenhum defeito de prioridade alta ou critica permanece aberto
- [ ] Os testes de unidade e integracao das funcionalidades estao concluidos
- [ ] As User Stories atendem aos proprios criterios de aceitacao

---

## 3. Estrategia por requisito nao funcional

Os RNF definem as qualidades que a aplicacao precisa manter. A coluna "Como verificar" aponta o
teste ou a inspecao que cobre cada um.

| ID    | Requisito nao funcional                                                                                                                   | Como verificar                            |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| RNF01 | Roda sobre Node.js, sem servidor HTTP proprio. As unicas rotas server-side sao as duas funcoes em `pages/api/`.                           | Inspecionar `package.json` e `pages/api/` |
| RNF02 | Toda comunicacao e JSON: o cliente fala com o Supabase via PostgREST, e as duas rotas serverless recebem e devolvem JSON.                 | Teste de unidade das rotas                |
| RNF03 | Persistencia em PostgreSQL, com constraints e indices aplicados por migration.                                                            | IT-10, IT-04, IT-05, IT-06                |
| RNF04 | Sessao gerenciada pelo Supabase Auth e nenhum dado de um usuario visivel a outro.                                                         | IT-01, IT-02, IT-08, IT-09, CA-002.02     |
| RNF05 | O acesso do navegador ao Supabase depende da configuracao de CORS feita no painel do projeto, nao no codigo.                              | Configuracao do projeto Supabase          |
| RNF06 | Servidor na porta 3000 em desenvolvimento; a Vercel nao expoe porta.                                                                      | Ver [environments.md](environments.md)    |
| RNF07 | Separacao entre interface, regra de negocio, cliente e operacoes privilegiadas: `pages/`, `services/`, `infra/supabase.js`, `pages/api/`. | Inspecao estatica + revisao               |

**RNF04 e o requisito de seguranca central.** Ele se verifica por observacao do resultado, e nao
pela presenca de um mecanismo: o que importa e que uma consulta com o usuario A nao devolva linha
do usuario B. Os testes IT-01 e IT-02 sao a verificacao disso, e por isso sao os unicos dois casos
que exigem ambiente com RLS ativo.

---

## 4. Matriz de casos de teste

Cobertura de US por nivel. "Un." = unidade, "Int." = integracao, "Sist." = sistema. O detalhamento
por criterio de aceitacao esta em [user-stories.md](user-stories.md).

| US                       | Un.   | Int.         | Sist. | Observacao                                            |
| ------------------------ | ----- | ------------ | ----- | ----------------------------------------------------- |
| US-001 Criar conta       | IT-08 | x            | x     | Falta rollback — issue #25                            |
| US-002 Entrar            | x     |              | x     | Mapeamento de erro e 100% cliente                     |
| US-003 Perfil            | x     |              | x     | Alteracao de senha tem validacao pendente — issue #11 |
| US-004 Excluir conta     | x     | IT-03, IT-09 | x     |                                                       |
| US-005 Privacidade       |       | IT-01, IT-02 | x     | **Nunca exercitado.** Ver §6                          |
| US-006 Criar categoria   | x     | IT-05        | x     |                                                       |
| US-007 Listar categorias | x     | IT-01        | x     | Falta estado vazio                                    |
| US-008 Alterar categoria | x     |              | x     | CA-008.03 nao atendido                                |
| US-009 Excluir categoria | x     | IT-04        | x     | CA-009.03 mostra "0" fixo                             |
| US-010 Registrar receita | x     | IT-06        | x     | CA-010.03 quebrado — issues #10, #21                  |
| US-011 Listar receitas   | x     | IT-01        | x     |                                                       |
| US-012 Excluir receita   | x     |              | x     |                                                       |
| US-013 Registrar despesa | x     | IT-06        | x     | CA-013.03 quebrado — issue #21                        |
| US-014 Listar despesas   | x     | IT-01        | x     |                                                       |
| US-015 Excluir despesa   | x     |              | x     |                                                       |
| US-016 Dashboard         |       | IT-07        | x     | Agregacao hoje e no cliente                           |

**Total: 16 User Stories, 10 casos de integracao, 4 arquivos de service e 13 metodos sob teste.**

O 14o metodo e `authService.logoutUser`, sem consumidor em `pages/`. Registrado na issue #26.

---

## 5. Ambiente de testes

| Item              | Definicao                                                         |
| ----------------- | ----------------------------------------------------------------- |
| Suporte           | PostgreSQL 16                                                     |
| Autenticacao      | Supabase Auth                                                     |
| Sessao            | Tokens do Supabase, persistidos no navegador                      |
| Isolamento        | RLS por `auth.uid()`                                              |
| Ambiente          | Stack local do Supabase CLI, separada do Supabase remoto          |
| Dados             | Sinteticos, criados e removidos por script de seed                |
| Servicos externos | Nenhum; `supabase.auth` e o unico e e mockado no nivel de unidade |

A separacao e em dois niveis, porque nao toda verificacao precisa de Auth:

| Nivel                        | Sobe com             | Cobre                                                   | Nao cobre                                                          |
| ---------------------------- | -------------------- | ------------------------------------------------------- | ------------------------------------------------------------------ |
| `tests/integration/postgres` | Postgres 16 puro     | Constraints, chaves estrangeiras, unicidade, migrations | RLS — o guard `to_regclass` nao cria as politicas sem `auth.users` |
| `tests/integration/supabase` | Stack local completa | RLS, isolamento entre usuarios, cascata de `auth.users` | Nada de mais lento que a stack em si                               |

> O repositorio ainda nao tem essa separacao. Detalhes em
> [environments.md](environments.md) e issue
> [#20](https://github.com/MViniciusCoffe/SpendSmart/issues/20).

---

## 6. Riscos e contingencias

| Risco                                       | Impacto no teste                                                                                                       | Mitigacao                                                                                                     |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **RLS so e criado se `auth.users` existir** | Alto. No PostgreSQL local o RLS nunca e aplicado, entao o ambiente de teste pode passar vazando dados sem acusar erro. | Testar contra a stack local do Supabase, que tem `auth.users`. Nunca so com Postgres puro. Ver IT-01 e IT-02. |
| **A suite atual exercita codigo morto**     | Alto. `npm test` falha e nao cobre nenhuma funcionalidade.                                                             | Remover `categoriaService.js` e reescrever a suite. Issue #26.                                                |
| **Ausencia de ambiente de teste dedicado**  | Medio. Sem ele, IT-01 a IT-10 rodariam contra o banco de desenvolvimento.                                              | Stack local do Supabase CLI. Issue #20.                                                                       |
| **Contrato de DTO inconsistente**           | Medio. A UI le nomes que o service nao devolve; o teste pode validar o service enquanto a tela quebra.                 | Centralizar o DTO. Issues #10 e #21.                                                                          |
| **Invariante `type` nao verificada**        | Medio. Um lancamento pode apontar para categoria de tipo oposto, corrompendo o dashboard.                              | Constraint ou trigger. Registrado no plano; issue propria a criar.                                            |
| **`updated_at` nunca atualizado**           | Baixo. A coluna existe em 3 tabelas e nao tem trigger.                                                                 | Trigger de `updated_at`.                                                                                      |
| **Linguagem divergente entre colunas**      | Baixo. `profiles` usa portugues, `categories` e `transactions` usam ingles.                                            | Migration futura, ver [future-migrations.md](future-migrations.md).                                           |
| **Estado vazio inexistente**                | Baixo. Varias telas nao Distinguished "sem registros" de "falhou ao carregar".                                         | Issue #13 cobre parte disso.                                                                                  |

---

## 7. Criterios de entrada e saida

### Entrada

- [ ] Codigo da branch `main` disponivel
- [ ] Ambiente de teste Supabase funcional e isolado
- [ ] Schema aplicado via migrations
- [ ] Dados de teste criados
- [ ] Testes de unidade da funcionalidade executados e aprovados

### Saida

- [ ] Todos os casos de aceitacao executados
- [ ] Nenhum defeito de prioridade alta ou critica aberto
- [ ] Testes de unidade e integracao concluidos
- [ ] Relatorio de cobertura gerado em formato `lcov`
- [ ] As User Stories atendem aos proprios criterios de aceitacao

---

## 8. Ferramentas

| Categoria            | Ferramenta                                               | Uso                                                                     |
| -------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| Testes unitarios     | Jest 30                                                  | Testes de `services/` com o cliente Supabase mockado                    |
| Transformacao        | `babel-jest` com `preset-env` inline no `jest.config.js` | Converte ESM. Nao existe `babel.config.js` no repositorio, de proposito |
| Cobertura            | Jest `--coverage`, formato `lcov`                        | Relatorio consumido pelo SonarQube — ver [sonarqube.md](sonarqube.md)   |
| Testes de integracao | Jest + Postgres 16 e stack local do Supabase             | IT-01 a IT-10                                                           |
| Gestao de casos      | GitHub Issues                                            | Rastreabilidade US / CT / RF                                            |
| Lint                 | ESLint 9, flat config                                    | `eslint.config.js`. Erro e aviso                                        |
| Formatacao           | Prettier 3                                               | Arquivos de staged, via `lint-staged` no `pre-commit`                   |
| Padrao de commit     | Commitlint + Husky                                       | Conventional Commits                                                    |
| Analise estatica     | SonarQube Community Build (LABENS)                       | Analise e cobertura — ver [sonarqube.md](sonarqube.md)                  |
| Execucao continua    | GitHub Actions                                           | `install` -> `test` -> `coverage` -> `sonar`                            |
| Banco                | PostgreSQL 16                                            | Persistencia e verificacao de constraints                               |

**Por que o ESLint esta na serie 9 e nao na 10.** O `typescript-eslint@8.70.1` que vem no
`eslint-config-next` nao implementa `scopeManager.addGlobals`, exigido pelo ESLint 10. Como o
`peerDependencies` declara suporte a 10, nao ha aviso de conflito na instalacao e o erro so
aparece ao lintar um arquivo nomeado. Demais detalhes em [tooling-decisions.md](tooling-decisions.md).
