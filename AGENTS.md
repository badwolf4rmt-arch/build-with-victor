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
- Quiz library UI lives in `src/components/quiz/*` with state in `src/lib/quiz-store.ts` (folders persisted to localStorage) — frontend-only prototype until a backend is requested.
- Design tokens (colors, card shadow, quiz gradient) are defined in `src/styles.css`; components use semantic classes only — keeps the Figma palette in one place.
- AI quiz generation runs in a server function (`src/lib/quiz-ai.functions.ts`) via OpenRouter (`ai-gateway.server.ts`, `OPENROUTER_API_KEY` secret, model `google/gemini-3.1-pro-preview`) — keeps the API key server-side; generated drafts pass to the editor via sessionStorage.
- Question images are cropped client-side to JPEG data URLs and stored in the draft; AI image generation goes through `src/lib/quiz-image.functions.ts` — no file storage until a backend is added.
- Lesson files for AI generation are read in `src/lib/material-file.ts`: TXT/DOCX to text in the browser, PDF/images sent to the model as file parts — no file storage needed.
