CREATE TABLE public.quizzes (
  id text PRIMARY KEY,
  title text NOT NULL DEFAULT '',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  cover_url text,
  grade text,
  mine boolean NOT NULL DEFAULT true,
  deleted boolean NOT NULL DEFAULT false,
  created_at bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quizzes TO anon, authenticated;
GRANT ALL ON public.quizzes TO service_role;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read quizzes" ON public.quizzes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can add quizzes" ON public.quizzes FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update quizzes" ON public.quizzes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete quizzes" ON public.quizzes FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE public.folders (
  id text PRIMARY KEY,
  name text NOT NULL,
  quiz_ids text[] NOT NULL DEFAULT '{}',
  position bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.folders TO anon, authenticated;
GRANT ALL ON public.folders TO service_role;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read folders" ON public.folders FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can add folders" ON public.folders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update folders" ON public.folders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete folders" ON public.folders FOR DELETE TO anon, authenticated USING (true);

INSERT INTO public.folders (id, name, quiz_ids, position) VALUES
  ('f-drafts', 'Черновики', ARRAY['q1','q3','q5'], 1),
  ('f-9a', 'История 9А', ARRAY['q1','q3','q4','q5'], 2),
  ('f-8b', '8Б для тестов', ARRAY['q6','q7'], 3);

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER quizzes_touch BEFORE UPDATE ON public.quizzes FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.quizzes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.folders;