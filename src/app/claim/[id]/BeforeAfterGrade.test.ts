import { describe, it, expect } from "vitest";
import { classifyProgress } from "./BeforeAfterGrade";

describe("classifyProgress", () => {
  it("no previous analysis -> neutral baseline, not F/0", () => {
    const result = classifyProgress(false, "F", 0, "F", 36);
    expect(result).toEqual({ kind: "no_baseline" });
  });

  it("score improves within the same letter grade (24 -> 36, both F)", () => {
    const result = classifyProgress(true, "F", 24, "F", 36);
    expect(result).toEqual({ kind: "numeric_improved", pointsUp: 12 });
  });

  it("letter grade improves (D -> C)", () => {
    const result = classifyProgress(true, "D", 65, "C", 72);
    expect(result).toEqual({ kind: "letter_improved", lettersUp: 1, pointsUp: 7 });
  });

  it("no score change -> neutral no-change state", () => {
    const result = classifyProgress(true, "C", 75, "C", 75);
    expect(result).toEqual({ kind: "no_change" });
  });

  it("score decreases within the same letter grade -> decline, letter not flagged", () => {
    const result = classifyProgress(true, "B", 85, "B", 81);
    expect(result).toEqual({ kind: "declined", pointsDown: 4, letterDeclined: false });
  });

  it("score decreases enough to drop a letter grade -> decline, letter flagged", () => {
    const result = classifyProgress(true, "C", 75, "D", 65);
    expect(result).toEqual({ kind: "declined", pointsDown: 10, letterDeclined: true });
  });

  it("multiple letter grades improved at once reports the real delta", () => {
    const result = classifyProgress(true, "F", 30, "B", 85);
    expect(result).toEqual({ kind: "letter_improved", lettersUp: 3, pointsUp: 55 });
  });
});
