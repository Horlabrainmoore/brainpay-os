ALTER TABLE public.metacopier_proxy_logs
  ADD COLUMN correlation_id UUID NOT NULL DEFAULT gen_random_uuid();

CREATE INDEX idx_metacopier_proxy_logs_correlation ON public.metacopier_proxy_logs (correlation_id);