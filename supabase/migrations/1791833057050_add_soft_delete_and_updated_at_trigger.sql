-- Soft delete + updated_at trigger
-- Run after 1791833057000_create_financial_schema.sql

-- 1. Add deleted_at columns
ALTER TABLE public.profiles ADD COLUMN deleted_at timestamptz;
ALTER TABLE public.categories ADD COLUMN deleted_at timestamptz;
ALTER TABLE public.transactions ADD COLUMN deleted_at timestamptz;

-- 2. Partial indexes for active records (performance)
CREATE INDEX idx_profiles_active ON public.profiles(id) WHERE deleted_at IS NULL;
CREATE INDEX idx_categories_active ON public.categories(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_active ON public.transactions(user_id) WHERE deleted_at IS NULL;

-- 3. Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 4. Attach triggers to all tables
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. RLS policies already cover deleted_at (same user_id check)
-- No policy changes needed — deleted_at doesn't affect RLS