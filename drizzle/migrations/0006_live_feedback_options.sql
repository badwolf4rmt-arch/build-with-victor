ALTER TABLE public.live_sessions ADD COLUMN IF NOT EXISTS show_explanations boolean NOT NULL DEFAULT false;
ALTER TABLE public.live_sessions ADD COLUMN IF NOT EXISTS cover_url text;
COMMENT ON COLUMN public.live_sessions.show_explanations IS 'Teacher opts into showing question explanations after reveal.';