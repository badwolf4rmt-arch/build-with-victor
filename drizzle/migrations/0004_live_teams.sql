ALTER TABLE public.live_sessions ADD COLUMN IF NOT EXISTS teams jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.live_players ADD COLUMN IF NOT EXISTS team text;