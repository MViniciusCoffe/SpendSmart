# Bibliotecas e reestruturacao do backend

Este documento separa o que pode continuar, o que deve sair e o que deve ser adiado ate a decisao arquitetural.

## Bibliotecas do backend legado

| Dependencia | Situacao | Recomendacao |
| --- | --- | --- |
| `express` | Usada no app e nas rotas | Remover se o Express for aposentado; manter se houver API propria |
| `cors` | Usada com configuracao ampla | Remover na arquitetura Supabase direta; se Express continuar, restringir origens |
| `dotenv` | Usada, mas o banco ignora o ambiente | Manter somente para configuracao server-side por ambiente |
| `jsonwebtoken` | Usada no login e middleware | Remover se Supabase Auth for a unica autenticacao |
| `pg` | Usada para conexao PostgreSQL | Remover se o acesso for via Supabase client; manter somente se a API usar conexao server-side aprovada |
| `nodemon` | Desenvolvimento local | Manter apenas no pacote do backend enquanto o Express existir |
| `jest` | Teste unitario existente | Pode continuar; padronizar configuracao e separar testes unitarios de integracao |
| `prettier` | Formatacao | Pode continuar no repositorio, com scripts corrigidos |

## Bibliotecas do frontend legado

| Dependencia | Situacao | Recomendacao |
| --- | --- | --- |
| `next` | Framework atual | Manter inicialmente; nao migrar de Pages Router sem necessidade |
| `react` e `react-dom` | Base da interface | Manter |
| `axios` | Cliente HTTP para API antiga | Remover se o frontend usar Supabase client diretamente; manter se houver API propria |
| `js-cookie` | Armazena token e usuario | Remover ao migrar para sessao do Supabase; evitar persistencia manual de credenciais |
| `chart.js` e `react-chartjs-2` | Graficos do dashboard | Manter; fazem parte do valor atual do produto |

## Bibliotecas candidatas para a arquitetura nova

### Supabase

Adicionar o cliente oficial adequado ao modelo de renderizacao escolhido. A chave publica pode estar no navegador; a service role deve permanecer somente no servidor e, idealmente, nem ser necessaria no fluxo comum.

### Validacao

Adicionar uma biblioteca de schema, como Zod, se a camada de servicos ou Route Handlers receber payloads externos. A validacao deve existir alem das regras visuais dos formularios.

### Testes

- Jest pode continuar para unidades.
- Para componentes ou fluxos de navegador, avaliar Testing Library.
- Para testes HTTP, avaliar Supertest se o Express continuar.
- Para integracao com banco, usar um ambiente Supabase de teste ou uma estrategia isolada; nao depender do banco de producao.

Nao adicionar todas essas bibliotecas antes de escolher a arquitetura. Cada dependencia deve ter um caso de uso definido.

## O que deve ser reestruturado

### 1. Configuracao

Criar uma camada de configuracao por ambiente. Nenhuma URL, senha ou segredo deve ficar em codigo.

### 2. Entrada da aplicacao Express

Se o Express continuar:

```text
backend/src/app.js       # cria e configura o Express
backend/src/server.js    # chama listen somente em desenvolvimento/servidor proprio
```

O arquivo `app.js` deve ser exportavel para testes e ambientes serverless. O `listen` nao deve acontecer ao importar o app.

### 3. Rotas e controllers

Estrutura sugerida:

```text
backend/src/
  config/
  controllers/
  middlewares/
  routes/
  services/
  repositories/
  validators/
  errors/
  app.js
  server.js
```

- Controllers traduzem HTTP para chamadas de servico.
- Services concentram regras de negocio.
- Repositories concentram acesso ao banco.
- Validators validam payloads.
- Middlewares cuidam de autenticacao, erros e observabilidade.

### 4. Identidade e autorizacao

O usuario autenticado deve ser obtido do token/sessao validado pelo servidor. Nao aceitar `userId` como fonte de autorizacao no body, query ou URL.

Cada leitura, alteracao e exclusao precisa verificar o dono do registro. Com Supabase, RLS e a ultima barreira; a camada de aplicacao ainda deve evitar chamadas incoerentes.

### 5. Modelos de dados

Nao manter os nomes `IncomeModel` e `SpendModel` atuais sem corrigir a inversao. Os models atuais consultam tabelas opostas ao significado dos endpoints. A camada nova deve usar nomes semanticos consistentes e testes que detectem essa classe de erro.

### 6. Erros e respostas

Definir uma convencao unica para:

- status HTTP;
- mensagem publica;
- codigo de erro;
- detalhes de validacao;
- tratamento de erro inesperado.

Nao retornar objetos de banco completos por padrao.

### 7. Testes

Separar:

- Unidade: controller/service isolado com repositories mockados.
- Integracao: app ou service real contra banco de teste.
- End-to-end: fluxo do navegador, somente se o custo for aceitavel.

O teste atual de banco depende da AWS antiga e deve ser substituido por um teste de integracao reproduzivel.

## Ordem de reestruturacao recomendada

1. Remover ou invalidar configuracoes e credenciais antigas.
2. Fechar o inventario e decidir a arquitetura.
3. Criar o schema Supabase e suas migrations.
4. Criar cliente/configuracao por ambiente.
5. Implementar autenticacao escolhida.
6. Migrar uma vertical completa: categorias, do banco ate a tela.
7. Migrar receitas e despesas.
8. Atualizar dashboard.
9. Remover dependencias e codigo legado sem uso.
10. Executar testes, build e auditoria de variaveis.

## Criterios para remover uma biblioteca

Uma dependencia pode sair somente quando:

- nenhum arquivo a importa;
- o fluxo correspondente foi substituido;
- os testes relevantes passam;
- o lockfile foi atualizado;
- o README e os documentos nao prometem a funcionalidade antiga.

Nao remover `axios`, `js-cookie`, `jsonwebtoken` ou `pg` apenas por preferencia. A remocao deve acompanhar uma migracao funcional verificavel.
