-- Fix permissions and policies for live_answers to allow upsert (answer replacement)
GRANT UPDATE ON public.live_answers TO anon, authenticated;
ALTER POLICY "Anyone can answer" ON public.live_answers FOR ALL USING (true) WITH CHECK (true);
