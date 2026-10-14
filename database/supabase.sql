CREATE TABLE IF NOT EXISTS public.app_state (
  id smallint PRIMARY KEY CHECK (id = 1),
  payload jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.app_state FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.app_state TO service_role;
