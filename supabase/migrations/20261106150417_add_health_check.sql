-- Checagem do banco para o /api/status sem a chave de serviço.
--
-- Antes, o /api/status lia public.profiles com o cliente admin (service_role, ignora RLS) numa rota
-- pública, sem login. Desde 20261106031517_restrict_table_grants.sql o anon não lê as tabelas, então
-- a checagem com a chave pública precisa de uma função com permissão própria.
--
-- A função não lê nenhuma linha: confirma pelo catálogo que o schema existe. Isso prova a ida e volta
-- PostgREST -> Postgres e que as migrations foram aplicadas. Por isso roda como SECURITY INVOKER
-- (o padrão): não precisa de privilégio em tabela nenhuma, e não há o que vazar.
CREATE OR REPLACE FUNCTION public.health_check()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT to_regclass('public.profiles') IS NOT NULL
     AND to_regclass('public.categories') IS NOT NULL
     AND to_regclass('public.transactions') IS NOT NULL
$$;

-- Funções nascem com EXECUTE para PUBLIC; deixa explícito quem pode chamar. Os papéis só existem no
-- Supabase, daí a guarda.
DO $$
BEGIN
    IF to_regclass('auth.users') IS NOT NULL THEN
        REVOKE ALL ON FUNCTION public.health_check() FROM PUBLIC;
        GRANT EXECUTE ON FUNCTION public.health_check() TO anon, authenticated, service_role;
    END IF;
END $$;
