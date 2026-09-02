CREATE TABLE public.oauth_client_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text,
  client_name text,
  scopes text,
  redirect_uri text,
  approved boolean not null default true,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, DELETE ON public.oauth_client_consents TO authenticated;
GRANT ALL ON public.oauth_client_consents TO service_role;
ALTER TABLE public.oauth_client_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY occ_select_own ON public.oauth_client_consents FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY occ_insert_own ON public.oauth_client_consents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY occ_delete_own ON public.oauth_client_consents FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX occ_user_created_idx ON public.oauth_client_consents (user_id, created_at DESC);