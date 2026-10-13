-- RBAC permissions for Supabase
-- Run after create_financial_schema

DO $$
BEGIN
    IF to_regclass('auth.users') IS NOT NULL THEN
        -- Permissoes RBAC para as operacoes Serverless e Frontend funcionarem no Supabase
        GRANT ALL ON public.profiles TO service_role;
        GRANT ALL ON public.categories TO service_role;
        GRANT ALL ON public.transactions TO service_role;

        GRANT ALL ON public.profiles TO authenticated;
        GRANT ALL ON public.categories TO authenticated;
        GRANT ALL ON public.transactions TO authenticated;

        GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
        GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
    END IF;
END $$;