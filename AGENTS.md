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
