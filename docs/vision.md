# SpendSmart — Documento de Visão

Documento de Visão do SpendSmart, segundo o modelo YP-Agentic / BSI (Doc 001), para a disciplina
de Testes de Software (BSI, UFRN, 2026).

Este documento descreve o sistema **tal como ele existe hoje**: um monolito fullstack Next.js com
Supabase, sem servidor HTTP próprio. A versão anterior descrevia o backend Node.js/Express que foi
removido do repositório (commit `2599ad9`) — os identificadores RF01 a RF16 e RNF01 a RNF07 foram
preservados para manter a rastreabilidade com [user-stories.md](user-stories.md) e
[test-plan.md](test-plan.md).

---

## 1. Introdução

### 1.1 Propósito do documento

Registrar o propósito, o escopo, os requisitos, os perfis de usuário e os riscos do SpendSmart,
servindo de referência inicial para orientar o desenvolvimento e alinhar o entendimento da equipe
sobre o produto. Os requisitos funcionais e não funcionais definidos aqui são a base da matriz de
rastreabilidade Requisito -> User Story -> Caso de Teste.

### 1.2 Escopo do produto

O SpendSmart é um aplicativo **pessoal** de controle financeiro: receitas, despesas, categorias,
saldo e dashboard. O sistema permite que o usuário crie uma conta, realize login, mantenha seus
dados cadastrais, crie e gerencie categorias dos tipos receita ou despesa, registre receitas e
despesas, consulte ou exclua esses lançamentos e acompanhe o resumo financeiro em um dashboard com
gráficos.

Não há multi-tenancy corporativo, SLA nem requisito de escala: o produto atende uma pessoa física,
em português do Brasil.

---

## 2. Problema e Oportunidade

### 2.1 Problema

Pessoas físicas, sem formação em gestão financeira, costumam controlar as próprias finanças em
planilhas, anotações e memória. Isso produz três problemas concretos: os gastos e receitas ficam
dispersos em várias ferramentas, o saldo real é difícil de calcular manualmente, e a privacidade
dos dados depende de planilhas espalhadas em e-mails e mensagens.

### 2.2 Oportunidade

Um aplicativo simples, em português do Brasil, que concentra registro de receitas e despesas,
categorias e um resumo visual do saldo permite que essa pessoa gereciane o próprio dinheiro em
uma única ferramenta, entendendo de onde vem e para onde vai o valor, sem depender de planilhas.

### 2.3 Solução proposta

Um monolito fullstack Next.js com Supabase: autenticação e banco de dados gerenciados como serviço,
interface em React, regra de negócio isolada na camada `services/` e isolamento entre usuários por
RLS. O produto é single-user por natureza — cada conta enxerga apenas os próprios dados.

---

## 3. Descrição geral

A aplicação é um **monolito fullstack Next.js (Pages Router) com Supabase**, sem servidor HTTP
próprio:

| Camada       | Onde                    | Responsabilidade                                                |
| :----------- | :---------------------- | :-------------------------------------------------------------- |
| Interface    | `pages/`, `components/` | React, validação de formulário, chamada ao service              |
| Negócio      | `services/`             | Regra de negócio, tradução PT/EN, mensagem de erro em português |
| Cliente      | `infra/supabase.js`     | Instância única do `createClient`                               |
| Privilegiado | `pages/api/`            | Únicas funções server-side: `createProfile`, `deleteAccount`    |
| Banco        | Supabase PostgreSQL     | Persistência com constraints, índices e RLS                     |
| Migrations   | `supabase/migrations/`  | `node-pg-migrate` (não Supabase CLI)                            |

A autenticação é inteiramente do **Supabase Auth**: não existe JWT próprio, cookie de sessão manual
nem comparação de senha em SQL. O `user_id` vem sempre da sessão, nunca do corpo da requisição.
O isolamento entre usuários é feito em dois níveis: filtro explícito por `user_id` em toda leitura e
escrita no service layer, e **Row Level Security** como última barreira no banco.

Em desenvolvimento a aplicação responde na porta 3000; em produção o deploy é na Vercel, que não
expõe porta.

---

## 4. Equipe e definição de papéis

| Equipe                           | Papel                                      | E-mail                             |
| :------------------------------- | :----------------------------------------- | :--------------------------------- |
| José Samuel Silva Lima           | Gerente / Testador (QA)                    | jose.lima.146@ufrn.edu.br          |
| Marcus Vinícius de Souza Azevedo | Desenvolvedor principal / Analista técnico | infobasicifrn2017marcusv@gmail.com |

A atribuição acima reflete a história real do repositório: a migração do backend Express legado
para a arquitetura Supabase atual, a suíte de testes de unidade, o lint, a CI e a integração com o
SonarQube foram feitos por Marcus Vinícius (setembro/outubro de 2026). José Samuel Silva Lima
responde pela gestão do projeto e pelo QA, e contribuiu com a primeira suíte de testes do repositório
(commit `d5729cb`, Tarefa 01 da disciplina).

---

## 5. Matriz de competências

| Equipe                           | Competências                                                              |
| :------------------------------- | :------------------------------------------------------------------------ |
| José Samuel Silva Lima           | Gestão de projeto, testes de aceitação, qualidade (QA)                    |
| Marcus Vinícius de Souza Azevedo | JavaScript, React/Next.js, PostgreSQL, Supabase, testes automatizados, CI |

---

## 6. Requisitos funcionais

Os requisitos abaixo descrevem o comportamento esperado do sistema. Os identificadores são os
mesmos do documento da disciplina; a descrição foi atualizada para a arquitetura atual e cada um
aponta para a User Story que o implementa (ver [user-stories.md](user-stories.md)). A prioridade
segue a escala do modelo YP-Agentic (P0 essencial, P1 desejável).

| ID   | Requisito           | Prioridade | Descrição                                                                                                              | Ator                | US     |
| :--- | :------------------ | :--------- | :--------------------------------------------------------------------------------------------------------------------- | :------------------ | :----- |
| RF01 | Cadastrar usuário   | P0         | Cadastro com nome completo, e-mail, senha, data de nascimento e telefone. E-mail já existente é impedido.              | Usuário             | US-001 |
| RF02 | Realizar login      | P0         | Autenticação por e-mail e senha pelo Supabase Auth, com mensagem que não revela se o e-mail existe.                    | Usuário             | US-002 |
| RF03 | Consultar usuários  | P0         | Consulta dos dados do próprio usuário logado. Não existe listagem de outros usuários — seria falha de segurança.       | Usuário autenticado | US-003 |
| RF04 | Alterar usuário     | P0         | Alteração de nome completo, senha, data de nascimento e telefone do próprio perfil.                                    | Usuário autenticado | US-003 |
| RF05 | Excluir usuário     | P1         | Exclusão da conta com remoção em cascata de perfil, categorias e transações.                                           | Usuário autenticado | US-004 |
| RF06 | Cadastrar categoria | P0         | Criação informando nome, tipo, descrição e cor. O tipo é `income` ou `expense` (receita ou despesa na tela).           | Usuário autenticado | US-006 |
| RF07 | Listar categorias   | P0         | Consulta das categorias do usuário logado.                                                                             | Usuário autenticado | US-007 |
| RF08 | Alterar categoria   | P1         | Alteração de nome, tipo, descrição e cor, impedindo duplicidade de nome + tipo + usuário (`23505`).                    | Usuário autenticado | US-008 |
| RF09 | Excluir categoria   | P1         | Exclusão de categoria; categorias em uso são rejeitadas pelo banco (`23503`, `ON DELETE RESTRICT`).                    | Usuário autenticado | US-009 |
| RF10 | Cadastrar receita   | P0         | Registro com categoria, valor, título, data e forma de pagamento.                                                      | Usuário autenticado | US-010 |
| RF11 | Listar receitas     | P0         | Consulta das receitas do usuário logado.                                                                               | Usuário autenticado | US-011 |
| RF12 | Excluir receita     | P1         | Exclusão de uma receita existente.                                                                                     | Usuário autenticado | US-012 |
| RF13 | Cadastrar despesa   | P0         | Registro com categoria, valor, título, data e forma de pagamento.                                                      | Usuário autenticado | US-013 |
| RF14 | Listar despesas     | P0         | Consulta das despesas do usuário logado.                                                                               | Usuário autenticado | US-014 |
| RF15 | Excluir despesa     | P1         | Exclusão de uma despesa existente.                                                                                     | Usuário autenticado | US-015 |
| RF16 | Proteger operações  | P0         | Rotas privadas exigem sessão (`withAuth`) e o banco só devolve linhas do próprio usuário (RLS + filtro por `user_id`). | Sistema             | US-005 |

### 6.1 Limitações conhecidas na implementação atual

Registradas para que o teste saiba o que esperar (detalhes e issues em
[user-stories.md](user-stories.md)):

- Receitas podem ser gravadas sem título (issue #10).
- O detalhe de transação lê campos que o service não devolve (issue #21).
- O cadastro não tem rollback: se a gravação do perfil falhar, sobra uma conta sem perfil (issue #25).
- O RLS nunca foi validado com dois usuários em nenhum ambiente (issue #20).

---

## 7. Requisitos não-funcionais

Os IDs e as verificações correspondentes estão detalhados em [test-plan.md](test-plan.md) §3.

| ID    | Requisito                 | Descrição                                                                                                                          |
| :---- | :------------------------ | :--------------------------------------------------------------------------------------------------------------------------------- |
| RNF01 | Tecnologia                | Node.js com Next.js (Pages Router), sem servidor HTTP próprio; únicas rotas server-side em `pages/api/`.                           |
| RNF02 | Formato de comunicação    | Comunicação em JSON: cliente -> Supabase via PostgREST e as duas rotas serverless recebem/devolvem JSON.                           |
| RNF03 | Persistência              | Dados em PostgreSQL com constraints, índices e migrações versionadas (`numeric(12,2)`, `CHECK (amount > 0)`).                      |
| RNF04 | Autenticação e isolamento | Sessão gerenciada pelo Supabase Auth; nenhum dado de um usuário visível a outro (filtro por `user_id` + RLS).                      |
| RNF05 | Acesso entre origens      | CORS configurado no painel do projeto Supabase, não no código.                                                                     |
| RNF06 | Execução                  | Desenvolvimento na porta 3000; produção na Vercel, sem porta exposta.                                                              |
| RNF07 | Manutenibilidade          | Separação entre interface (`pages/`), regra de negócio (`services/`), cliente (`infra/`) e operações privilegiadas (`pages/api/`). |

---

## 8. Perfis dos usuários

### 8.1 Usuário financeiro

Pessoa física, leiga, que usa o aplicativo para controlar o próprio dinheiro. Cria uma conta,
realiza login, mantém dados cadastrais, cria categorias, registra receitas e despesas, consulta o
saldo e o dashboard e pode excluir a conta a qualquer momento.

Não existe perfil administrativo: todos os usuários têm as mesmas permissões sobre os próprios
dados. O produto é single-user por natureza — a privacidade entre usuários é garantida por RLS e é
o requisito de segurança central (RNF04).

---

## 9. Restrições do Projeto

- **JavaScript puro, sem TypeScript.** Decisão consciente do estado atual do projeto; não migrar
  sem discussão e sem avaliar o custo sobre a base existente.
- **Supabase Auth é a única autenticação.** Não introduzir JWT próprio, cookie de sessão manual
  nem comparação de senha em SQL.
- **`user_id` sempre da sessão**, nunca do corpo da requisição; RLS é a última barreira, não a única.
- **Valores monetários em `numeric(12,2)`** com `CHECK (amount > 0)`. Nunca float.
- **Migrations via node-pg-migrate**; não editar `001_create_financial_schema.js`, que já foi
  aplicada — mudanças de banco entram por migration nova com timestamp.
- **Produto pessoal, single-user**, sem multi-tenancy corporativo, SLA ou requisito de escala.
- **Prazo da unidade 1:** entregas P1, P2, Tarefa 02 e Tarefa 03 em 06/10/2026; semestre com 6
  iterações (2 por unidade) e pelo menos 1 User Story por membro por iteração.
- **Equipe de 2 integrantes** (José Samuel Silva Lima e Marcus Vinícius de Souza Azevedo).

---

## 10. Riscos

A tabela é revisada ao final de cada iteração, conforme o modelo BSI.

| Data       | Risco Levantado                                                                                 | Prioridade | Responsável | Status    | Providência/Solução                                                                                        |
| :--------- | :---------------------------------------------------------------------------------------------- | :--------- | :---------- | :-------- | :--------------------------------------------------------------------------------------------------------- |
| 03/09/2026 | Dados sensíveis e credenciais armazenados de forma inadequada no backend legado                 | Alta       | Equipe      | Vigente   | Backend Express removido; segredos vivem em `.env*`, fora do versionamento.                                |
| 03/09/2026 | Chave JWT definida diretamente no código                                                        | Alta       | Equipe      | Resolvido | Risco encerrado com a remoção do backend JWT; autenticação agora é do Supabase Auth.                       |
| 06/10/2026 | RLS nunca validado: o isolamento entre usuários não foi exercitado em ambiente algum            | Alta       | Marcus      | Vigente   | Testes de integração contra a stack local do Supabase (issue #20).                                         |
| 06/10/2026 | `.env.development` aponta para o Supabase remoto: `npm run dev` aplica migrations no banco real | Alta       | Marcus      | Vigente   | Issue #20; usar `npm run next:dev` até a separação de ambientes.                                           |
| 06/10/2026 | `pages/api/createProfile.js` usa `service_role` sem validar o token                             | Alta       | Equipe      | Vigente   | Issue #29.                                                                                                 |
| 06/10/2026 | Débito de testes: nenhuma integração automatizada e front-end sem cobertura                     | Média      | Equipe      | Vigente   | [test-state-report.md](test-state-report.md); issues #16 e #33.                                            |
| 06/10/2026 | `transactions.type` pode não corresponder a `categories.type`                                   | Média      | Equipe      | Vigente   | Constraint ou trigger em migração futura ([future-migrations.md](future-migrations.md)).                   |
| 06/10/2026 | Duplicação entre `pages/gastosPage.js` e `pages/rendaPage.js` (~1.100 linhas)                   | Média      | Equipe      | Vigente   | Issues #6 e #22.                                                                                           |
| 06/10/2026 | Divisão de tarefas inadequada                                                                   | Baixa      | Gerente     | Vigente   | Acompanhar as atividades e revisar o cronograma em cada iteração ([iteration-plan.md](iteration-plan.md)). |

---

## 11. Suposições e dependências

- O usuário acessa por navegador moderno; não há requisito de compatibilidade com navegadores legados.
- O ambiente de execução tem Node.js e as dependências do projeto instaladas.
- O projeto Supabase (Auth, Postgres, RLS) permanece disponível e acessível.
- O deploy de produção é feito na Vercel, que executa o Next.js gerado.
- Relatórios, metas financeiras e notificações **não fazem parte do escopo** enquanto não houver
  decisão registrada em issue.
- A validação de desempenho e carga não tem critério definido; se for exigida, será preciso
  definir requisitos antes de testar.

---

## 12. Perspectiva do produto

O fluxo principal começa com a criação da conta e o login. Autenticado, o usuário monta suas
categorias e registra lançamentos; o dashboard agrega receitas e despesas em saldo, totais e
gráficos por categoria.

| Módulo       | Principais operações                                                                 |
| :----------- | :----------------------------------------------------------------------------------- |
| Autenticação | Cadastro, login, logout e recuperação de sessão (Supabase Auth)                      |
| Perfil       | Consulta e alteração de dados cadastrais, troca de senha, exclusão de conta          |
| Categorias   | Cadastro, consulta, alteração e exclusão (receita ou despesa)                        |
| Transações   | Cadastro, consulta e exclusão de receitas e despesas (entidade única `transactions`) |
| Dashboard    | Saldo, totais de entradas e saídas, gráficos por categoria                           |
| Banco        | Persistência em PostgreSQL com RLS e migrations versionadas                          |

---

## 13. Critérios de Sucesso

| Métrica                                                 | Valor Atual | Meta                                             | Prazo                        |
| :------------------------------------------------------ | :---------- | :----------------------------------------------- | :--------------------------- |
| Cobertura de unidade em `services/`                     | 100%        | manter >= 90%                                    | contínuo                     |
| Testes de integração com RLS executados (IT-01 a IT-10) | 0           | 10 casos (ver [test-plan.md](test-plan.md) §2.2) | fim da unidade 1 (issue #20) |
| Code smells no SonarQube                                | 14          | 0                                                | iteração posterior           |
| Cobertura de front-end (`pages/`, `components/`)        | 0%          | meta a definir                                   | issue #33                    |
| CI verde em `main` (test, lint, sonar)                  | verde       | sempre verde                                     | contínuo                     |
| User Stories por membro por iteração                    | 2 US/it     | >= 1 por membro em todas as 6 iterações          | semestre                     |

---

## 14. Referências

- Modelo BSI - Doc 001 - Documento de Visão. Processo de Desenvolvimento BSI, UFRN, CERS, DCT.
- Modelo YP-Agentic - Doc de Visão (`tacianosilva/engenharia-software/yp-agentic/templates/doc-visao.md`).
- [user-stories.md](user-stories.md) — US-001 a US-016 com critérios de aceitação.
- [test-plan.md](test-plan.md) — plano de testes e matriz de rastreabilidade.
- [test-state-report.md](test-state-report.md) — relatório do estado atual dos testes.
- [database-schema.md](database-schema.md) — esquema do banco, constraints e RLS.
- Código-fonte do repositório SpendSmart (monolito Next.js + Supabase).

---

## 15. Histórico de revisões

| Data       | Versão | Descrição                                                                                                                                                                                                                                                                                          | Autor             |
| :--------- | :----- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------- |
| 03/09/2026 | 1.0    | Documento inicial, elaborado a partir do backend Express disponibilizado para análise.                                                                                                                                                                                                             | Equipe SpendSmart |
| 06/10/2026 | 2.0    | Reescrito para a arquitetura atual (Next.js + Supabase Auth + RLS) após a remoção do backend Express; papéis e matriz de competências ajustados conforme o histórico de commits; alinhamento ao modelo YP-Agentic (Problema e Oportunidade, Restrições, Critérios de Sucesso, prioridades nos RF). | Marcus Vinícius   |
