import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { cn } from "@/lib/utils";
import { normalizeMath } from "@/lib/math-notation";
export { normalizeMath } from "@/lib/math-notation";

/** Safe Markdown: raw HTML is never evaluated; both common LaTeX delimiters are supported. */
export function RichText({ text, className }: { text: string; className?: string }) {
  return <div className={cn("quiz-rich-text min-w-0 max-w-full", className)}>
    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false, trust: false }]]} skipHtml components={{
      a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" className="underline">{children}</a>,
      img: () => null,
    }}>{normalizeMath(text)}</ReactMarkdown>
  </div>;
}