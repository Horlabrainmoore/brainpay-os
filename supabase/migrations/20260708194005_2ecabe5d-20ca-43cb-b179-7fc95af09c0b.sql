CREATE TABLE public.metacopier_proxy_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  path TEXT NOT NULL,
  method TEXT NOT NULL,
  status INTEGER,
  ok BOOLEAN NOT NULL DEFAULT false,
  duration_ms INTEGER,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.metacopier_proxy_logs TO authenticated;
GRANT ALL ON public.metacopier_proxy_logs TO service_role;

ALTER TABLE public.metacopier_proxy_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own proxy logs"
ON public.metacopier_proxy_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE INDEX idx_metacopier_proxy_logs_user_created ON public.metacopier_proxy_logs (user_id, created_at DESC);