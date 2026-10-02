# Migrações futuras

Propostas de mudança de schema que **não foram aplicadas**. Este arquivo é uma especificação
escrita, não uma migration executável: nada aqui roda sozinho.

> **Por que não criar os arquivos ainda.** `npm run dev` encadeia `migrations:up` de forma
> automática e esse script lê `DATABASE_URL` de `.env.development`, que aponta para o Supabase
> remoto. Um arquivo novo em `supabase/migrations/` seria aplicado no banco real no próximo
> `npm run dev` de quem clonar o repositório. Ver [environments.md](environments.md#4-o-problema-do-npm-run-dev)
> e issue [#20](https://github.com/MViniciusCoffe/SpendSmart/issues/20).
>
> As migrations já aplicadas também não devem ser reescritas. `001_create_financial_schema.js` e
> `1790304277043_add-rbac-permissions.js` estão registradas na tabela `pgmigrations`; alterar o
> arquivo faz o estado real do banco divergir do código versionado.

---

## Estado atual do schema

| Tabela         | Idioma das colunas de domínio                                                      | Observação         |
| -------------- | ---------------------------------------------------------------------------------- | ------------------ |
| `profiles`     | **português** — `nome_completo`, `data_nascimento`, `telefone`                     | Única tabela assim |
| `categories`   | inglês — `name`, `type`, `description`, `color`                                    |                    |
| `transactions` | inglês — `type`, `amount`, `title`, `occurred_on`, `description`, `payment_method` |                    |

Além disso, as três tabelas divergem em consistência:

- `categories.name` e `transactions.title` são obrigatórios; `description`, `color`,
  `payment_method` e `telefone` são opcionais.
- `profiles` não tem `user_id`: o próprio `id` é a chave estrangeira.
- Nenhuma tabela tem trigger de `updated_at`.

As colunas de negócio estão documentadas em [database-schema.md](database-schema.md).

---

## Proposta 1 — Padronizar `profiles` para inglês

Rastreabilidade: issue
[#8](https://github.com/MViniciusCoffe/SpendSmart/issues/8) (padronização de nomenclatura e colunas).

**Decisão a tomar antes de implementar:** isto quebra a API. `services/profileService.js` lê e
escreve os nomes em português; após a migration, toda leitura e escrita passa a usar os nomes em
inglês. Não há tradução no service layer para amortecer isso.

| Antes             | Depois       | Tipo            |
| ----------------- | ------------ | --------------- |
| `nome_completo`   | `full_name`  | `text not null` |
| `data_nascimento` | `birth_date` | `date`          |
| `telefone`        | `phone`      | `text`          |

### Script

```sql
BEGIN;

ALTER TABLE public.profiles RENAME COLUMN nome_completo TO full_name;
ALTER TABLE public.profiles RENAME COLUMN data_nascimento TO birth_date;
ALTER TABLE public.profiles RENAME COLUMN telefone TO phone;

COMMIT;
```

`profiles` tem no máximo uma linha por conta e o volume é da ordem das dezenas, então o
`ALTER TABLE ... RENAME COLUMN` não bloqueia leitura de forma relevante.

### Script reversível

```sql
BEGIN;

ALTER TABLE public.profiles RENAME COLUMN full_name TO nome_completo;
ALTER TABLE public.profiles RENAME COLUMN birth_date TO data_nascimento;
ALTER TABLE public.profiles RENAME COLUMN phone TO telefone;

COMMIT;
```

### Impacto no código

| Arquivo                      | Mudança necessária                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------ |
| `services/profileService.js` | `select` e `insert`/`update` passam a `full_name`, `birth_date`, `phone`                   |
| `pages/api/createProfile.js` | o corpo recebido de `register.js` usa os nomes em português; precisa de tradução explícita |
| `pages/accountConfig.js`     | se o form mantém os nomes em português, a tradução fica no service                         |

### O que verificar depois

- [ ] Login e leitura de perfil com conta existente
- [ ] Edição de perfil salvando os três campos
- [ ] Cadastro novo, confirmando que o perfil é criado com os nomes novos
- [ ] RLS de `profiles` continua valendo (o RLS compara `id`, não as colunas)
- [ ] Deleção de conta remove o perfil

---

## Proposta 2 — Trigger de `updated_at`

Rastreabilidade: risco "updated_at nunca atualizado" em
[Plano de testes](test-plan.md#6-riscos-e-contingencias).

As três tabelas têm `updated_at` com `default current_timestamp`, mas nenhuma atualiza o valor em
`UPDATE`. Hoje toda a coluna registra apenas o instante da inserção.

### Script

```sql
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS \[ BEGIN   NEW.updated_at = current_timestamp;   RETURN NEW; END; \] LANGUAGE plpgsql;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER categories_set_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER transactions_set_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

### Script reversível

```sql
DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS categories_set_updated_at ON public.categories;
DROP TRIGGER IF EXISTS transactions_set_updated_at ON public.transactions;
DROP FUNCTION IF EXISTS public.set_updated_at();
```

### Impacto no código

Nenhum. O trigger age no servidor; nenhuma chamada no frontend precisa mudar.

---

## Proposta 3 — Garantir que `transactions.type` bate com `categories.type`

Rastreabilidade: RF12 do plano de testes (IT-07) e o registro em
[Plano de testes](test-plan.md#6-riscos-e-contingencias).

Hoje as duas colunas aceitam `income` ou `expense` de forma independente, e o comentário em
`001_create_financial_schema.js` apenas informa que "a aplicação deve garantir" a coerência.
Nenhum código faz essa verificação. O resultado possível é um lançamento de despesa apontando
para uma categoria de receita, o que corrompe a agregação do dashboard.

### Opção A — trigger (recomendada)

Um trigger é preferível a uma constraint porque uma constraint `CHECK` não pode consultar outra
tabela.

```sql
CREATE OR REPLACE FUNCTION public.check_transaction_category_type()
RETURNS TRIGGER AS $$
DECLARE
  categoria_type text;
BEGIN
  SELECT type INTO categoria_type
  FROM public.categories
  WHERE id = NEW.category_id;

  IF categoria_type IS NULL THEN
    RAISE EXCEPTION 'Categoria % não existe', NEW.category_id
      USING ERRCODE = '23503';
  END IF;

  IF categoria_type <> NEW.type THEN
    RAISE EXCEPTION
      'Tipo do lançamento (%) diverge do tipo da categoria (%)', NEW.type, categoria_type
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transactions_category_type_check
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.check_transaction_category_type();
```

### Script reversível

```sql
DROP TRIGGER IF EXISTS transactions_category_type_check ON public.transactions;
DROP FUNCTION IF EXISTS public.check_transaction_category_type();
```

### Impacto no código

`services/transactionService.js:31` passa a poder receber erro `23514` além de `23503` e `23505`.
O mapeamento de mensagens em `transactionService.js:48` deve tratar esse código, com texto em
português voltado ao usuário, no mesmo padrão de `categoryService.js:48,88`.

Antes de aplicar, é preciso verificar se já existem lançamentos incoerentes no banco:

```sql
SELECT t.id, t.type AS lancamento, c.type AS categoria
FROM public.transactions t
JOIN public.categories c ON c.id = t.category_id
WHERE t.type <> c.type;
```

Se a consulta devolver linhas, a migration falha até que elas sejam corrigidas.

---

## Ordem sugerida

1. **Proposta 3** primeiro: bloqueia dado corrompido e tem reversível simples.
2. **Proposta 2**: sem impacto de código, resolve dado histórico.
3. **Proposta 1** por último: é a única que quebra a API e exige mudar `profileService.js`,
   `createProfile.js` e `accountConfig.js` juntos.

---

## Como aplicar quando a separação de ambientes existir

1. Issue aberta com o SQL e o critério de verificação.
2. Rodar o script de verificação de dados incoerentes (Proposta 3).
3. Aplicar em ambiente de teste.
4. Executar o checklist de verificação da proposta.
5. Aplicar em produção com backup antes.
6. **Só então** mover o arquivo para `supabase/migrations/` com timestamp via
   `node-pg-migrate create`, e ajustar o encadeamento de `npm run dev` para exigir flag.
