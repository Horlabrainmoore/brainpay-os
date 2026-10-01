CREATE TABLE public.exchange_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  base_url text NOT NULL,
  last_test_ok boolean,
  last_test_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exchange_settings TO authenticated;
GRANT ALL ON public.exchange_settings TO service_role;
ALTER TABLE public.exchange_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own exchange settings select" ON public.exchange_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own exchange settings insert" ON public.exchange_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own exchange settings update" ON public.exchange_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own exchange settings delete" ON public.exchange_settings FOR DELETE TO authenticated USING (auth.uid() = user_id);