# User Stories

User Stories do SpendSmart derivadas dos requisitos funcionais RF01 a RF16 do
`Documento de Visao` (docs BSI, versao 1.0 de 03/09/2026). Os identificadores `US-0NN` sao
estaveis e referenciados por [plano de testes](test-plan.md).

Cada User Story declara os criterios de aceitacao que a matriz de casos de teste precisa
verificar. O formato e "Como / Quero / Para que", com criterios no formato
"Dado / Quando / Entao".

---

## Bloco 1 — Autenticacao e conta

### US-001 — Criar conta

> Como visitante, quero criar uma conta com nome, e-mail, senha, data de nascimento e telefone,
> para comecar a controlar minhas financas.

**Derivada de:** RF01
**Tela:** `pages/register.js`
**Service:** `services/authServices.js:4`

| ID | Criterio de aceitacao |
| --- | --- |
| CA-001.01 | Dado um e-mail ainda nao cadastrado, quando submeto o formulario, entao a conta e criada e o perfil gravado |
| CA-001.02 | Dado um e-mail ja cadastrado, quando submeto, entao recebo "E-mail ja cadastrado" e nenhuma conta e criada |
| CA-001.03 | Dado senha com menos de 6 caracteres, quando submeto, ento a criacao e bloqueada no cliente |
| CA-001.04 | Dado a criacao da conta bem-sucedida, quando a tela carrega, entao nenhum erro aparece ao usuario |

> **Limite conhecido:** se a gravacao do perfil falhar, a conta permanece criada no Auth sem
> perfil e sem caminho de recuperacao. Ver issue [#25](https://github.com/MViniciusCoffe/SpendSmart/issues/25).

---

### US-002 — Entrar na conta

> Como usuario cadastrado, quero entrar com e-mail e senha, para acessar meus dados.

**Derivada de:** RF02
**Tela:** `pages/login.js`
**Service:** `services/authServices.js:43`

| ID | Criterio de aceitacao |
| --- | --- |
| CA-002.01 | Dado credenciais validas, quando submeto, entao sou redirecionado ao dashboard |
| CA-002.02 | Dado e-mail inexistente ou senha errada, quando submeto, entao recebo "E-mail ou senha incorretos" — a mensagem nao revela se o e-mail existe |
| CA-002.03 | Dado um e-mail nao confirmado, quando submeto, entao recebo orientacao para confirmar o e-mail |
| CA-002.04 | Dado muitas tentativas seguidas, quando submeto, entao recebo aviso de espera em vez de erro generico |

---

### US-003 — Ver e editar meu perfil

> Como usuario autenticado, quero ver e alterar meus dados cadastrais, para manter informacoes
> corretas.

**Derivada de:** RF04
**Tela:** `pages/accountConfig.js`
**Service:** `services/profileService.js:4`

| ID | Criterio de aceitacao |
| --- | --- |
| CA-003.01 | Dado uma sessao valida, quando abro a tela, entao meus dados atuais aparecem preenchidos |
| CA-003.02 | Dado dados alterados, quando salvo, entao o banco registra a alteracao |
| CA-003.03 | Dado uma nova senha valida, quando envio, entao a senha e alterada no Supabase Auth |
| CA-003.04 | Dado a senha atual repetida, quando envio, entao o usuario e avisado sem chamar a API |

---

### US-004 — Excluir minha conta

> Como usuario autenticado, quero excluir minha conta, para que meus dados financeiros sejam
> removidos permanentemente.

**Derivada de:** RF05
**Tela:** `pages/accountConfig.js:55`
**Service:** `services/profileService.js:46`
**Rota:** `pages/api/deleteAccount.js`

| ID | Criterio de aceitacao |
| --- | --- |
| CA-004.01 | Dado uma sessao valida, quando solicito a exclusao, entao recebo confirmacao de sucesso |
| CA-004.02 | Dado uma sessao valida, quando a exclusao conclui, entao perfil, categorias e transacoes sao removidos em cascata |
| CA-004.03 | Dado ausencia de token valido, quando chamo a rota, entao a operacao e rejeitada e o usuario nao e excluido |
| CA-004.04 | Dado a exclusao, quando tento acessar rotas privadas, entao sou devolvido ao login |

> A rota valida o token com o cliente publico e so entao age com a chave administrativa.
> Ver `pages/api/deleteAccount.js:19-28`.

---

### US-005 — Acesso restrito as minhas informacoes

> Como usuario autenticado, quero que ninguem mais veja meus dados, para ter privacidade sobre
> minhas financas.

**Derivada de:** RF16
**Guarda:** `components/utils/withAuth.js`
**Banco:** politicas RLS em `supabase/migrations/001_create_financial_schema.js:118-120`

| ID | Criterio de aceitacao |
| --- | --- |
| CA-005.01 | Dado um visitante sem sessao, quando acesso uma rota privada, entao sou redirecionado ao login |
| CA-005.02 | Dado o usuario A autenticado, quando tento ler as categorias do usuario B, entao o banco nao devolve nenhuma linha |
| CA-005.03 | Dado o usuario A autenticado, quando tento alterar ou apagar um registro do usuario B, entao a operacao e rejeitada pelo banco |
| CA-005.04 | Dado uma requisicao a rota `/api/deleteAccount` sem token, entao recebo 401 e nada acontece |

> **CA-005.02 e CA-005.03 nunca foram exercitadas.** O RLS so e criado quando `auth.users`
> existe, portanto nao e aplicado no PostgreSQL local. Ver issue
> [#20](https://github.com/MViniciusCoffe/SpendSmart/issues/20) e o registro de pendencia em
> [Plano de testes](test-plan.md#6-riscos-e-contingencias).

---

## Bloco 2 — Categorias

### US-006 — Criar categoria

> Como usuario autenticado, quero criar uma categoria de receita ou despesa, para classificar
> meus lancamentos.

**Derivada de:** RF06
**Tela:** `pages/categoriaPage.js`
**Service:** `services/categoryService.js:26`

| ID | Criterio de aceitacao |
| --- | --- |
| CA-006.01 | Dado nome, tipo, descricao e cor, quando salvo, entao a categoria e criada e aparece na listagem |
| CA-006.02 | Dado nome, tipo e cor ausentes, quando submeto, entao o navegador impede o envio |
| CA-006.03 | Dado uma categoria com o mesmo nome, tipo e usuario, quando tento criar, entao recebo "Categoria ja existe" (codigo Postgres `23505`) |

---

### US-007 — Listar categorias

> Como usuario autenticado, quero ver minhas categorias, para escolhe-las ao lancamentos.

**Derivada de:** RF07
**Service:** `services/categoryService.js:6`

| ID | Criterio de aceitacao |
| --- | --- |
| CA-007.01 | Dado um usuario com categorias, quando abro a tela, entao somente as categorias dele aparecem |
| CA-007.02 | Dado um usuario sem categorias, quando abro a tela, entao a interface informa que nao ha registros |
| CA-007.03 | Dado as categorias carregadas, quando as exibo, entao o tipo aparece traduzido para "receita" ou "despesa" |

> CA-007.02 nao e atendido hoje: a tela nao tem estado vazio. Registrado em
> [Plano de testes](test-plan.md#6-riscos-e-contingencias).

---

### US-008 — Alterar categoria

> Como usuario autenticado, quero alterar uma categoria existente, para corrigir nome, tipo,
> descricao ou cor.

**Derivada de:** RF08
**Service:** `services/categoryService.js:51`

| ID | Criterio de aceitacao |
| --- | --- |
| CA-008.01 | Dado uma categoria minha, quando altero os dados, entao as mudancas sao persistidas |
| CA-008.02 | Dado nome, tipo e cor iguais aos de outra categoria minha, quando salvo, entao o banco rejeita por unicidade |
| CA-008.03 | Dado uma categoria com transacoes vinculadas, quando tento mudar o tipo, entao a aplicacao impede ou explica o impacto |

> CA-008.03 nao e atendido: hoje e possivel trocar o tipo de uma categoria que ja tem
> lancamentos, o que deixa o grafico do dashboard inconsistente. Registrado em
> [Plano de testes](test-plan.md#6-riscos-e-contingencias).

---

### US-009 — Excluir categoria

> Como usuario autenticado, quero excluir uma categoria que nao uso, para manter a listagem
> limpa.

**Derivada de:** RF09
**Service:** `services/categoryService.js:67`

| ID | Criterio de aceitacao |
| --- | --- |
| CA-009.01 | Dado uma categoria sem transacoes, quando excluo, entao a linha e removida |
| CA-009.02 | Dado uma categoria com transacoes, quando tento excluir, entao o banco rejeita e o usuario recebe explicacao (codigo `23503`) |
| CA-009.03 | Dado a exibicao de uma categoria, quando olho a contagem de uso, entao o numero corresponde aos lancamentos reais |

> CA-009.03 nao e atendido: a tela exibe "Quantidade de usos: 0" fixo. Registrado em
> [Plano de testes](test-plan.md#6-riscos-e-contingencias).

---

## Bloco 3 — Transacoes

### US-010 — Registrar receita

> Como usuario autenticado, quero registrar uma receita, para acompanhar o que entrou.

**Derivada de:** RF10
**Tela:** `pages/rendaPage.js`
**Service:** `services/transactionService.js:31`

| ID | Criterio de aceitacao |
| --- | --- |
| CA-010.01 | Dado categoria, valor, titulo, data e forma de pagamento, quando salvo, entao a receita aparece na listagem |
| CA-010.02 | Dado valor ausente, nao numerico ou zero, quando submeto, entao o navegador impede o envio |
| CA-010.03 | Dado uma receita registrada, quando consulto, entao o titulo e a data aparecem preenchidos no detalhe |
| CA-010.04 | Dado o valor gravado, quando consulto, entao o valor tem duas casas decimais e nunca negativo |

> **CA-010.03 nao e atendido.** O formulario vincula o campo ao estado `nome`, mas o envio usa
> `fonteRenda`, que nao tem input; a receita e gravada com titulo vazio. Ver issue
> [#10](https://github.com/MViniciusCoffe/SpendSmart/issues/10). CA-010.03 tambem depende da
> divergencia de campos descrita na issue
> [#21](https://github.com/MViniciusCoffe/SpendSmart/issues/21).

---

### US-011 — Listar receitas

> Como usuario autenticado, quero ver minhas receitas, para conferir o que registrei.

**Derivada de:** RF11
**Service:** `services/transactionService.js:6`

| ID | Criterio de aceitacao |
| --- | --- |
| CA-011.01 | Dado receitas cadastradas, quando abro a tela, entao todas aparecem |
| CA-011.02 | Dado receitas cadastradas, quando o dashboard carrega, entao elas somam para o total de entradas |
| CA-011.03 | Dado receitas de outros usuarios, quando consulto, entao nenhuma aparece |

---

### US-012 — Excluir receita

> Como usuario autenticado, quero excluir uma receita registrada por engano.

**Derivada de:** RF12
**Service:** `services/transactionService.js:92`

| ID | Criterio de aceitacao |
| --- | --- |
| CA-012.01 | Dado uma receita minha, quando excluo, entao a linha e removida |
| CA-012.02 | Dado a exclusao, quando o dashboard recalcula, entao o total de entradas diminui |

---

### US-013 — Registrar despesa

> Como usuario autenticado, quero registrar uma despesa, para acompanhar o que saiu.

**Derivada de:** RF13
**Tela:** `pages/gastosPage.js`
**Service:** `services/transactionService.js:31`

| ID | Criterio de aceitacao |
| --- | --- |
| CA-013.01 | Dado categoria, valor, titulo, data e forma de pagamento, quando salvo, entao a despesa aparece na listagem |
| CA-013.02 | Dado valor ausente, nao numerico ou negativo, quando submeto, entao o navegador impede o envio |
| CA-013.03 | Dado uma despesa registrada, quando consulto o detalhe, entao data e forma de pagamento aparecem preenchidas |
| CA-013.04 | Dado o valor gravado, quando consulto, entao o valor tem duas casas decimais |

> **CA-013.03 nao e atendido.** A tela le `data` e `forma_pagamento`, mas o service devolve
> `data_ocorrencia` e `metodo_pagamento`. Ver issue
> [#21](https://github.com/MViniciusCoffe/SpendSmart/issues/21).

---

### US-014 — Listar despesas

> Como usuario autenticado, quero ver minhas despesas, para conferir o que registrei.

**Derivada de:** RF14
**Service:** `services/transactionService.js:6`

| ID | Criterio de aceitacao |
| --- | --- |
| CA-014.01 | Dado despesas cadastradas, quando abro a tela, entao todas aparecem |
| CA-014.02 | Dado despesas cadastradas, quando o dashboard carrega, entao elas somam para o total de saidas e para o saldo |
| CA-014.03 | Dado despesas de outros usuarios, quando consulto, entao nenhuma aparece |

---

### US-015 — Excluir despesa

> Como usuario autenticado, quero excluir uma despesa registrada por engano.

**Derivada de:** RF15
**Service:** `services/transactionService.js:92`

| ID | Criterio de aceitacao |
| --- | --- |
| CA-015.01 | Dado uma despesa minha, quando excluo, entao a linha e removida |
| CA-015.02 | Dado a exclusao, quando o dashboard recalcula, entao o saldo aumenta |

---

## Bloco 4 — Visualizacao

### US-016 — Consultar o dashboard

> Como usuario autenticado, quero ver um resumo das minhas financas, para avaliar minha situacao
> sem percorrer cada lancamento.

**Derivada de:** RF10 a RF15 agregadas (nao ha RF proprio no Documento de Visao)
**Tela:** `pages/dashboard.js`

| ID | Criterio de aceitacao |
| --- | --- |
| CA-016.01 | Dado receitas e despesas, quando o dashboard carrega, entao saldo, total de entradas e total de saidas aparecem formatados em real |
| CA-016.02 | Dado lancamentos agrupados por categoria, quando o dashboard carrega, entao os graficos por categoria refletem os valores reais |
| CA-016.03 | Dado um usuario sem lancamentos, quando o dashboard carrega, entao a tela nao exibe NaN nem quebra |
| CA-016.04 | Dado falha ao buscar dados, quando o dashboard carrega, entao o usuario ve uma mensagem de erro e nao uma tela vazia |

> CA-016.04 e apenas parcialmente atendido: e o unico ponto do projeto que exibe erro ao
> usuario. As demais telas registram a falha apenas no console.

---

## Rastreabilidade

| Requisito | User Story |
| --- | --- |
| RF01 | US-001 |
| RF02 | US-002 |
| RF03 | Coberto por US-003 — a listagem de usuarios nao existe no produto; ha apenas o proprio perfil |
| RF04 | US-003 |
| RF05 | US-004 |
| RF06 | US-006 |
| RF07 | US-007 |
| RF08 | US-008 |
| RF09 | US-009 |
| RF10 | US-010 |
| RF11 | US-011 |
| RF12 | US-012 |
| RF13 | US-013 |
| RF14 | US-014 |
| RF15 | US-015 |
| RF16 | US-005 |

RF03 ("consultar os usuarios cadastrados") foi o unico requisito sem correspondencia direta:
ele pressupoe que um usuario autenticado possa listar outros usuarios, o que seria uma falha de
seguranca no produto. A interpretacao adotada foi restricted ao proprio perfil, registrada em
US-003.
