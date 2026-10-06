import { describe, expect, it } from "vitest";
import { normalizeMath } from "@/components/quiz/RichText";
describe("LaTeX delimiters", () => {
  it("converts inline and block delimiters without damaging backslashes", () => {
    expect(normalizeMath(String.raw`Ответ \(\frac{1}{2}\)`)).toBe(String.raw`Ответ $\frac{1}{2}$`);
    expect(normalizeMath(String.raw`\[x^2\]`)).toBe("\n$$\nx^2\n$$\n");
    expect(normalizeMath("$x^2$")).toBe("$x^2$");
  });
  it("renders existing mixed fractions using frac", () => {
    expect(normalizeMath("Вычислите: 1 1/4 * 1 1/5.")).toBe(String.raw`Вычислите: $1 \frac{1}{4} \cdot  1 \frac{1}{5}$.`);
    expect(normalizeMath("1 1/2")).toBe(String.raw`$1 \frac{1}{2}$`);
  });
  it("uses decimal commas in both plain text and LaTeX", () => {
    expect(normalizeMath("Ответ 1.25")).toBe("Ответ $1{,}25$");
    expect(normalizeMath("$0.5 + 1,25$")).toBe("$0{,}5 + 1{,}25$");
  });
  it("normalizes slash fractions and Russian multiplication inside math", () => {
    expect(normalizeMath(String.raw`$1/4 \times 1/5$`)).toBe(String.raw`$\frac{1}{4} \cdot  \frac{1}{5}$`);
    expect(normalizeMath(String.raw`$\frac{1}{2}$`)).toBe(String.raw`$\frac{1}{2}$`);
  });
  it("preserves dates, code and link destinations", () => {
    const text = "[Ссылка](https://example.org/1/2) `1.25` 06/10/2026";
    expect(normalizeMath(text)).toBe(text);
  });
});