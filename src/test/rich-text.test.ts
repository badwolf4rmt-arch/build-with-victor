import { describe, expect, it } from "vitest";
import { normalizeMath } from "@/components/quiz/RichText";
describe("LaTeX delimiters", () => {
  it("converts inline and block delimiters without damaging backslashes", () => {
    expect(normalizeMath(String.raw`Ответ \(\frac{1}{2}\)`)).toBe(String.raw`Ответ $\frac{1}{2}$`);
    expect(normalizeMath(String.raw`\[x^2\]`)).toBe("\n$$\nx^2\n$$\n");
    expect(normalizeMath("$x^2$")).toBe("$x^2$");
  });
});