
CREATE TABLE public.moonpay_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key TEXT,
  wallet_address TEXT,
  currency_code TEXT,
  default_currency_code TEXT,
  show_only_currencies TEXT,
  unsupported_region_redirect_url TEXT,
  skip_unsupported_region_screen BOOLEAN NOT NULL DEFAULT false,
  environment TEXT NOT NULL DEFAULT 'sandbox',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.moonpay_settings TO authenticated;
GRANT ALL ON public.moonpay_settings TO service_role;
ALTER TABLE public.moonpay_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own moonpay settings" ON public.moonpay_settings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER moonpay_settings_touch BEFORE UPDATE ON public.moonpay_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.moonpay_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  status TEXT,
  transaction_id TEXT,
  currency_code TEXT,
  amount NUMERIC,
  base_currency_code TEXT,
  base_amount NUMERIC,
  raw JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.moonpay_events TO authenticated;
GRANT ALL ON public.moonpay_events TO service_role;
ALTER TABLE public.moonpay_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own moonpay events select" ON public.moonpay_events
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own moonpay events insert" ON public.moonpay_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX moonpay_events_user_created ON public.moonpay_events(user_id, created_at DESC);
