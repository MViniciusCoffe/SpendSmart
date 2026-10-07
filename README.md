# SpendSmart

Aplicação web pessoal de controle financeiro: receitas, despesas, categorias, saldo e dashboard.

O projeto atende a disciplina de **Testes de Software** do Bacharelado em Sistemas de Informação
(BSI) da UFRN.

---

## Sobre este repositório

O SpendSmart é um **monolito fullstack Next.js com Supabase**, sem servidor HTTP próprio. Não há
rotas de API além das duas funções serverless em `pages/api/`, e não há código de assinatura ou
validação de token: a sessão é inteira do Supabase Auth.

Um backend Node.js/Express existiu até o commit `2599ad9` e foi removido. Tudo aqui descreve o
código atual.

---

## Equipe

| Membro                           | Papel                   | GitHub                                                   |
| :------------------------------- | :---------------------- | :------------------------------------------------------- |
| José Samuel Silva Lima           | Gerente / Testador (QA) | [@José-Samuel-Lima](https://github.com/Jose-Samuel-Lima) |
| Marcus Vinícius de Souza Azevedo | Desenvolvedor principal | [@MViniciusCoffe](https://github.com/MViniciusCoffe)     |

---

## Como executar

Requisitos: Node.js compatível com o Next.js 16, npm e Docker.

```bash
npm install
cp .env.development.example .env.development
```

Preencha `.env.development` com as quatro variáveis do Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=[https://seu-projeto.supabase.co](https://seu-projeto.supabase.co)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica
SUPABASE_SERVICE_ROLE_KEY=sua-chave-de-servico
DATABASE_URL=postgresql://usuario:senha@host:5432/postgres
```

O nome da chave pública é `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — o Supabase renomeou a antiga
`anon` para `publishable`, e `ANON_KEY` não é mais válido.

`SUPABASE_SERVICE_ROLE_KEY` **não pode** ter prefixo `NEXT_PUBLIC_`. Com esse prefixo ela vira
parte do bundle enviado ao navegador e qualquer visitante ganha acesso à conta inteira. Ela só é
lida dentro de `pages/api/`.

Aplique as migrations e suba a aplicação:

```bash
npm run migrations:up
npm run next:dev
```

O Next.js responde em `http://localhost:3000`.

### Atenção ao `npm run dev`

```bash
npm run dev        # NÃO use com o .env.development atual
```

Esse script sobe o Docker, espera a conexão e aplica as migrations antes de iniciar o Next.js. Ele lê
`DATABASE_URL` de `.env.development`, que hoje aponta para o **Supabase remoto**. Resultado: o
Postgres do container sobe sem ser usado, e as migrations vão para o banco real.

Use `npm run next:dev` para desenvolvimento, ou corrija o `.env.development` antes. O diagnóstico
completo está em [docs/environments.md](docs/environments.md).

---

## Estrutura

```text
SpendSmart/
  pages/          interface React (Pages Router)
    api/          duas rotas serverless: createProfile, deleteAccount
  components/     Navbar, estilos globais, guarda de sessão
  services/       camada de negócio: validação, tradução de domínio, mapeamento de erros
  infra/          cliente Supabase, Docker Compose, scripts de desenvolvimento
  supabase/migrations/   schema do banco (node-pg-migrate)
  tests/          suíte Jest — ver o estado real abaixo
  docs/           documentação
```

A separação de responsabilidades adotada:

| Camada       | Arquivo             | Responsabilidade                                                |
| :----------- | :------------------ | :-------------------------------------------------------------- |
| Interface    | `pages/`            | React, validação de formulário, chamada ao service              |
| Negócio      | `services/`         | Regra de negócio, tradução PT/EN, mensagem de erro em português |
| Cliente      | `infra/supabase.js` | Instância única do `createClient`                               |
| Privilegiado | `pages/api/`        | Único lugar que lê `SUPABASE_SERVICE_ROLE_KEY`                  |

---

## Regras que não se negociam

1. **Supabase Auth é a única autenticação.** Não introduzir JWT próprio, cookie de sessão manual
   nem comparação de senha em SQL.
2. **`user_id` vem sempre da sessão, nunca do corpo da requisição.** referência:
   `services/categoryService.js:31,41` e `services/transactionService.js:33,46`.
3. **RLS é a última barreira, não a única.** Filtrar por `user_id` em toda leitura e escrita, além
   da política.
4. **Dinheiro é `numeric(12,2)` com `check (amount > 0)`.** Nunca float.
5. **`type` aceita apenas `income` ou `expense` no banco.** A tradução para receita/despesa
   acontece só na fronteira do service.
6. **Nunca concatenar input em SQL.**
7. **Categoria em uso não pode ser apagada** (`on delete restrict`).

---

## Estado real do projeto

Isto importa mais do que qualquer checklist antigo: o repositório está em **revitalização** e vários
itens que pareciam prontos não estão.

| Item                                        | Estado                                       |
| :------------------------------------------ | :------------------------------------------- |
| Cadastro, login, logout, perfil             | Funcionando                                  |
| Categorias: criar, listar, alterar, excluir | Funcionando                                  |
| Receitas e despesas: criar, listar, excluir | Funcionando, com defeitos conhecidos         |
| Dashboard com gráficos                      | Funcionando                                  |
| Excluir conta                               | Funcionando                                  |
| Testes de unidade                           | **65 testes, 100% nos 4 `services/`**        |
| Testes de integração                        | **Nenhum**                                   |
| `npm test`                                  | **Passa** — 65/65, sem erro                  |
| CI no GitHub Actions                        | **Dois workflows** — `test.yml` e `lint.yml` |
| RLS aplicado e validado                     | **Nunca foi validado** com dois usuários     |
| Ambientes separados                         | **Não existem** — um único banco para tudo   |

### Defeitos conhecidos

| #                                                             | Problema                                                                                                                    |
| :------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------- |
| [#10](https://github.com/MViniciusCoffe/SpendSmart/issues/10) | Receitas salvas sem título: o input está ligado a `nome`, o envio usa `fonteRenda`                                          |
| [#21](https://github.com/MViniciusCoffe/SpendSmart/issues/21) | Detalhe de transação sempre vazio: a UI lê `data`/`forma_pagamento`, o service devolve `data_ocorrencia`/`metodo_pagamento` |
| [#22](https://github.com/MViniciusCoffe/SpendSmart/issues/22) | Navbar renderizada duas vezes nas rotas privadas                                                                            |
| [#23](https://github.com/MViniciusCoffe/SpendSmart/issues/23) | Rotas públicas quebradas: `/cadastro` vs `/register`, `/about` vazia, `/contact` inexistente                                |
| [#25](https://github.com/MViniciusCoffe/SpendSmart/issues/25) | Cadastro sem rollback: se o perfil falhar, sobra uma conta no Auth sem perfil                                               |

### Sobre o RLS nunca ter sido validado

As políticas só são criadas quando `auth.users` existe (`001_create_financial_schema.js:101`). No
PostgreSQL local essa tabela não existe, portanto **o RLS nunca é aplicado ali** — e o banco local
aceita qualquer `user_id` sem reclamar. Isso significa que nenhuma garantia de isolamento entre
usuários foi verificada até hoje em nenhum ambiente. É o motivo de a issue
[#20](https://github.com/MViniciusCoffe/SpendSmart/issues/20) existir.

---

## Documentação

Cada assunto tem um único documento canônico. Não há duas fontes para o mesmo fato.

Os identificadores RF01 a RF16, RNF01 a RNF07 e US-001 a US-016 vêm dos documentos da disciplina.
As versões `.docx` desses documentos não são versionadas: o conteúdo relevante está reescrito nos
arquivos abaixo, em Markdown.

### Requisitos e testes

| Documento                                                          | Conteúdo                                                                               |
| :----------------------------------------------------------------- | :------------------------------------------------------------------------------------- |
| [Documento de Visão](docs/vision.md)                               | Escopo, personas, RF01–RF16, RNF01–RNF07, riscos e equipe                              |
| [User Stories](docs/user-stories.md)                               | `US-001` a `US-016`, derivadas de RF01 a RF16, com critérios de aceitação              |
| [Plano de testes](docs/test-plan.md)                               | Níveis de teste, 10 casos de integração, matriz US/RF, riscos, papéis                  |
| [Plano de teste das iterações 1 e 2](docs/test-plan-iterations.md) | 17 casos de teste com passos, dados de entrada, resultado esperado e sintaxe Gherkin   |
| [Estado atual dos testes](docs/test-state-report.md)               | Diagnóstico formal: 65 testes unitários, cobertura, integração ausente, débito técnico |

### Planejamento de iterações

| Documento                                    | Conteúdo                                                             |
| :------------------------------------------- | :------------------------------------------------------------------- |
| [Plano de iterações](docs/iteration-plan.md) | 6 iterações no semestre, com distribuição de US por membro e período |
| [Plano da iteração 1](docs/iteration-1.md)   | Tarefas detalhadas, cronograma e critérios de entrada/saída (I1)     |

### Arquitetura e dados

| Documento                                             | Conteúdo                                                                       |
| :---------------------------------------------------- | :----------------------------------------------------------------------------- |
| [Esquema do banco](docs/database-schema.md)           | Tabelas, constraints, índices, 3FN, RLS, limites conhecidos                    |
| [Opções de arquitetura](docs/architecture-options.md) | ADR de 2026-09-22: as opções avaliadas e a adotada                             |
| [Migrações futuras](docs/future-migrations.md)        | Propostas em SQL para `profiles` em inglês, `updated_at` e coerência de `type` |
| [Infraestrutura local](docs/local-infrastructure.md)  | Docker Compose, comandos e o que o Postgres local não valida                   |

### Operação

| Documento                                           | Conteúdo                                                                     |
| :-------------------------------------------------- | :--------------------------------------------------------------------------- |
| [Ambientes](docs/environments.md)                   | Matriz de ambientes, variáveis, o problema do `npm run dev`                  |
| [SonarQube](docs/sonarqube.md)                      | Análise estática no LABENS: escopo medido, cobertura, resultado e pendências |
| [Decisões de ferramenta](docs/tooling-decisions.md) | Por que cada versão foi escolhida: ESLint 9, Jest, Husky, escopo do Sonar    |

## Trabalho acadêmico em andamento

Issues abertas, em ordem de dependência:

| #                                                             | Assunto                        | Bloqueia  |
| :------------------------------------------------------------ | :----------------------------- | :-------- |
| [#16](https://github.com/MViniciusCoffe/SpendSmart/issues/16) | Testes de integração           | #17       |
| [#17](https://github.com/MViniciusCoffe/SpendSmart/issues/17) | Cobertura LCOV                 | #19       |
| [#19](https://github.com/MViniciusCoffe/SpendSmart/issues/19) | SonarQube LABENS               | Tarefa 01 |
| [#2](https://github.com/MViniciusCoffe/SpendSmart/issues/2)   | Supabase CLI e ambiente local  | #24       |
| [#24](https://github.com/MViniciusCoffe/SpendSmart/issues/24) | Proteção server-side e headers | —         |
| [#20](https://github.com/MViniciusCoffe/SpendSmart/issues/20) | Separar ambientes              | —         |
| [#33](https://github.com/MViniciusCoffe/SpendSmart/issues/33) | Cobertura de front-end         | —         |
| [#29](https://github.com/MViniciusCoffe/SpendSmart/issues/29) | `createProfile` sem token      | —         |

Resolvidos pela frente de testes, CI e SonarQube: #15, #17, #18, #19, #26 e #31.

---

## Commits

Conventional Commits, em português:

```text
docs:    feat:    fix:    refactor:    test:    chore:
```

Regra dura: **não misturar migração de banco, refactor visual e infra no mesmo commit.** O corpo
do commit explica o _porquê_, não o _o que_. Nenhum commit deve afirmar que algo funciona sem dizer
como foi verificado.
