-- Tipo e dono da transação garantidos pelo banco (#78, IT-07).
--
-- Antes, a FK transactions_category_fk ligava só category_id -> categories(id). Nada no banco
-- impedia uma despesa numa categoria de receita (o dashboard somaria errado), e como as checagens
-- de FK ignoram o RLS, nem uma transação apontando para a categoria de outro usuário: só o
-- service protegia as duas regras.
--
-- A FK passa a ser composta, (category_id, user_id, type) -> categories(id, user_id, type):
--   - mesmo tipo e mesmo dono da categoria, em toda escrita, por qualquer caminho;
--   - ON UPDATE CASCADE: mudar o tipo da categoria atualiza as transações dela na mesma operação,
--     inclusive as excluídas (soft delete), que também precisam cumprir a regra (CA-008.03);
--   - ON DELETE RESTRICT, como antes (IT-04): o DELETE físico de categoria em uso continua barrado.
--
-- Mesmo nome da FK antiga, para as mensagens de erro e os testes continuarem apontando para ela.
-- Se já existir linha violando a regra, o ADD CONSTRAINT falha e a migration inteira é desfeita:
-- conferir antes com a consulta somente leitura da #78.

-- Alvo da FK composta. O id já é único; a restrição só existe para a FK poder referenciar o trio.
ALTER TABLE public.categories
    ADD CONSTRAINT categories_id_user_type_key UNIQUE (id, user_id, type);

ALTER TABLE public.transactions DROP CONSTRAINT transactions_category_fk;

ALTER TABLE public.transactions
    ADD CONSTRAINT transactions_category_fk
    FOREIGN KEY (category_id, user_id, type)
    REFERENCES public.categories (id, user_id, type)
    ON UPDATE CASCADE
    ON DELETE RESTRICT;
