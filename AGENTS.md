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
- Game screens fit the viewport without scrolling: the board sizes cards from the free space (Figma card ratio) and the open question is shrunk by `FitToScreen` — classroom screens vary in size.
- Live play by QR (Kahoot-like): `src/lib/live.ts` + public tables `live_sessions`/`live_players`/`live_answers` with realtime; teacher screen `/host/$code`, students `/join/$code` (name only); a student's answer is upserted and remains editable only until the correct answer is revealed; pace and speed scoring are teacher options in launch advanced settings — no student accounts needed.
- Question mechanics live in `src/lib/question-kinds.ts` (`kind` on each question; "order" stores the correct sequence as [correct, ...incorrect]; answer checks shared by board, preview, QR and print) and UI in `src/components/quiz/AnswerArea.tsx` — one source of truth for every play surface.
- Card text uses the shared safe Markdown/KaTeX renderer `RichText`; raw HTML is disabled so teacher-authored text cannot execute scripts.
- Math display normalization and generation instructions share `src/lib/math-notation.ts`; normalize only presentation, not stored answers, to keep existing quiz scoring stable.
- QR answer review and standings use shared `AnswerReview` and `LiveResults`; self-paced advancement is explicit so feedback stays visible until the student continues.
- Live sessions snapshot the cover and explanation visibility at launch; explanations stay inside question JSON so library persistence preserves them without a separate table.
- Generated question images pass a vision safety check before attachment, with one neutral retry and omission on failure; prompting alone cannot reliably prevent answer leaks.
