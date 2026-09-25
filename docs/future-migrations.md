# Migracoes futuras

Propostas de mudanca de schema que **nao foram aplicadas**. Este arquivo e uma especificacao
escrita, nao uma migration executavel: nada aqui roda sozinha.

> **Por que nao criar os arquivos ainda.** `npm run dev` encadeia `migrations:up` de forma
> automatica e esse script le `DATABASE_URL` de `.env.development`, que aponta para o Supabase
> remoto. Um arquivo novo em `supabase/migrations/` seria aplicado no banco real no proximo
> `npm run dev` de quem clonar o repositorio. Ver [environments.md](environments.md#4-o-problema-do-npm-run-dev)
> e issue [#20](https://github.com/MViniciusCoffe/SpendSmart/issues/20).
>
> As migrations ja aplicadas tambem nao devem ser reescritas. `001_create_financial_schema.js` e
> `1790304277043_add-rbac-permissions.js` estao registradas na tabela `pgmigrations`; alterar o
> arquivo faz o estado real do banco divergir do codigo versionado.

---

## Estado atual do schema

| Tabela | Idioma das colunas de dominio | Observacao |
| --- | --- | --- |
| `profiles` | **portugues** — `nome_completo`, `data_nascimento`, `telefone` | Unica tabela assim |
| `categories` | ingles — `name`, `type`, `description`, `color` | |
| `transactions` | ingles — `type`, `amount`, `title`, `occurred_on`, `description`, `payment_method` | |

 alem disso, as tres tabelas divergem em consistencia:

- `categories.name` e `transactions.title` sao obrigatorios; `description`, `color`,
  `payment_method` e `telefone` sao opcionais.
- `profiles` nao tem `user_id`: o proprio `id` e a chave estrangeira.
- Nenhuma tabela tem trigger de `updated_at`.

As colunas de negocio estao documentadas em [database-schema.md](database-schema.md).

---

## Proposta 1 — Padronizar `profiles` para ingles

Rastreabilidade: issue
[#8](https://github.com/MViniciusCoffe/SpendSmart/issues/8) (padronizacao de nomenclatura e colunas).

**Decisao a tomar antes de implementar:** isto quebra a API. `services/profileService.js` le e
escreve os nomes em portugues; apos a migration, toda leitura e escrita passa a usar os nomes em
ingles. Nao ha traducao no service layer para amortecer isso.

| Antes | Depois | Tipo |
| --- | --- | --- |
| `nome_completo` | `full_name` | `text not null` |
| `data_nascimento` | `birth_date` | `date` |
| `telefone` | `phone` | `text` |

### Script

```sql
BEGIN;

ALTER TABLE public.profiles RENAME COLUMN nome_completo TO full_name;
ALTER TABLE public.profiles RENAME COLUMN data_nascimento TO birth_date;
ALTER TABLE public.profiles RENAME COLUMN telefone TO phone;

COMMIT;
```

`profiles` tem no maximo uma linha por conta e o volume e da ordem das dezenas, entao o
`ALTER TABLE ... RENAME COLUMN` nao bloqueia leitura de forma relevante.

### Script reversivel

```sql
BEGIN;

ALTER TABLE public.profiles RENAME COLUMN full_name TO nome_completo;
ALTER TABLE public.profiles RENAME COLUMN birth_date TO data_nascimento;
ALTER TABLE public.profiles RENAME COLUMN phone TO telefone;

COMMIT;
```

### Impacto no codigo

| Arquivo | Mudanca necessaria |
| --- | --- |
| `services/profileService.js` | `select` e `insert`/`update` passam a `full_name`, `birth_date`, `phone` |
| `pages/api/createProfile.js` | o corpo recebido de `register.js` usa os nomes em portugues; precisa de traducao explicita |
| `pages/accountConfig.js` | se o form mantem os nomes em portugues, a traducao fica no service |

### O que verificar depois

- [ ] Login e leitura de perfil com conta existente
- [ ] Edicao de perfil salvando os tres campos
- [ ] Cadastro novo, confirmando que o perfil e criado com os nomes novos
- [ ] RLS de `profiles` continua valendo (o RLS compara `id`, nao as colunas)
- [ ] Delecao de conta remove o perfil

---

## Proposta 2 — Trigger de `updated_at`

Rastreabilidade: risco "updated_at nunca atualizado" em
[Plano de testes](test-plan.md#6-riscos-e-contingencias).

As tres tabelas tem `updated_at` com `default current_timestamp`, mas nenhuma atualiza o valor em
`UPDATE`. Hoje toda a coluna registra apenas o instante da insercao.

### Script

```sql
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = current_timestamp;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

### Script reversivel

```sql
DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS categories_set_updated_at ON public.categories;
DROP TRIGGER IF EXISTS transactions_set_updated_at ON public.transactions;
DROP FUNCTION IF EXISTS public.set_updated_at();
```

### Impacto no codigo

Nenhum. O trigger age no servidor; nenhuma chamada no frontend precisa mudar.

---

## Proposta 3 — Garantir que `transactions.type` bate com `categories.type`

Rastreabilidade: RF12 do plano de testes (IT-07) e o registro em
[Plano de testes](test-plan.md#6-riscos-e-contingencias).

Hoje as duas colunas aceitam `income` ou `expense` de forma independente, e o comentario em
`001_create_financial_schema.js` apenas informa que "a aplicacao deve garantir" a coerencia.
Nenhum codigo faz essa verificacao. O resultado possivel e um lancamento de despesa apontando
para uma categoria de receita, o que corrompe a agregacao do dashboard.

### Opcao A — trigger (recomendada)

Um trigger e preferivel a uma constraint porque uma constraint `CHECK` nao pode consultar outra
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
    RAISE EXCEPTION 'Categoria % nao existe', NEW.category_id
      USING ERRCODE = '23503';
  END IF;

  IF categoria_type <> NEW.type THEN
    RAISE EXCEPTION
      'Tipo do lancamento (%) diverge do tipo da categoria (%)', NEW.type, categoria_type
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transactions_category_type_check
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.check_transaction_category_type();
```

### Script reversivel

```sql
DROP TRIGGER IF EXISTS transactions_category_type_check ON public.transactions;
DROP FUNCTION IF EXISTS public.check_transaction_category_type();
```

### Impacto no codigo

`services/transactionService.js:31` passa a poder receber erro `23514` alem de `23503` e `23505`.
O mapeamento de mensagens em `transactionService.js:48` deve tratar esse codigo, com texto em
portugues voltado ao usuario, no mesmo padrao de `categoryService.js:48,88`.

Antes de aplicar, e preciso verificar se ja existem lancamentos incoerentes no banco:

```sql
SELECT t.id, t.type AS lancamento, c.type AS categoria
FROM public.transactions t
JOIN public.categories c ON c.id = t.category_id
WHERE t.type <> c.type;
```

Se a consulta devolver linhas, a migration falha ate que elas sejam corrigidas.

---

## Ordem sugerida

1. **Proposta 3** primeiro: bloqueia dado corrompido e tem reversivel simples.
2. **Proposta 2**: sem impacto de codigo, resolve dado historico.
3. **Proposta 1** por ultimo: e a unica que quebra a API e exige mudar `profileService.js`,
   `createProfile.js` e `accountConfig.js` juntos.

---

## Como aplicar quando a separacao de ambientes existir

1. Issue aberta com o SQL e o criterio de verificacao.
2. Rodar o script de verificacao de dados incoerentes (Proposta 3).
3. Aplicar em ambiente de teste.
4. Executar o checklist de verificacao da proposta.
5. Aplicar em producao com backup antes.
6. **So entao** mover o arquivo para `supabase/migrations/` com timestamp via
   `node-pg-migrate create`, e ajustar o encadeamento de `npm run dev` para exigir flag.
