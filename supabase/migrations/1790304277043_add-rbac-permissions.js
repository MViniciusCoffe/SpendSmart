exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
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
    END
    $$;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DO $$
    BEGIN
      IF to_regclass('auth.users') IS NOT NULL THEN
        REVOKE ALL ON public.profiles FROM service_role;
        REVOKE ALL ON public.categories FROM service_role;
        REVOKE ALL ON public.transactions FROM service_role;

        REVOKE ALL ON public.profiles FROM authenticated;
        REVOKE ALL ON public.categories FROM authenticated;
        REVOKE ALL ON public.transactions FROM authenticated;
      END IF;
    END
    $$;
  `);
};