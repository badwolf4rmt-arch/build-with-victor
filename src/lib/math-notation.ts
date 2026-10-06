/** Shared display normalization; never changes stored answers or answer checking. */
export const MATH_NOTATION_RULES = String.raw`Математика во всех строках (вопрос, ответы, explanation): российская школьная нотация. Формулы заключай в $...$. Обыкновенные дроби — только \frac{числитель}{знаменатель}, никогда a/b; смешанные числа — $1\frac{1}{4}$. Десятичные дроби — с запятой: $1{,}25$, не 1.25. Умножение — \cdot, деление — двоеточие. Обратные слеши экранируй по правилам JSON. `;

function russianFormula(math: string): string {
  return math
    .replace(/\\(?:dfrac|tfrac)\b/g, String.raw`\frac`)
    .replace(/(\d)[.,](?=\d)/g, "$1{,}")
    .replace(/\\times\b|\*/g, String.raw`\cdot `)
    .replace(/\\div\b/g, ":")
    .replace(/(^|[^\w/])(\d+|[a-zA-Z]|\{[^{}]+\})\s*\/\s*(\d+|[a-zA-Z]|\{[^{}]+\})(?![\w/])/g,
      (_, before: string, a: string, b: string) => `${before}\\frac{${a.replace(/^\{|\}$/g, "")}}{${b.replace(/^\{|\}$/g, "")}}`);
}

/** Converts legacy numeric expressions, while preserving links, code and dates. */
export function normalizeMath(text: string): string {
  const delimited = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, math: string) => `\n$$\n${math}\n$$\n`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, math: string) => `$${math}$`);
  return delimited.split(/(```[\s\S]*?```|`[^`]*`|!?\[[^\]]*\]\([^)]*\)|https?:\/\/\S+|\$\$[\s\S]*?\$\$|\$[^$\n]+\$|\b\d{1,4}\/\d{1,2}\/\d{2,4}\b)/g)
    .map((part) => {
      if (part.startsWith("$$") && part.endsWith("$$")) return `$$${russianFormula(part.slice(2, -2))}$$`;
      if (part.startsWith("$") && part.endsWith("$")) return `$${russianFormula(part.slice(1, -1))}$`;
      if (/^(?:`|!?\[|https?:\/\/|\d{1,4}\/\d{1,2}\/\d{2,4}$)/.test(part)) return part;
      return part.replace(/(?<![\w/])(?:\d+\s+)?\d+\s*\/\s*\d+(?![\w/])(?:\s*(?:\*|×|·|[+−-])\s*(?:\d+\s+)?\d+(?:\s*\/\s*\d+|[.,]\d+)?)*|(?<![\w/])\d+[.,]\d+(?!\w)/g,
        (expression) => `$${russianFormula(expression.replace(/[×·]/g, "*"))}$`);
    }).join("");
}