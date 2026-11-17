-- Perfil criado pelo banco e exclusão de conta pela própria sessão (#75).
--
-- Antes, as duas operações passavam por rotas de src/app/api/ com a SUPABASE_SERVICE_ROLE_KEY:
-- /api/createProfile inseria o perfil depois do signUp (e apagava o usuário do Auth se o insert
-- falhasse, #25) e /api/deleteAccount chamava auth.admin.deleteUser. Com as funções abaixo a chave
-- sai da aplicação.
--
-- As duas funções são SECURITY DEFINER: rodam com o dono (postgres), que pode escrever em
-- public.profiles sem passar pelo RLS e apagar de auth.users. Por isso search_path vazio e nomes
-- totalmente qualificados, para ninguém trocar uma tabela ou função por outra de mesmo nome.
--
-- Corpo em plpgsql (e não sql) porque o plpgsql só resolve nomes ao executar: no Postgres puro do
-- infra/compose.yaml não existe auth.users nem auth.uid(), e uma função sql falharia já no CREATE.

-- 1. Perfil criado na mesma transação do insert em auth.users. Se o insert do perfil falhar, o
--    cadastro inteiro falha: não existe mais conta no Auth sem perfil, nem rollback (#25).
--    O nome é obrigatório (decisão de 2026-11-17): conta criada sem full_name nos metadados (Studio,
--    API admin) é recusada, para toda conta ter perfil. Data de nascimento e telefone são opcionais.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  nome text := nullif(btrim(NEW.raw_user_meta_data ->> 'full_name'), '');
BEGIN
  IF nome IS NULL THEN
    RAISE EXCEPTION 'full_name é obrigatório nos metadados do usuário'
      USING ERRCODE = '23502';
  END IF;

  INSERT INTO public.profiles (id, full_name, birth_date, phone)
  VALUES (
    NEW.id,
    nome,
    nullif(NEW.raw_user_meta_data ->> 'birth_date', '')::date,
    nullif(btrim(NEW.raw_user_meta_data ->> 'phone'), '')
  );

  RETURN NEW;
END;
$$;

-- 2. Exclusão da própria conta. Apaga só a linha de auth.uid(); as FKs ON DELETE CASCADE levam
--    perfil, categorias e transações. Sem sessão, auth.uid() é null e nada é apagado.
CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'sessão obrigatória' USING ERRCODE = '42501';
  END IF;

  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

-- 3. Trigger e permissões só existem no Supabase. Funções nascem com EXECUTE para PUBLIC: a de
--    trigger não é chamável por ninguém, e a de exclusão só por quem está logado.
--
--    O perfil agora nasce do trigger e morre pela cascata da exclusão de conta, então o usuário
--    logado não precisa mais de INSERT nem DELETE em profiles. O UPDATE fica só nas colunas que a
--    tela de configurações edita: com UPDATE em deleted_at o usuário poderia "excluir" o próprio
--    perfil e ficar com conta sem perfil, o que o trigger existe para impedir. O updated_at continua
--    vindo do trigger update_profiles_updated_at (privilégio de coluna não vale para trigger).
DO $$
BEGIN
    IF to_regclass('auth.users') IS NOT NULL THEN
        REVOKE INSERT, DELETE, UPDATE ON public.profiles FROM authenticated;
        GRANT UPDATE (full_name, birth_date, phone) ON public.profiles TO authenticated;

        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_new_user();

        REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
        REVOKE ALL ON FUNCTION public.delete_own_account() FROM PUBLIC, anon;
        GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;
    END IF;
END $$;
