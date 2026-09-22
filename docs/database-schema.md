# Esquema de banco de dados

Este documento separa o esquema inferido do banco legado do esquema recomendado para o Supabase. O esquema recomendado e uma proposta; ainda nao foi aplicado.

## Esquema legado inferido

O backend referencia as seguintes tabelas:

### `usuarios`

| Coluna observada | Uso observado | Problema |
| --- | --- | --- |
| `id` | Identificador usado nos payloads | Deve ser substituido pela identidade de `auth.users` na migracao |
| `nome_completo` | Perfil | Pode permanecer em `profiles` |
| `email` | Login e identificacao por URL | Deve ser gerenciado pelo Supabase Auth |
| `senha` | Login e atualizacao | Armazenada em texto puro; nao migrar como senha |
| `data_nascimento` | Perfil | Pode permanecer em `profiles` |
| `telefone` | Perfil | Pode permanecer em `profiles` |
| `data_criacao` | Criacao | Padronizar como `created_at` |

### `categorias`

| Coluna observada | Tipo esperado | Uso |
| --- | --- | --- |
| `id` | Inteiro | Identificador |
| `nome` | Texto | Nome da categoria |
| `tipo` | Texto | `receita` ou `despesa` |
| `descricao` | Texto | Descricao opcional |
| `cor` | Texto | Cor em formato hexadecimal |
| `usuario_id` | Inteiro | Dono do registro |

### `rendas`

| Coluna observada | Uso esperado |
| --- | --- |
| `id` | Identificador |
| `categoria_id` | Categoria da receita |
| `usuario_id` | Dono do registro |
| `valor` | Valor monetario |
| `fonte_renda` | Origem da receita |
| `data` | Data da receita |
| `descricao` | Texto opcional |
| `forma_pagamento` | Forma de recebimento |

### `gastos`

| Coluna observada | Uso esperado |
| --- | --- |
| `id` | Identificador |
| `nome` | Nome da despesa |
| `categoria_id` | Categoria da despesa |
| `valor` | Valor monetario |
| `data` | Data da despesa |
| `descricao` | Texto opcional |
| `forma_pagamento` | Forma de pagamento |
| `usuario_id` | Dono do registro |

## Esquema alvo recomendado

A recomendacao e usar `auth.users.id` como identidade em todas as tabelas privadas. O frontend nao deve criar ou escolher o `user_id`.

```text
auth.users
    |
    +-- profiles.id
    |
    +-- categories.user_id
    |
    +-- incomes.user_id
    |
    +-- expenses.user_id

categories.id <--- incomes.category_id
categories.id <--- expenses.category_id
```

### `public.profiles`

| Coluna | Tipo sugerido | Regra |
| --- | --- | --- |
| `id` | `uuid` | PK e FK para `auth.users.id` |
| `nome_completo` | `text` | Obrigatorio conforme produto |
| `data_nascimento` | `date` | Opcional |
| `telefone` | `text` | Opcional |
| `created_at` | `timestamptz` | Default `now()` |
| `updated_at` | `timestamptz` | Atualizado por trigger ou aplicacao |

O email deve ser consultado no Supabase Auth. Nao duplicar senha ou manter uma segunda tabela de credenciais.

### `public.categories`

| Coluna | Tipo sugerido | Regra |
| --- | --- | --- |
| `id` | `bigint generated always as identity` | PK |
| `user_id` | `uuid` | FK para `auth.users.id`, not null |
| `name` | `text` | Not null |
| `type` | `text` | `income` ou `expense` |
| `description` | `text` | Opcional |
| `color` | `text` | Hexadecimal validado na aplicacao ou banco |
| `created_at` | `timestamptz` | Default `now()` |
| `updated_at` | `timestamptz` | Default `now()` |

Restricao recomendada:

```sql
check (type in ('income', 'expense'))
```

Unicidade recomendada:

```sql
unique (user_id, name, type)
```

### `public.incomes`

| Coluna | Tipo sugerido | Regra |
| --- | --- | --- |
| `id` | `bigint generated always as identity` | PK |
| `user_id` | `uuid` | FK para `auth.users.id`, not null |
| `category_id` | `bigint` | FK para `categories.id` |
| `amount` | `numeric(12,2)` | Maior que zero |
| `source` | `text` | Fonte da renda |
| `occurred_on` | `date` | Data da receita |
| `description` | `text` | Opcional |
| `payment_method` | `text` | Opcional |
| `created_at` | `timestamptz` | Default `now()` |
| `updated_at` | `timestamptz` | Default `now()` |

Restricao recomendada:

```sql
check (amount > 0)
```

### `public.expenses`

| Coluna | Tipo sugerido | Regra |
| --- | --- | --- |
| `id` | `bigint generated always as identity` | PK |
| `user_id` | `uuid` | FK para `auth.users.id`, not null |
| `category_id` | `bigint` | FK para `categories.id` |
| `amount` | `numeric(12,2)` | Maior que zero |
| `name` | `text` | Nome da despesa |
| `occurred_on` | `date` | Data da despesa |
| `description` | `text` | Opcional |
| `payment_method` | `text` | Opcional |
| `created_at` | `timestamptz` | Default `now()` |
| `updated_at` | `timestamptz` | Default `now()` |

## Relacionamentos e exclusao

- `profiles.id` referencia `auth.users.id`.
- `categories.user_id` referencia `auth.users.id`.
- `incomes.user_id` e `expenses.user_id` referenciam `auth.users.id`.
- `category_id` deve aceitar apenas categoria do mesmo usuario. Isso deve ser garantido por validacao de aplicacao e, se necessario, por funcao ou desenho de constraint adicional.
- Ao excluir uma conta, os dados privados podem usar `on delete cascade`, desde que essa decisao seja confirmada antes da migration.
- Ao excluir uma categoria em uso, a politica deve ser escolhida: impedir exclusao ou usar `on delete restrict`. Nao apagar transacoes silenciosamente.

## Indices recomendados

```sql
create index categories_user_id_idx on public.categories (user_id);
create index incomes_user_date_idx on public.incomes (user_id, occurred_on);
create index expenses_user_date_idx on public.expenses (user_id, occurred_on);
create index incomes_category_idx on public.incomes (category_id);
create index expenses_category_idx on public.expenses (category_id);
```

## RLS recomendado

Todas as tabelas publicas privadas devem ter RLS ativado. A forma basica das politicas e:

```sql
using (user_id = auth.uid())
with check (user_id = auth.uid())
```

Para `profiles`, a comparacao e `id = auth.uid()`.

A politica nao deve confiar em `user_id` recebido pelo frontend. O banco precisa comparar com a identidade da sessao.

## Decisoes ainda abertas

- Usar nomes em portugues legados ou nomes em ingles no schema novo.
- Permitir categorias sem transacoes e categorias compartilhadas.
- Permitir edicao do tipo de categoria depois de haver transacoes.
- Usar exclusao em cascata na conta.
- Manter `payment_method` como texto livre ou criar dominio enumerado.
- Criar visoes ou funcoes para os agregados do dashboard.
- Migrar dados antigos, caso algum backup seja recuperado. Senhas antigas nao devem ser migradas como credenciais.
