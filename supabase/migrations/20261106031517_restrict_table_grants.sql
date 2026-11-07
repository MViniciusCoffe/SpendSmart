-- Privilégios explícitos e mínimos nas tabelas do app, iguais em todos os ambientes.
-- Run after 1790304277043_add-rbac-permissions.sql
--
-- Antes: a migration de RBAC dava GRANT ALL (inclui TRUNCATE, REFERENCES e TRIGGER) a
-- authenticated e service_role, e o anon herdava dos privilégios padrão do schema public. No
-- Supabase CLI local o anon tinha SELECT, INSERT, UPDATE, DELETE e TRUNCATE; na Produção, criada
-- com "Automatically expose new tables" desligado, não tinha DML. Nada vazava, porque o RLS barra o
-- anon (auth.uid() é nulo), mas o RLS era a única barreira e o resultado dependia do ambiente.
--
-- Depois:
--   anon:          nenhum privilégio. Nenhuma página pública consulta essas tabelas; o cadastro
--                  grava o perfil já com a sessão (authenticated) ou pela rota com service_role.
--   authenticated: SELECT, INSERT, UPDATE, DELETE (o que o PostgREST usa), filtrado pelo RLS.
--   service_role:  o mesmo DML, para as rotas de src/app/api/.
-- TRUNCATE nunca foi alcançável pelo PostgREST; sai para não depender disso.

DO $$
BEGIN
    IF to_regclass('auth.users') IS NOT NULL THEN
        REVOKE ALL ON public.profiles, public.categories, public.transactions FROM anon, authenticated, service_role;
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles, public.categories, public.transactions TO authenticated, service_role;

        REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
    END IF;
END $$;
