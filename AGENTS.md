<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Quiz library UI lives in `src/components/quiz/*`; `src/lib/quiz-store.ts` syncs quizzes and folders with Lovable Cloud tables `quizzes`/`folders` (public read/write, realtime refresh) — the library must look the same on every computer. Demo quizzes stay in code; cloud rows with the same id override them, `deleted` hides them.
- Design tokens (colors, card shadow, quiz gradient) are defined in `src/styles.css`; components use semantic classes only — keeps the Figma palette in one place.
- AI quiz generation runs in a server function (`src/lib/quiz-ai.functions.ts`) via OpenRouter (`ai-gateway.server.ts`, `OPENROUTER_API_KEY` secret, model `google/gemini-3.1-pro-preview`) — keeps the API key server-side; generated drafts pass to the editor via sessionStorage.
- Covers and question images are compressed client-side to JPEG data URLs and stored inside the quiz row — public storage buckets are blocked by the workspace policy.
- Lesson files for AI generation are read in `src/lib/material-file.ts`: TXT/DOCX to text in the browser, PDF/images sent to the model as file parts — no file storage needed.
- Question illustrations: after AI quiz generation, `src/lib/quiz-illustrate.functions.ts` illustrates one question in every consecutive group of three, writes a brief (stage 2) then draws each image (stage 3); spacing/style/no-text rules live in `src/lib/question-illustration.ts` — illustrations are optional and never block quiz creation.
- Points for a correct answer come from `QUESTION_POINTS` in `src/lib/game.ts`; preview and game board read the same constant — so the preview never promises a different score than the game awards.
