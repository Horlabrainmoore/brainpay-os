
ALTER TABLE public.notification_prefs
  ADD COLUMN IF NOT EXISTS notify_trade boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_payment boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_wallet_tx boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  url text NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  http_status int,
  response_summary text,
  error text,
  attempts int NOT NULL DEFAULT 0,
  next_retry_at timestamptz,
  last_attempt_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.webhook_deliveries TO authenticated;
GRANT ALL ON public.webhook_deliveries TO service_role;

ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY wd_select_own ON public.webhook_deliveries
  FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS webhook_deliveries_user_created_idx
  ON public.webhook_deliveries (user_id, created_at DESC);
