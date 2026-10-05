import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { InputAnswer } from "@/components/quiz/AnswerArea";

afterEach(() => cleanup());

describe("InputAnswer reveal", () => {
  it("does not repeat the correct answer when the student typed it correctly", () => {
    render(<InputAnswer correct="Наказ" reveal initial="Наказ" onCheck={() => {}} />);

    // The typed answer stays visible in the field...
    expect(screen.getAllByDisplayValue("Наказ")).toHaveLength(1);
    // ...and is not painted a second time in a separate green plate.
    expect(screen.queryAllByText("Наказ")).toHaveLength(0);
  });

  it("shows the correct answer when the student typed something wrong", () => {
    render(<InputAnswer correct="Наказ" reveal initial="Манифест" onCheck={() => {}} />);

    expect(screen.getByText("Наказ")).toBeInTheDocument();
  });

  it("shows the correct answer in practice mode where nobody typed anything", () => {
    render(<InputAnswer correct="Наказ" reveal />);

    expect(screen.getByText("Наказ")).toBeInTheDocument();
  });
});
