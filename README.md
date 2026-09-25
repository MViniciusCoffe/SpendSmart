# SpendSmart

Aplicacao web pessoal de controle financeiro: receitas, despesas, categorias, saldo e dashboard.

O projeto atende a disciplina de **Testes de Software** do Bacharelado em Sistemas de Informacao
(BSI) da UFRN.

---

## Sobre este repositorio

O SpendSmart e um **monolito fullstack Next.js com Supabase**, sem servidor HTTP proprio. Nao ha
rotas de API alem das duas funcoes serverless em `pages/api/`, e nao ha codigo de assinatura ou
validacao de token: a sessao e inteira do Supabase Auth.

Um backend Node.js/Express existiu ate o commit `2599ad9` e foi removido. Tudo aqui descreve o
codigo atual.

---

## Como executar

Requisitos: Node.js compativel com o Next.js 16, npm e Docker.

```bash
npm install
cp .env.development.example .env.development
```

Preencha `.env.development` com as quatro variaveis do Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica
SUPABASE_SERVICE_ROLE_KEY=sua-chave-de-servico
DATABASE_URL=postgresql://usuario:senha@host:5432/postgres
```

O nome da chave publica e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — o Supabase renomeou a antiga
`anon` para `publishable`, e `ANON_KEY` nao e mais valido.

`SUPABASE_SERVICE_ROLE_KEY` **nao pode** ter prefixo `NEXT_PUBLIC_`. Com esse prefixo ela vira
parte do bundle enviado ao navegador e qualquer visitante ganha acesso a conta inteira. Ela so e
lida dentro de `pages/api/`.

Aplique as migrations e suba a aplicacao:

```bash
npm run migrations:up
npm run next:dev
```

O Next.js responde em `http://localhost:3000`.

### Atencao ao `npm run dev`

```bash
npm run dev        # NAO use com o .env.development atual
```

Esse script sobe o Docker, espera a conexao e aplica as migrations antes de iniciar o Next.js. Ele le
`DATABASE_URL` de `.env.development`, que hoje aponta para o **Supabase remoto**. Resultado: o
Postgres do container sobe sem ser usado, e as migrations vao para o banco real.

Use `npm run next:dev` para desenvolvimento, ou corrija o `.env.development` antes. O diagnostico
completo esta em [docs/environments.md](docs/environments.md).

---

## Estrutura

```text
SpendSmart/
  pages/          interface React (Pages Router)
    api/          duas rotas serverless: createProfile, deleteAccount
  components/     Navbar, estilos globais, guarda de sessao
  services/       camada de negocio: validacao, traducao de dominio, mapeamento de erros
  infra/          cliente Supabase, Docker Compose, scripts de desenvolvimento
  supabase/migrations/   schema do banco (node-pg-migrate)
  tests/          suite Jest — ver o estado real abaixo
  docs/           documentacao
```

A separacao de responsabilidades adotada:

| Camada | Arquivo | Responsabilidade |
| --- | --- | --- |
| Interface | `pages/` | React, validacao de formulario, chamada ao service |
| Negocio | `services/` | Regra de negocio, traducao PT/EN, mensagem de erro em portugues |
| Cliente | `infra/supabase.js` | Instancia unica do `createClient` |
| Privilegiado | `pages/api/` | Unico lugar que le `SUPABASE_SERVICE_ROLE_KEY` |

---

## Regras que nao se negociam

1. **Supabase Auth e a unica autenticacao.** Nao introduzir JWT proprio, cookie de sessao manual
   nem comparacao de senha em SQL.
2. **`user_id` vem sempre da sessao, nunca do corpo da requisicao.** referencia:
   `services/categoryService.js:31,41` e `services/transactionService.js:33,46`.
3. **RLS e a ultima barreira, nao a unica.** Filtrar por `user_id` em toda leitura e escrita, alem
   da politica.
4. **Dinheiro e `numeric(12,2)` com `check (amount > 0)`.** Nunca float.
5. **`type` aceita apenas `income` ou `expense` no banco.** A traducao para receita/despesa
   acontece so na fronteira do service.
6. **Nunca concatenar input em SQL.**
7. **Categoria em uso nao pode ser apagada** (`on delete restrict`).

---

## Estado real do projeto

Isto importa mais do que qualquer checklist antigo: o repositorio esta em **revitalizacao** e varios
itens que pareciam prontos nao estao.

| Item | Estado |
| --- | --- |
| Cadastro, login, logout, perfil | Funcionando |
| Categorias: criar, listar, alterar, excluir | Funcionando |
| Receitas e despesas: criar, listar, excluir | Funcionando, com defeitos conhecidos |
| Dashboard com graficos | Funcionando |
| Excluir conta | Funcionando |
| Testes de unidade | **Nenhum sobre o codigo vivo** |
| Testes de integracao | **Nenhum** |
| `npm test` | **Falha** — ver abaixo |
| CI no GitHub Actions | **Quebrado** — aponta para um servico removido |
| RLS aplicado e validado | **Nunca foi validado** com dois usuarios |
| Ambientes separados | **Nao existem** — um unico banco para tudo |

### Defeitos conhecidos

| # | Problema |
| --- | --- |
| [#10](https://github.com/MViniciusCoffe/SpendSmart/issues/10) | Receitas salvas sem titulo: o input esta ligado a `nome`, o envio usa `fonteRenda` |
| [#21](https://github.com/MViniciusCoffe/SpendSmart/issues/21) | Detalhe de transacao sempre vazio: a UI le `data`/`forma_pagamento`, o service devolve `data_ocorrencia`/`metodo_pagamento` |
| [#22](https://github.com/MViniciusCoffe/SpendSmart/issues/22) | Navbar renderizada duas vezes nas rotas privadas |
| [#23](https://github.com/MViniciusCoffe/SpendSmart/issues/23) | Rotas publicas quebradas: `/cadastro` vs `/register`, `/about` vazia, `/contact` inexistente |
| [#25](https://github.com/MViniciusCoffe/SpendSmart/issues/25) | Cadastro sem rollback: se o perfil falhar, sobra uma conta no Auth sem perfil |
| [#26](https://github.com/MViniciusCoffe/SpendSmart/issues/26) | `npm test` falha e exercita `services/categoriaService.js`, que e codigo morto e nao e importado por nenhuma pagina |

### Sobre o RLS nunca ter sido validado

As politicas so sao criadas quando `auth.users` existe (`001_create_financial_schema.js:101`). No
PostgreSQL local essa tabela nao existe, portanto **o RLS nunca e aplicado ali** — e o banco local
aceita qualquer `user_id` sem reclamar. Isso significa que nenhuma garantia de isolamento entre
usuarios foi verificada ate hoje em nenhum ambiente. E o motivo de o issue
[#20](https://github.com/MViniciusCoffe/SpendSmart/issues/20) existir.

---

## Documentacao

Cada Assunto tem um unico documento canonico. Nao ha duas fontes para o mesmo fato.

Os identificadores RF01 a RF16, RNF01 a RNF07 e US-001 a US-016 vem dos documentos da disciplina.
As versoes `.docx` desses documentos nao sao versionadas: o conteudo relevante esta reescrito nos
arquivos abaixo, em Markdown.

### Requisitos e testes

| Documento | Conteudo |
| --- | --- |
| [User Stories](docs/user-stories.md) | `US-001` a `US-016`, derivadas de RF01 a RF16, com criterios de aceitacao |
| [Plano de testes](docs/test-plan.md) | niveis de teste, 10 casos de integracao, matriz US/RF, riscos |

### Arquitetura e dados

| Documento | Conteudo |
| --- | --- |
| [Esquema do banco](docs/database-schema.md) | tabelas, constraints, indices, 3FN, RLS, limites conhecidos |
| [Opcoes de arquitetura](docs/architecture-options.md) | ADR de 2026-09-22: as opcoes avaliadas e a adotada |
| [Migracoes futuras](docs/future-migrations.md) | propostas em SQL para `profiles` em ingles, `updated_at` e coerencia de `type` |
| [Infraestrutura local](docs/local-infrastructure.md) | Docker Compose, comandos e o que o Postgres local nao valida |

### Operacao

| Documento | Conteudo |
| --- | --- |
| [Ambientes](docs/environments.md) | matriz de ambientes, variaveis, o problema do `npm run dev` |
| [SonarQube](docs/sonarqube.md) | analise estatica no LABENS, com `sonar-project.properties` adapted a JS |

## Trabalho academico em andamento

Issues abertas, em ordem de dependencia:

| # | Assunto | Bloqueia |
| --- | --- | --- |
| [#26](https://github.com/MViniciusCoffe/SpendSmart/issues/26) | Corrigir a suite e o CI | #15, #16, #18 |
| [#15](https://github.com/MViniciusCoffe/SpendSmart/issues/15) | Testes de unidade | #17 |
| [#16](https://github.com/MViniciusCoffe/SpendSmart/issues/16) | Testes de integracao | #17 |
| [#17](https://github.com/MViniciusCoffe/SpendSmart/issues/17) | Cobertura LCOV | #19 |
| [#19](https://github.com/MViniciusCoffe/SpendSmart/issues/19) | SonarQube LABENS | Tarefa 01 |
| [#2](https://github.com/MViniciusCoffe/SpendSmart/issues/2) | Supabase CLI e ambiente local | #24 |
| [#24](https://github.com/MViniciusCoffe/SpendSmart/issues/24) | Protecao server-side e headers | — |
| [#20](https://github.com/MViniciusCoffe/SpendSmart/issues/20) | Separar ambientes | #18 |
| [#18](https://github.com/MViniciusCoffe/SpendSmart/issues/18) | Workflow de CI | Tarefa 01 |

---

## Commits

Conventional Commits, em portugues:

```text
docs:    feat:    fix:    refactor:    test:    chore:
```

Regra dura: **nao misturar migracao de banco, refactor visual e infra no mesmo commit.** O corpo
do commit explica o *por que*, nao o *o que*. Nenhum commit deve afirmar que algo funciona sem dizer
como foi verificado.
