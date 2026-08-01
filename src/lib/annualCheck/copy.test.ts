import { describe, it, expect } from "vitest";
import { annualCheckEmail } from "./copy";

describe("annualCheckEmail", () => {
  const base = { currentGrade: "B", currentScore: 82, claimLink: "https://example.com/claim/123" };

  it("frames a first-ever check with no prior comparison", () => {
    const text = annualCheckEmail({ ...base, priorGrade: null, priorScore: null });
    expect(text).toContain("Your first annual check: B (82).");
    expect(text).not.toContain("Last check:");
  });

  it("frames an improvement", () => {
    const text = annualCheckEmail({ ...base, priorGrade: "C", priorScore: 70 });
    expect(text).toContain("up 12 points");
  });

  it("frames a decline", () => {
    const text = annualCheckEmail({ ...base, priorGrade: "A", priorScore: 95 });
    expect(text).toContain("down 13 points");
  });

  it("frames no change", () => {
    const text = annualCheckEmail({ ...base, priorGrade: "B", priorScore: 82 });
    expect(text).toContain("unchanged");
  });

  it("never implies the score predicts a settlement outcome", () => {
    const text = annualCheckEmail({ ...base, priorGrade: null, priorScore: null });
    expect(text.toLowerCase()).not.toMatch(/guarantee|approv|settlement amount|will pay/);
  });
});
