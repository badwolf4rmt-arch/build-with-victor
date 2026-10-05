ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS subject text;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS topic text;