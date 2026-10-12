-- Create financial schema for SpendSmart
-- Compatible with Supabase local (auth.users exists) and remote

-- profiles table
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY,
    full_name text NOT NULL,
    birth_date date,
    phone text,
    created_at timestamptz NOT NULL DEFAULT current_timestamp,
    updated_at timestamptz NOT NULL DEFAULT current_timestamp
);

-- categories table
CREATE TABLE public.categories (
    id bigserial PRIMARY KEY,
    user_id uuid NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    description text,
    color text NOT NULL DEFAULT '#FFFFFF',
    created_at timestamptz NOT NULL DEFAULT current_timestamp,
    updated_at timestamptz NOT NULL DEFAULT current_timestamp
);

-- transactions table
CREATE TABLE public.transactions (
    id bigserial PRIMARY KEY,
    user_id uuid NOT NULL,
    category_id bigint NOT NULL,
    type text NOT NULL,
    amount numeric(12,2) NOT NULL,
    title text NOT NULL,
    occurred_on date NOT NULL,
    description text,
    payment_method text,
    created_at timestamptz NOT NULL DEFAULT current_timestamp,
    updated_at timestamptz NOT NULL DEFAULT current_timestamp
);

-- Constraints
ALTER TABLE public.categories ADD CONSTRAINT categories_type_check CHECK (type IN ('income', 'expense'));
ALTER TABLE public.categories ADD CONSTRAINT categories_user_name_type_unique UNIQUE (user_id, name, type);

ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check CHECK (type IN ('income', 'expense'));
ALTER TABLE public.transactions ADD CONSTRAINT transactions_amount_positive CHECK (amount > 0);
ALTER TABLE public.transactions ADD CONSTRAINT transactions_category_fk FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE RESTRICT;

-- Indexes
CREATE INDEX categories_user_id_idx ON public.categories (user_id);
CREATE INDEX transactions_user_date_idx ON public.transactions (user_id, occurred_on);
CREATE INDEX transactions_user_type_idx ON public.transactions (user_id, type);
CREATE INDEX transactions_category_idx ON public.transactions (category_id);

-- Supabase-specific: FK to auth.users, RLS, policies
DO $$
BEGIN
    IF to_regclass('auth.users') IS NOT NULL THEN
        ALTER TABLE public.profiles
            ADD CONSTRAINT profiles_auth_user_fk
            FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

        ALTER TABLE public.categories
            ADD CONSTRAINT categories_auth_user_fk
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

        ALTER TABLE public.transactions
            ADD CONSTRAINT transactions_auth_user_fk
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

        CREATE POLICY profiles_owner_policy ON public.profiles
            FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());
        CREATE POLICY categories_owner_policy ON public.categories
            FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
        CREATE POLICY transactions_owner_policy ON public.transactions
            FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
    END IF;
END $$;