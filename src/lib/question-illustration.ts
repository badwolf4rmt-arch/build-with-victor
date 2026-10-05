/** Pure helpers for question illustrations (shared by server and tests). */

export const ILLUSTRATION_SHARE = 0.3;

/** How many questions get an illustration: at least one in every three. */
export function illustrationCount(total: number): number {
  if (total <= 0) return 0;
  return Math.ceil(total / 3);
}

export type IllustrationGroup = { start: number; end: number; fallbackIndex: number };

/** Consecutive groups keep illustrations evenly spread through the quiz. */
export function illustrationGroups(total: number): IllustrationGroup[] {
  if (total <= 0) return [];
  return Array.from({ length: illustrationCount(total) }, (_, group) => {
    const start = group * 3;
    const end = Math.min(start + 2, total - 1);
    return { start, end, fallbackIndex: Math.floor((start + end) / 2) };
  });
}

export const ILLUSTRATION_STYLE = `A handcrafted digital editorial illustration with a contemporary mid-century-inspired aesthetic, combining flat vector-like shapes with rich painterly texture. Warm, sunlit color grading featuring a harmonious palette of coral, peach, terracotta, apricot, soft cream, turquoise, soft lavender, teal, cobalt blue, emerald, mustard yellow, olive green, and subtle magenta accents. Soft yet saturated colors with gentle tonal transitions and balanced complementary contrasts.
Executed as a handmade digital illustration that mimics traditional mixed-media techniques. Visible grain, fine speckled noise, chalky pastel texture, dry gouache-like brush coverage, and subtle colored-pencil softness create a tactile surface. Delicate paper grain and matte print texture are present throughout, giving the artwork the appearance of high-quality textured illustration paper.
Clean geometric composition with simplified forms, minimal outlines, and carefully controlled negative space. Soft diffuse lighting, subtle ambient shadows, and restrained depth created through overlapping flat color planes rather than realistic rendering. Edges are slightly imperfect and organic, reinforcing the handcrafted feel.
The rendering combines flat color blocking with textured overlays, light airbrush gradients, and gentle pigment variation. Surface imperfections, soft stippling, and layered digital brushes simulate screen printing, risograph, gouache, and pastel techniques while maintaining crisp editorial clarity. The overall finish is matte, warm, tactile, and sophisticated, evoking premium magazine illustration, contemporary publishing, and modern lifestyle editorial artwork.
Style keywords: handmade digital illustration, editorial illustration, textured gouache, pastel grain, paper texture, matte finish, flat shapes, geometric minimalism, mid-century modern influence, risograph-inspired, screen print texture, subtle airbrush gradients, soft stippling, organic edges, contemporary magazine illustration, warm color harmony, tactile mixed-media aesthetic, premium print look.
Avoid: photorealism, 3D render, CGI, anime, sci-fi neon, cyberpunk, cyan-dominant UI, holographic blue screens, cold sterile colors.`;

export const ILLUSTRATION_NO_TEXT = `ABSOLUTE RULE — NO TEXT IN ANY LANGUAGE: Never include readable text, words, letters, numbers, typography, captions, labels, logos, brand names, watermarks, signatures, handwritten notes, UI text, book text, street signs, banners, posters, packaging text, price tags, decorative lettering, Latin script, Cyrillic script, or any legible characters in any language. If a sign, banner, document, label, book, screen, package or interface appears, replace all writing and digits with parallel dashed wavy lines only — horizontal rows of evenly spaced wavy dashed strokes that imitate lines of text without any readable content. No meaningful or decipherable text anywhere in the image.`;

/** Final prompt for the image model: brief from stage 2 + locked style + no-text rule. */
export function buildImagePrompt(brief: {
  imageType: string;
  peoplePolicy: string;
  mainScene: string;
  mainSubject: string;
  location: string;
  atmosphere: string;
  mustShow: string[];
  mustNotShow: string[];
  imageRequest: string;
}): string {
  return [
    "Create an illustration for a school quiz question. Horizontal 3:2 frame. The content is defined ONLY by the brief; the visual style is locked below.",
    `Image type: ${brief.imageType}. People policy: ${brief.peoplePolicy}.`,
    `Main scene: ${brief.mainScene}`,
    `Main subject: ${brief.mainSubject}`,
    `Location: ${brief.location}`,
    `Atmosphere: ${brief.atmosphere}`,
    brief.mustShow.length ? `Must show: ${brief.mustShow.join("; ")}` : "",
    brief.mustNotShow.length ? `Must NOT show: ${brief.mustNotShow.join("; ")}` : "",
    `Artistic request: ${brief.imageRequest}`,
    "IMPORTANT: the picture must help understand the question but must NOT reveal or depict the correct answer.",
    `ILLUSTRATION_STYLE_LOCK_MARKER\n${ILLUSTRATION_STYLE}`,
    ILLUSTRATION_NO_TEXT,
  ]
    .filter(Boolean)
    .join("\n\n");
}
