CREATE TABLE public.live_sessions (
  code text PRIMARY KEY,
  quiz_id text NOT NULL,
  title text NOT NULL DEFAULT '',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  mode text NOT NULL DEFAULT 'sync',
  speed_scoring boolean NOT NULL DEFAULT true,
  state text NOT NULL DEFAULT 'lobby',
  current integer NOT NULL DEFAULT 0,
  question_started_at bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.live_sessions TO anon, authenticated;
GRANT ALL ON public.live_sessions TO service_role;
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read sessions" ON public.live_sessions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can create sessions" ON public.live_sessions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update sessions" ON public.live_sessions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.live_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_code text NOT NULL REFERENCES public.live_sessions(code) ON DELETE CASCADE,
  name text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  joined_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX live_players_session_idx ON public.live_players(session_code);
GRANT SELECT, INSERT, UPDATE ON public.live_players TO anon, authenticated;
GRANT ALL ON public.live_players TO service_role;
ALTER TABLE public.live_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read players" ON public.live_players FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can join" ON public.live_players FOR INSERT TO anon, authenticated WITH CHECK (char_length(name) BETWEEN 1 AND 30);
CREATE POLICY "Anyone can update players" ON public.live_players FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.live_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_code text NOT NULL REFERENCES public.live_sessions(code) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.live_players(id) ON DELETE CASCADE,
  question integer NOT NULL,
  answer text NOT NULL,
  correct boolean NOT NULL,
  points integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (player_id, question)
);
CREATE INDEX live_answers_session_idx ON public.live_answers(session_code);
GRANT SELECT, INSERT ON public.live_answers TO anon, authenticated;
GRANT ALL ON public.live_answers TO service_role;
ALTER TABLE public.live_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read answers" ON public.live_answers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can answer" ON public.live_answers FOR INSERT TO anon, authenticated WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.live_sessions, public.live_players, public.live_answers;