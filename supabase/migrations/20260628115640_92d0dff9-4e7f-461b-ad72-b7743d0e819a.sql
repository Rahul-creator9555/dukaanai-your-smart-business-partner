CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  sku TEXT,
  image_url TEXT,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  purchase_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  selling_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own products" ON public.products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own products" ON public.products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own products" ON public.products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own products" ON public.products FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER products_set_updated_at BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX products_user_id_idx ON public.products(user_id);
CREATE INDEX products_name_idx ON public.products(user_id, name);