import { describe, it, expect } from "vitest";
import { computeOnboardingProgress } from "./progress";

describe("computeOnboardingProgress", () => {
  it("starts at claim-created only with nothing else set", () => {
    const result = computeOnboardingProgress({ date_of_loss: null, damage_category: null }, []);
    expect(result.complete).toBe(false);
    expect(result.percent).toBe(Math.round((1 / 7) * 100));
    const done = result.milestones.filter((m) => m.done).map((m) => m.key);
    expect(done).toEqual(["claim_created"]);
  });

  it("marks loss date and damage category done independently of evidence", () => {
    const result = computeOnboardingProgress(
      { date_of_loss: "2026-06-01", damage_category: "Water / plumbing" },
      [],
    );
    const done = result.milestones.filter((m) => m.done).map((m) => m.key);
    expect(done).toEqual(["claim_created", "loss_date_added", "damage_category_selected"]);
  });

  it("credits policy/photos/estimates only when the matching item is checked", () => {
    const result = computeOnboardingProgress(
      { date_of_loss: null, damage_category: null },
      [
        { label: "Full insurance policy (declarations, forms, endorsements)", checked: false, category: "documentation_completeness" },
        { label: "Contractor or repair estimate", checked: true, category: "documentation_completeness" },
        { label: "Wide shot of each affected room or area", checked: true, category: "evidence_coverage" },
      ],
    );
    const doneKeys = result.milestones.filter((m) => m.done).map((m) => m.key);
    expect(doneKeys).toContain("estimates_added");
    expect(doneKeys).toContain("photos_added");
    expect(doneKeys).not.toContain("policy_uploaded"); // unchecked
  });

  it("credits photos from ANY checked evidence_coverage item, not just a specific label", () => {
    const result = computeOnboardingProgress(
      { date_of_loss: null, damage_category: null },
      [{ label: "Some custom photo item the user typed themselves", checked: true, category: "evidence_coverage" }],
    );
    expect(result.milestones.find((m) => m.key === "photos_added")?.done).toBe(true);
  });

  it("matches the policy milestone by label alone, regardless of category", () => {
    const result = computeOnboardingProgress(
      { date_of_loss: null, damage_category: null },
      [{ label: "Full insurance policy (declarations, forms, endorsements)", checked: true, category: "evidence_coverage" }],
    );
    // Intentional: the policy check is label-only, unlike the photos
    // check (which deliberately matches ANY evidence_coverage item).
    expect(result.milestones.find((m) => m.key === "policy_uploaded")?.done).toBe(true);
  });

  it("'documentation review complete' is a derived composite, never independently satisfiable", () => {
    // Everything EXCEPT the review milestone satisfied -- review must
    // still be false, since it's defined as the AND of the other five
    // content milestones (claim_created is trivially true and excluded
    // from the composite by design).
    const result = computeOnboardingProgress(
      { date_of_loss: "2026-06-01", damage_category: "Fire" },
      [
        { label: "Full insurance policy (declarations, forms, endorsements)", checked: true, category: "documentation_completeness" },
        { label: "Contractor or repair estimate", checked: true, category: "documentation_completeness" },
        // no evidence_coverage item checked -- photos missing
      ],
    );
    expect(result.milestones.find((m) => m.key === "documentation_reviewed")?.done).toBe(false);
    expect(result.complete).toBe(false);
  });

  it("reaches 100% complete only when every milestone is satisfied", () => {
    const result = computeOnboardingProgress(
      { date_of_loss: "2026-06-01", damage_category: "Fire" },
      [
        { label: "Full insurance policy (declarations, forms, endorsements)", checked: true, category: "documentation_completeness" },
        { label: "Contractor or repair estimate", checked: true, category: "documentation_completeness" },
        { label: "Any photo item", checked: true, category: "evidence_coverage" },
      ],
    );
    expect(result.complete).toBe(true);
    expect(result.percent).toBe(100);
    expect(result.milestones.every((m) => m.done)).toBe(true);
  });

  it("never returns a percent outside 0-100", () => {
    const empty = computeOnboardingProgress({ date_of_loss: null, damage_category: null }, []);
    expect(empty.percent).toBeGreaterThanOrEqual(0);
    expect(empty.percent).toBeLessThanOrEqual(100);
  });

  it("is a pure function -- identical input produces identical output", () => {
    const claim = { date_of_loss: "2026-06-01", damage_category: "Water / plumbing" };
    const items = [{ label: "Contractor or repair estimate", checked: true, category: "documentation_completeness" }];
    expect(computeOnboardingProgress(claim, items)).toEqual(computeOnboardingProgress(claim, items));
  });
});
