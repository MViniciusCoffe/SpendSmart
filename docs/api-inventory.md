# Inventario da API legada

Este documento registra o comportamento observado no backend Express integrado ao repositorio em 2026-09-22. Ele descreve o contrato atual, inclusive problemas conhecidos. Nao deve ser tratado como contrato da arquitetura nova.

## Aplicacoes e responsabilidades

- Frontend: Next.js com Pages Router, em `pages/`.
- Backend legado: Express CommonJS, em `backend/`.
- Banco legado: PostgreSQL remoto configurado no codigo do backend.
- Autenticacao legada: JWT proprio e senha armazenada no banco.

## Autenticacao atual

### `POST /auth`

Autenticacao publica.

Request observado:

```json
{
  "email": "usuario@example.com",
  "senha": "senha"
}
```

Resposta de sucesso observada:

```json
{
  "message": "Login feito com sucesso",
  "token": "<jwt>",
  "user": "<objeto completo retornado pelo banco>"
}
```

Problemas do contrato atual:

- A senha e comparada diretamente no SQL.
- O objeto completo do usuario pode incluir a senha.
- O segredo JWT esta hardcoded no backend.
- O token contem `id` e `email`, mas o middleware nao salva o usuario em `req.user`.
- O frontend grava token e usuario em cookies acessiveis por JavaScript.

## Usuarios

### `POST /user`

Request enviado pelo frontend:

```json
{
  "nomeCompleto": "Nome do usuario",
  "email": "usuario@example.com",
  "senha": "senha",
  "dataNascimento": "2000-01-01",
  "telefone": "000000000"
}
```

Respostas observadas:

- `200`: `{ "message": "Usuário Criado" }`
- `400`: `{ "message": "Usuário já existe" }`

### `GET /user`

Autenticada no roteamento, mas retorna todos os usuarios e nao restringe o resultado ao usuario autenticado.

### `PUT /user/:email`

Request enviado pelo frontend:

```json
{
  "nome_completo": "Novo nome ou null",
  "senha": "Nova senha ou null",
  "data_nascimento": "2000-01-01 ou null",
  "telefone": "Novo telefone ou null"
}
```

- A identificacao usa email na URL.
- O controller nao confere se o email pertence ao usuario autenticado.
- A senha continua sendo salva sem hash.
- A resposta inclui `updatedUser`, que pode conter campos sensiveis.

### `DELETE /user/:email`

- A identificacao usa email na URL.
- O controller busca e remove sem comparar o usuario com a identidade do token.
- `200`: `{ "message": "Usuário removido" }`
- `404`: `{ "message": "Usuário não encontrado" }`

## Categorias

### `GET /category`

Retorna todas as categorias. O frontend filtra por `usuario_id`, mas o backend nao aplica esse isolamento.

### `POST /category`

Request enviado pelo frontend:

```json
{
  "nome": "salario",
  "tipo": "receita",
  "descricao": "Opcional",
  "cor": "#000000",
  "userId": 1
}
```

Tipos aceitos pelo controller:

- `receita`
- `despesa`

Respostas observadas:

- `200`: `{ "message": "Categoria Criada" }`
- `400`: `{ "message": "Categoria já existe" }`
- Para tipo invalido, o controller retorna `200` com `{ "message": "Tipo de Categoria inválido" }`, o que deve ser corrigido.

### `PUT /category/:id`

Request enviado pelo frontend:

```json
{
  "editNome": "novo nome",
  "editTipo": "receita",
  "editDescricao": "Opcional",
  "editCor": "#000000",
  "userId": 1
}
```

- O backend nao confirma que a categoria pertence ao usuario informado.
- A busca de duplicidade usa `userId` recebido do cliente.
- A resposta de sucesso inclui `category`.

### `DELETE /category/:id`

- Busca e exclui somente pelo id.
- Nao restringe por usuario autenticado.
- `404`: `{ "message": "Categoria não encontrada" }`
- `200`: `{ "message": "Categoria Excluída" }`

## Receitas e despesas

O frontend chama `/income` para receitas e `/spend` para despesas. Os models legados estao invertidos:

- `IncomeModel` consulta a tabela `gastos` e recebe campos de despesa.
- `SpendModel` consulta a tabela `rendas` e recebe campos de receita.
- Como os controllers chamam esses models por nome semântico, o comportamento atual fica inconsistente.

### `POST /income`

Payload esperado pelo controller:

```json
{
  "categorySelected": 1,
  "userId": 1,
  "valor": "100.00",
  "fonteRenda": "Salario",
  "data": "2026-09-22",
  "descricao": "Opcional",
  "formaPagamento": "Pix"
}
```

O controller chama `IncomeModel.save`, que grava na tabela `gastos` com parametros incompatíveis com o significado de receita.

### `GET /income`

O controller chama `IncomeModel.show`, que atualmente consulta `gastos`.

### `DELETE /income/:id`

O controller chama `IncomeModel.find/delete`, que atualmente opera sobre `gastos`.

### `POST /spend`

Payload esperado pelo controller:

```json
{
  "nome": "Aluguel",
  "categorySelected": 2,
  "valor": "500.00",
  "data": "2026-09-22",
  "descricao": "Opcional",
  "formaPagamento": "Pix",
  "userId": 1
}
```

O controller chama `SpendModel.save`, que atualmente grava na tabela `rendas` com parametros incompatíveis com o significado de despesa.

### `GET /spend`

O controller chama `SpendModel.show`, que atualmente consulta `rendas`.

### `DELETE /spend/:id`

O controller chama `SpendModel.find/delete`, que atualmente opera sobre `rendas`.

## Chamadas do frontend

| Tela | Operacao | Rota |
| --- | --- | --- |
| Login | POST | `/auth` |
| Cadastro | POST | `/user` |
| Cadastro | POST | `/auth` apos criar usuario |
| Conta | PUT | `/user/:email` |
| Conta | DELETE | `/user/:email` |
| Dashboard | GET | `/income`, `/spend`, `/category` |
| Categorias | GET, POST, PUT, DELETE | `/category` |
| Receitas | GET, POST, DELETE | `/income` |
| Despesas | GET, POST, DELETE | `/spend` |

Todas as chamadas usam a URL antiga hardcoded no frontend e enviam `Authorization: Bearer <token>` nas rotas protegidas.

## Incompatibilidades e riscos prioritarios

1. Isolamento por usuario depende de filtros no frontend.
2. O cliente envia `userId`; a identidade deve vir da sessao autenticada.
3. Models de receita e despesa estao trocados.
4. Existe connection string AWS hardcoded no backend.
5. Existe segredo JWT hardcoded no backend.
6. Senhas sao armazenadas em texto puro.
7. Respostas podem expor senha e dados de outros usuarios.
8. Nao existe validacao de payload consistente.
9. Erros de controller nao possuem tratamento global padronizado.
10. `client.release` do login nao e chamado, pois falta `()`.
11. A conexao do banco usa SSL permissivo (`rejectUnauthorized: false`).
12. CORS aceita configuracao ampla e nao esta restrito ao frontend.

## Contrato alvo recomendado

A nova camada deve:

- usar Supabase Auth como identidade;
- derivar `user_id` da sessao, nunca do corpo da requisicao;
- aplicar RLS no banco;
- validar entradas antes da persistencia;
- retornar somente campos publicos;
- usar nomes consistentes: `categories`, `incomes`, `expenses` ou uma convencao equivalente;
- centralizar erros e estados de carregamento no frontend;
- remover a dependencia da API AWS antiga.
