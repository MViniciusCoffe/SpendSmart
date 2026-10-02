# User Stories

User Stories do SpendSmart derivadas dos requisitos funcionais RF01 a RF16 do
`Documento de Visão` (docs BSI, versão 1.0 de 03/09/2026). Os identificadores `US-0NN` são
estáveis e referenciados pelo [plano de testes](test-plan.md).

Cada User Story declara os critérios de aceitação que a matriz de casos de teste precisa
verificar. O formato é "Como / Quero / Para que", com critérios no formato
"Dado / Quando / Então".

---

## Bloco 1 — Autenticação e conta

### US-001 — Criar conta

> Como visitante, quero criar uma conta com nome, e-mail, senha, data de nascimento e telefone,
> para começar a controlar minhas finanças.

**Derivada de:** RF01
**Tela:** `pages/register.js`
**Service:** `services/authServices.js:4`

| ID        | Critério de aceitação                                                                                       |
| :-------- | :---------------------------------------------------------------------------------------------------------- |
| CA-001.01 | Dado um e-mail ainda não cadastrado, quando submeto o formulário, então a conta é criada e o perfil gravado |
| CA-001.02 | Dado um e-mail já cadastrado, quando submeto, então recebo "E-mail já cadastrado" e nenhuma conta é criada  |
| CA-001.03 | Dado senha com menos de 6 caracteres, quando submeto, então a criação é bloqueada no cliente                |
| CA-001.04 | Dado a criação da conta bem-sucedida, quando a tela carrega, então nenhum erro aparece ao usuário           |

> **Limite conhecido:** se a gravação do perfil falhar, a conta permanece criada no Auth sem
> perfil e sem caminho de recuperação. Ver issue [#25](https://github.com/MViniciusCoffe/SpendSmart/issues/25).

---

### US-002 — Entrar na conta

> Como usuário cadastrado, quero entrar com e-mail e senha, para acessar meus dados.

**Derivada de:** RF02
**Tela:** `pages/login.js`
**Service:** `services/authServices.js:43`

| ID        | Critério de aceitação                                                                                                                         |
| :-------- | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| CA-002.01 | Dado credenciais válidas, quando submeto, então sou redirecionado ao dashboard                                                                |
| CA-002.02 | Dado e-mail inexistente ou senha errada, quando submeto, então recebo "E-mail ou senha incorretos" — a mensagem não revela se o e-mail existe |
| CA-002.03 | Dado um e-mail não confirmado, quando submeto, então recebo orientação para confirmar o e-mail                                                |
| CA-002.04 | Dado muitas tentativas seguidas, quando submeto, então recebo aviso de espera em vez de erro genérico                                         |

---

### US-003 — Ver e editar meu perfil

> Como usuário autenticado, quero ver e alterar meus dados cadastrais, para manter informações
> corretas.

**Derivada de:** RF04
**Tela:** `pages/accountConfig.js`
**Service:** `services/profileService.js:4`

| ID        | Critério de aceitação                                                                    |
| :-------- | :--------------------------------------------------------------------------------------- |
| CA-003.01 | Dado uma sessão válida, quando abro a tela, então meus dados atuais aparecem preenchidos |
| CA-003.02 | Dado dados alterados, quando salvo, então o banco registra a alteração                   |
| CA-003.03 | Dado uma nova senha válida, quando envio, então a senha é alterada no Supabase Auth      |
| CA-003.04 | Dado a senha atual repetida, quando envio, então o usuário é avisado sem chamar a API    |

---

### US-004 — Excluir minha conta

> Como usuário autenticado, quero excluir minha conta, para que meus dados financeiros sejam
> removidos permanentemente.

**Derivada de:** RF05
**Tela:** `pages/accountConfig.js:55`
**Service:** `services/profileService.js:46`
**Rota:** `pages/api/deleteAccount.js`

| ID        | Critério de aceitação                                                                                             |
| :-------- | :---------------------------------------------------------------------------------------------------------------- |
| CA-004.01 | Dado uma sessão válida, quando solicito a exclusão, então recebo confirmação de sucesso                           |
| CA-004.02 | Dado uma sessão válida, quando a exclusão conclui, então perfil, categorias e transações são removidos em cascata |
| CA-004.03 | Dado ausência de token válido, quando chamo a rota, então a operação é rejeitada e o usuário não é excluído       |
| CA-004.04 | Dado a exclusão, quando tento acessar rotas privadas, então sou devolvido ao login                                |

> A rota valida o token com o cliente público e só então age com a chave administrativa.
> Ver `pages/api/deleteAccount.js:19-28`.

---

### US-005 — Acesso restrito às minhas informações

> Como usuário autenticado, quero que ninguém mais veja meus dados, para ter privacidade sobre
> minhas finanças.

**Derivada de:** RF16
**Guarda:** `components/utils/withAuth.js`
**Banco:** políticas RLS em `supabase/migrations/001_create_financial_schema.js:118-120`

| ID        | Critério de aceitação                                                                                                          |
| :-------- | :----------------------------------------------------------------------------------------------------------------------------- |
| CA-005.01 | Dado um visitante sem sessão, quando acesso uma rota privada, então sou redirecionado ao login                                 |
| CA-005.02 | Dado o usuário A autenticado, quando tento ler as categorias do usuário B, então o banco não devolve nenhuma linha             |
| CA-005.03 | Dado o usuário A autenticado, quando tento alterar ou apagar um registro do usuário B, então a operação é rejeitada pelo banco |
| CA-005.04 | Dado uma requisição à rota `/api/deleteAccount` sem token, então recebo 401 e nada acontece                                    |

> **CA-005.02 e CA-005.03 nunca foram exercitadas.** O RLS só é criado quando `auth.users`
> existe, portanto não é aplicado no PostgreSQL local. Ver issue
> [#20](https://github.com/MViniciusCoffe/SpendSmart/issues/20) e o registro de pendência em
> [Plano de testes](test-plan.md#6-riscos-e-contingencias).

---

## Bloco 2 — Categorias

### US-006 — Criar categoria

> Como usuário autenticado, quero criar uma categoria de receita ou despesa, para classificar
> meus lançamentos.

**Derivada de:** RF06
**Tela:** `pages/categoriaPage.js`
**Service:** `services/categoryService.js:26`

| ID        | Critério de aceitação                                                                                                                 |
| :-------- | :------------------------------------------------------------------------------------------------------------------------------------ |
| CA-006.01 | Dado nome, tipo, descrição e cor, quando salvo, então a categoria é criada e aparece na listagem                                      |
| CA-006.02 | Dado nome, tipo e cor ausentes, quando submeto, então o navegador impede o envio                                                      |
| CA-006.03 | Dado uma categoria com o mesmo nome, tipo e usuário, quando tento criar, então recebo "Categoria já existe" (código Postgres `23505`) |

---

### US-007 — Listar categorias

> Como usuário autenticado, quero ver minhas categorias, para escolhê-las nos lançamentos.

**Derivada de:** RF07
**Service:** `services/categoryService.js:6`

| ID        | Critério de aceitação                                                                                      |
| :-------- | :--------------------------------------------------------------------------------------------------------- |
| CA-007.01 | Dado um usuário com categorias, quando abro a tela, então somente as categorias dele aparecem              |
| CA-007.02 | Dado um usuário sem categorias, quando abro a tela, então a interface informa que não há registros         |
| CA-007.03 | Dado as categorias carregadas, quando as exibo, então o tipo aparece traduzido para "receita" ou "despesa" |

> CA-007.02 não é atendido hoje: a tela não tem estado vazio. Registrado em
> [Plano de testes](test-plan.md#6-riscos-e-contingencias).

---

### US-008 — Alterar categoria

> Como usuário autenticado, quero alterar uma categoria existente, para corrigir nome, tipo,
> descrição ou cor.

**Derivada de:** RF08
**Service:** `services/categoryService.js:51`

| ID        | Critério de aceitação                                                                                                  |
| :-------- | :--------------------------------------------------------------------------------------------------------------------- |
| CA-008.01 | Dado uma categoria minha, quando altero os dados, então as mudanças são persistidas                                    |
| CA-008.02 | Dado nome, tipo e cor iguais aos de outra categoria minha, quando salvo, então o banco rejeita por unicidade           |
| CA-008.03 | Dado uma categoria com transações vinculadas, quando tento mudar o tipo, então a aplicação impede ou explica o impacto |

> CA-008.03 não é atendido: hoje é possível trocar o tipo de uma categoria que já tem
> lançamentos, o que deixa o gráfico do dashboard inconsistente. Registrado em
> [Plano de testes](test-plan.md#6-riscos-e-contingencias).

---

### US-009 — Excluir categoria

> Como usuário autenticado, quero excluir uma categoria que não uso, para manter a listagem
> limpa.

**Derivada de:** RF09
**Service:** `services/categoryService.js:67`

| ID        | Critério de aceitação                                                                                                         |
| :-------- | :---------------------------------------------------------------------------------------------------------------------------- |
| CA-009.01 | Dado uma categoria sem transações, quando excluo, então a linha é removida                                                    |
| CA-009.02 | Dado uma categoria com transações, quando tento excluir, então o banco rejeita e o usuário recebe explicação (código `23503`) |
| CA-009.03 | Dado a exibição de uma categoria, quando olho a contagem de uso, então o número corresponde aos lançamentos reais             |

> CA-009.03 não é atendido: a tela exibe "Quantidade de usos: 0" fixo. Registrado em
> [Plano de testes](test-plan.md#6-riscos-e-contingencias).

---

## Bloco 3 — Transações

### US-010 — Registrar receita

> Como usuário autenticado, quero registrar uma receita, para acompanhar o que entrou.

**Derivada de:** RF10
**Tela:** `pages/rendaPage.js`
**Service:** `services/transactionService.js:31`

| ID        | Critério de aceitação                                                                                       |
| :-------- | :---------------------------------------------------------------------------------------------------------- |
| CA-010.01 | Dado categoria, valor, título, data e forma de pagamento, quando salvo, então a receita aparece na listagem |
| CA-010.02 | Dado valor ausente, não numérico ou zero, quando submeto, então o navegador impede o envio                  |
| CA-010.03 | Dado uma receita registrada, quando consulto, então o título e a data aparecem preenchidos no detalhe       |
| CA-010.04 | Dado o valor gravado, quando consulto, então o valor tem duas casas decimais e nunca é negativo             |

> **CA-010.03 não é atendido.** O formulário vincula o campo ao estado `nome`, mas o envio usa
> `fonteRenda`, que não tem input; a receita é gravada com título vazio. Ver issue
> [#10](https://github.com/MViniciusCoffe/SpendSmart/issues/10). CA-010.03 também depende da
> divergência de campos descrita na issue
> [#21](https://github.com/MViniciusCoffe/SpendSmart/issues/21).

---

### US-011 — Listar receitas

> Como usuário autenticado, quero ver minhas receitas, para conferir o que registrei.

**Derivada de:** RF11
**Service:** `services/transactionService.js:6`

| ID        | Critério de aceitação                                                                            |
| :-------- | :----------------------------------------------------------------------------------------------- |
| CA-011.01 | Dado receitas cadastradas, quando abro a tela, então todas aparecem                              |
| CA-011.02 | Dado receitas cadastradas, quando o dashboard carrega, então elas somam para o total de entradas |
| CA-011.03 | Dado receitas de outros usuários, quando consulto, então nenhuma aparece                         |

---

### US-012 — Excluir receita

> Como usuário autenticado, quero excluir uma receita registrada por engano.

**Derivada de:** RF12
**Service:** `services/transactionService.js:92`

| ID        | Critério de aceitação                                                            |
| :-------- | :------------------------------------------------------------------------------- |
| CA-012.01 | Dado uma receita minha, quando excluo, então a linha é removida                  |
| CA-012.02 | Dado a exclusão, quando o dashboard recalcula, então o total de entradas diminui |

---

### US-013 — Registrar despesa

> Como usuário autenticado, quero registrar uma despesa, para acompanhar o que saiu.

**Derivada de:** RF13
**Tela:** `pages/gastosPage.js`
**Service:** `services/transactionService.js:31`

| ID        | Critério de aceitação                                                                                        |
| :-------- | :----------------------------------------------------------------------------------------------------------- |
| CA-013.01 | Dado categoria, valor, título, data e forma de pagamento, quando salvo, então a despesa aparece na listagem  |
| CA-013.02 | Dado valor ausente, não numérico ou negativo, quando submeto, então o navegador impede o envio               |
| CA-013.03 | Dado uma despesa registrada, quando consulto o detalhe, então data e forma de pagamento aparecem preenchidas |
| CA-013.04 | Dado o valor gravado, quando consulto, então o valor tem duas casas decimais                                 |

> **CA-013.03 não é atendido.** A tela lê `data` e `forma_pagamento`, mas o service devolve
> `data_ocorrencia` e `metodo_pagamento`. Ver issue
> [#21](https://github.com/MViniciusCoffe/SpendSmart/issues/21).

---

### US-014 — Listar despesas

> Como usuário autenticado, quero ver minhas despesas, para conferir o que registrei.

**Derivada de:** RF14
**Service:** `services/transactionService.js:6`

| ID        | Critério de aceitação                                                                                         |
| :-------- | :------------------------------------------------------------------------------------------------------------ |
| CA-014.01 | Dado despesas cadastradas, quando abro a tela, então todas aparecem                                           |
| CA-014.02 | Dado despesas cadastradas, quando o dashboard carrega, então elas somam para o total de saídas e para o saldo |
| CA-014.03 | Dado despesas de outros usuários, quando consulto, então nenhuma aparece                                      |

---

### US-015 — Excluir despesa

> Como usuário autenticado, quero excluir uma despesa registrada por engano.

**Derivada de:** RF15
**Service:** `services/transactionService.js:92`

| ID        | Critério de aceitação                                                |
| :-------- | :------------------------------------------------------------------- |
| CA-015.01 | Dado uma despesa minha, quando excluo, então a linha é removida      |
| CA-015.02 | Dado a exclusão, quando o dashboard recalcula, então o saldo aumenta |

---

## Bloco 4 — Visualização

### US-016 — Consultar o dashboard

> Como usuário autenticado, quero ver um resumo das minhas finanças, para avaliar minha situação
> sem percorrer cada lançamento.

**Derivada de:** RF10 a RF15 agregadas (não há RF próprio no Documento de Visão)
**Tela:** `pages/dashboard.js`

| ID        | Critério de aceitação                                                                                                              |
| :-------- | :--------------------------------------------------------------------------------------------------------------------------------- |
| CA-016.01 | Dado receitas e despesas, quando o dashboard carrega, então saldo, total de entradas e total de saídas aparecem formatados em real |
| CA-016.02 | Dado lançamentos agrupados por categoria, quando o dashboard carrega, então os gráficos por categoria refletem os valores reais    |
| CA-016.03 | Dado um usuário sem lançamentos, quando o dashboard carrega, então a tela não exibe NaN nem quebra                                 |
| CA-016.04 | Dado falha ao buscar dados, quando o dashboard carrega, então o usuário vê uma mensagem de erro e não uma tela vazia               |

> CA-016.04 é apenas parcialmente atendido: é o único ponto do projeto que exibe erro ao
> usuário. As demais telas registram a falha apenas no console.

---

## Rastreabilidade

| Requisito | User Story                                                                                    |
| :-------- | :-------------------------------------------------------------------------------------------- |
| RF01      | US-001                                                                                        |
| RF02      | US-002                                                                                        |
| RF03      | Coberto por US-003 — a listagem de usuários não existe no produto; há apenas o próprio perfil |
| RF04      | US-003                                                                                        |
| RF05      | US-004                                                                                        |
| RF06      | US-006                                                                                        |
| RF07      | US-007                                                                                        |
| RF08      | US-008                                                                                        |
| RF09      | US-009                                                                                        |
| RF10      | US-010                                                                                        |
| RF11      | US-011                                                                                        |
| RF12      | US-012                                                                                        |
| RF13      | US-013                                                                                        |
| RF14      | US-014                                                                                        |
| RF15      | US-015                                                                                        |
| RF16      | US-005                                                                                        |

RF03 ("consultar os usuários cadastrados") foi o único requisito sem correspondência direta:
ele pressupõe que um usuário autenticado possa listar outros usuários, o que seria uma falha de
segurança no produto. A interpretação adotada foi restrita ao próprio perfil, registrada em
US-003.
