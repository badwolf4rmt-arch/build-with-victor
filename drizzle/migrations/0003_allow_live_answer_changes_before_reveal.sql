GRANT UPDATE ON public.live_answers TO anon, authenticated;

CREATE POLICY "Anyone can change answer before reveal"
ON public.live_answers
FOR UPDATE
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.live_sessions
    WHERE live_sessions.code = live_answers.session_code
      AND live_sessions.state = 'question'
      AND live_sessions.current = live_answers.question
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.live_sessions
    WHERE live_sessions.code = live_answers.session_code
      AND live_sessions.state = 'question'
      AND live_sessions.current = live_answers.question
  )
);