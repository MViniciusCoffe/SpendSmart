# SpendSmart

Aplicacao web para controle financeiro pessoal. O projeto permite organizar receitas, despesas e categorias, acompanhar o saldo e visualizar os dados em um dashboard.

Este repositorio esta em revitalizacao. A infraestrutura antiga nao esta mais disponivel e o backend ainda nao foi integrado a este repositorio.

## Estado atual

### Frontend

O frontend atual utiliza:

- Next.js 16 com Pages Router
- React 19
- JavaScript
- Axios
- Chart.js e react-chartjs-2
- CSS Modules e CSS global

Funcionalidades existentes:

- Pagina inicial com carrossel
- Cadastro e login
- Dashboard financeiro
- Cadastro e exclusao de receitas
- Cadastro e exclusao de despesas
- Criacao, edicao e exclusao de categorias
- Configuracoes e exclusao da conta
- Logout

### Backend e infraestrutura

- O backend legado era uma API Express com PostgreSQL e JWT.
- A API antiga apontava para uma infraestrutura AWS que nao esta mais disponivel.
- Nenhum segredo, credencial ou URL antiga deve ser reutilizado.
- O backend legado ainda precisa ser trazido para uma pasta propria antes da avaliacao definitiva.
- O banco novo sera avaliado no Supabase.

## Executar o frontend

Requisitos:

- Node.js compativel com a versao atual do Next.js
- npm

Instalacao:

```bash
npm install
```

Desenvolvimento:

```bash
npm run dev
```

Por padrao, o Next.js inicia em `http://localhost:3000`.

O frontend atual ainda possui chamadas para a API antiga. A aplicacao pode iniciar localmente, mas as operacoes que dependem do backend nao serao consideradas funcionais ate a migracao da camada de dados.

## Estrutura atual

```text
pages/
	_app.js
	index.js
	login.js
	register.js
	dashboard.js
	rendaPage.js
	gastosPage.js
	categoriaPage.js
	accountConfig.js
	about.js
	components/
		Navbar/
		style/
		utils/
public/
	images/
```

## Decisao arquitetural em aberto

O projeto precisa escolher uma unica fonte de verdade para autenticacao e acesso aos dados. As opcoes consideradas sao:

### Opcao recomendada: Next.js e Supabase

```text
Next.js na Vercel
Supabase Auth
Supabase PostgreSQL
Row Level Security
```

Nesta opcao, o frontend usa a sessao do Supabase e as politicas RLS isolam os dados por usuario. O backend Express legado pode ser removido ou mantido apenas como referencia durante a migracao.

Vantagens:

- Menos infraestrutura para manter
- Autenticacao pronta e mais segura
- Banco, autenticacao e politicas no mesmo ecossistema
- Deploy mais simples na Vercel

### Opcao alternativa: Express separado

```text
Next.js na Vercel
Express em um servico de backend
Supabase PostgreSQL
```

Esta opcao deve ser escolhida somente se o projeto precisar de regras de negocio, integracoes ou processamento que justifiquem uma API propria. Ela exige configurar CORS, deploy separado, variaveis adicionais e autenticacao entre os servicos.

Nao devemos manter Supabase Auth e um sistema proprio de JWT como autenticacoes independentes.

## Decisoes que precisam ser tomadas

1. O Express continuara na arquitetura final ou sera apenas uma referencia para a migracao?
2. A autenticacao sera feita pelo Supabase Auth?
3. O frontend acessara o Supabase diretamente ou por uma camada de servico/API?
4. O backend sera integrado como `backend/` ou o projeto usara apenas o Next.js?
5. Quais campos de perfil serao mantidos alem da identidade do Supabase Auth?
6. Qual sera o modelo definitivo de categorias, receitas e despesas?
7. Quais funcionalidades entram na primeira versao publicada?
8. Qual sera a estrategia de validacao, testes e tratamento de erros?
9. Quais dominios e ambientes serao usados em desenvolvimento e producao?

## Plano de revitalizacao

Use a lista abaixo para acompanhar a execucao. Marque uma tarefa somente depois de validar o resultado e registre decisoes importantes na secao de diario tecnico.

### Progresso geral

- [x] Documentar o estado atual e o plano inicial
- [x] Integrar o backend legado ao repositorio
- [x] Concluir o inventario de contratos
- [ ] Escolher e registrar a arquitetura final
- [ ] Criar o projeto e o schema do Supabase
- [ ] Implementar a nova autenticacao
- [ ] Migrar as funcionalidades financeiras
- [ ] Revisar e completar a interface
- [ ] Adicionar testes e validacoes
- [ ] Publicar em ambiente de producao

### Fase 0: preparacao e inventario

- [ ] Confirmar que a branch de trabalho esta atualizada
- [x] Criar ou revisar o `.gitignore`
- [ ] Confirmar que nenhum `.env`, segredo ou `node_modules` sera copiado
- [x] Criar a pasta `backend/`
- [x] Copiar o backend legado sem alterar seu comportamento
- [x] Confirmar que o backend possui um `package.json` proprio
- [ ] Remover o `backend/.env` local ou substituir por `.env.example` sem segredos
- [ ] Confirmar que credenciais antigas foram revogadas ou rotacionadas
- [x] Listar todas as rotas existentes
- [x] Listar todas as chamadas Axios do frontend
- [x] Comparar payloads enviados e respostas esperadas
- [x] Mapear tabelas, colunas e relacionamentos usados pelo backend
- [x] Identificar URLs, credenciais e segredos antigos
- [x] Registrar incompatibilidades entre frontend e backend

**Criterio de conclusao:** frontend e backend estao no mesmo repositorio, o contrato atual esta documentado e nenhum segredo antigo foi trazido para a branch.

Documentos produzidos nesta fase:

- [Inventario da API legada](docs/api-inventory.md)
- [Esquema de banco de dados](docs/database-schema.md)
- [Opcoes de arquitetura](docs/architecture-options.md)
- [Bibliotecas e reestruturacao do backend](docs/backend-restructure.md)

### Fase 1: decisao arquitetural

- [ ] Comparar Supabase direto pelo frontend, API do Next.js e Express separado
- [ ] Decidir se o Express sera temporario ou parte da arquitetura final
- [ ] Decidir se o Supabase Auth sera a unica autenticacao
- [ ] Decidir se o frontend acessara o Supabase diretamente ou por uma camada de servico
- [ ] Definir os ambientes local, homologacao e producao
- [ ] Registrar a decisao e suas justificativas neste README

**Criterio de conclusao:** existe uma arquitetura escolhida, com responsabilidades claras e uma unica fonte de verdade para autenticacao.

### Fase 2: banco e Supabase

- [ ] Criar o projeto no Supabase
- [ ] Definir tabelas de perfil, categorias, receitas e despesas
- [ ] Definir chaves primarias e estrangeiras
- [ ] Definir campos obrigatorios e tipos monetarios
- [ ] Definir indices por usuario, categoria e data
- [ ] Criar migrations versionadas
- [ ] Criar constraints para tipo de categoria e valores positivos
- [ ] Criar politicas RLS para todas as tabelas privadas
- [ ] Criar seed de desenvolvimento, se necessario
- [ ] Testar o isolamento entre dois usuarios

**Criterio de conclusao:** o banco pode ser recriado por migrations e um usuario nao consegue consultar ou alterar dados de outro.

### Fase 3: autenticacao e camada de dados

- [ ] Criar `.env.example` sem valores secretos
- [ ] Configurar Supabase Auth
- [ ] Implementar cadastro
- [ ] Implementar login
- [ ] Implementar logout
- [ ] Implementar persistencia e recuperacao de sessao
- [ ] Proteger as paginas privadas
- [ ] Remover login e JWT antigos, se forem substituidos
- [ ] Remover URLs hardcoded da AWS
- [ ] Centralizar o cliente Supabase ou cliente HTTP
- [ ] Centralizar tratamento de erros e sessao expirada
- [ ] Garantir que o usuario autenticado seja a origem do `user_id`

**Criterio de conclusao:** o usuario consegue criar conta, entrar, manter a sessao, sair e acessar apenas os proprios dados.

### Fase 4: funcionalidades financeiras

- [ ] Migrar criacao de categorias
- [ ] Migrar edicao de categorias
- [ ] Migrar exclusao de categorias
- [ ] Migrar criacao de receitas
- [ ] Migrar listagem de receitas
- [ ] Migrar exclusao de receitas
- [ ] Migrar criacao de despesas
- [ ] Migrar listagem de despesas
- [ ] Migrar exclusao de despesas
- [ ] Migrar configuracoes da conta
- [ ] Migrar exclusao da conta
- [ ] Atualizar calculo de saldo
- [ ] Atualizar os graficos do dashboard
- [ ] Validar datas, valores e categorias

**Criterio de conclusao:** o fluxo financeiro principal funciona com dados reais do Supabase e os calculos do dashboard conferem com os registros.

### Fase 5: qualidade e interface

- [ ] Corrigir estados de carregamento
- [ ] Corrigir estados vazios
- [ ] Padronizar mensagens de erro
- [ ] Revisar responsividade
- [ ] Revisar acessibilidade de formularios e navegacao
- [ ] Completar a pagina Sobre ou remover o link
- [ ] Criar a pagina de contato ou remover o link quebrado
- [ ] Reduzir duplicacao entre formularios
- [ ] Revisar navegacao autenticada e publica
- [ ] Confirmar que nenhum texto ou componente depende da API antiga

**Criterio de conclusao:** as telas principais funcionam em desktop e celular, com feedback claro para carregamento, sucesso, erro e ausencia de dados.

### Fase 6: testes e deploy

- [ ] Adicionar teste de cadastro
- [ ] Adicionar teste de login e logout
- [ ] Adicionar teste de sessao invalida
- [ ] Adicionar teste de categorias
- [ ] Adicionar teste de receitas
- [ ] Adicionar teste de despesas
- [ ] Adicionar teste de isolamento entre usuarios
- [ ] Adicionar teste de valores e payloads invalidos
- [ ] Executar lint
- [ ] Executar build de producao
- [ ] Testar producao localmente
- [ ] Criar projeto na Vercel
- [ ] Configurar variaveis de ambiente na Vercel
- [ ] Configurar URLs de redirect do Supabase Auth
- [ ] Validar refresh nas paginas internas
- [ ] Validar login em producao
- [ ] Documentar instalacao, ambiente e deploy

**Criterio de conclusao:** o build e os testes passam, o deploy funciona e os fluxos essenciais foram testados com dois usuarios.

## Diario tecnico

Use esta secao para registrar decisoes que possam afetar as proximas etapas.

| Data | Decisao ou resultado | Impacto |
| --- | --- | --- |
| 2026-09-22 | README transformado em roteiro incremental | Acompanhamento da revitalizacao passa a ser feito neste arquivo |

## Historico de atualizacoes

- 2026-09-22: criado o roteiro de fases, checklists e criterios de conclusao.

## Variaveis de ambiente

Nenhum arquivo `.env` real deve ser commitado. Quando a integracao for implementada, as variaveis publicas do frontend poderao ser documentadas em `.env.example`, por exemplo:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Chaves privadas, como `SUPABASE_SERVICE_ROLE_KEY`, nunca devem usar o prefixo `NEXT_PUBLIC_` e nunca devem ser expostas no navegador.

## Commits e branches

Cada commit deve representar uma mudanca coerente e verificavel. Exemplos:

```text
docs: documenta estado atual e plano de revitalizacao
chore: integra backend legado no monorepo
feat: adiciona schema inicial do supabase
feat: implementa autenticacao com supabase
refactor: centraliza acesso aos dados financeiros
fix: corrige isolamento de dados por usuario
test: adiciona testes de autenticacao e autorizacao
chore: configura deploy na vercel
```

Nesta branch, o primeiro commit recomendado e:

```text
docs: documenta estado atual e plano de revitalizacao
```

Depois, cada etapa deve ser validada e commitada separadamente. Nao misture migracao do backend, redesign visual e configuracao de deploy no mesmo commit.

## Critério para a primeira entrega

A primeira versao revitalizada devera permitir que um usuario:

- crie uma conta;
- entre e saia da aplicacao;
- crie categorias;
- registre receitas e despesas;
- visualize o saldo e o dashboard;
- acesse somente os proprios dados;
- use a aplicacao em desktop e celular.

O deploy somente sera considerado pronto depois de validar essas operacoes com pelo menos dois usuarios diferentes.
