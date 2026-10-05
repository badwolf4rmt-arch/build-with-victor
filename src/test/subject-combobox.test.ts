import { describe, expect, it } from "vitest";
import { filterSubjects } from "@/components/quiz/SubjectCombobox";

describe("filterSubjects", () => {
  it("lists every subject when nothing is typed", () => {
    expect(filterSubjects("")).toHaveLength(33);
  });

  it("keeps only subjects whose name contains the typed fragment", () => {
    const res = filterSubjects("ист");
    expect(res).toContain("История");
    expect(res).not.toContain("Физика");
  });

  it("ignores case and ё/е differences", () => {
    expect(filterSubjects("алгебр")).toContain("Алгебра");
    expect(filterSubjects("ДНК РОССИИ")).toContain("Духовно-нравственная культура России (ДНК России)");
  });

  it("returns nothing for a subject that is not in the list", () => {
    expect(filterSubjects("Астрофизика")).toEqual([]);
  });
});
