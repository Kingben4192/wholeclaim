import { describe, it, expect } from "vitest";
import {
  computeDocumentationScore,
  toClientView,
  claimTypeProfile,
  gradeForScore,
  type DocumentationScoreInput,
  type DocumentationScoreClaim,
} from "./documentationScore";

const NOW = new Date("2026-07-21T12:00:00Z");

function emptyClaim(overrides: Partial<DocumentationScoreClaim> = {}): DocumentationScoreClaim {
  return { dateOfLoss: null, damageCategory: null, offerAmount: null, ...overrides };
}

function baseInput(overrides: Partial<DocumentationScoreInput> = {}): DocumentationScoreInput {
  return {
    claim: emptyClaim(),
    entries: [],
    deadlines: [],
    evidenceItems: [],
    files: [],
    ...overrides,
  };
}

describe("claimTypeProfile", () => {
  it("maps every known dropdown value to its profile", () => {
    expect(claimTypeProfile("Water / plumbing")).toBe("Water");
    expect(claimTypeProfile("Roof / storm")).toBe("WindHail");
    expect(claimTypeProfile("Hail")).toBe("WindHail");
    expect(claimTypeProfile("Wind / storm")).toBe("WindHail");
    expect(claimTypeProfile("Fire")).toBe("Fire");
    expect(claimTypeProfile("Mold")).toBe("Water");
    expect(claimTypeProfile("Theft")).toBe("Theft");
  });

  it("falls back to Other for unknown or missing values", () => {
    expect(claimTypeProfile(null)).toBe("Other");
    expect(claimTypeProfile("Something not in the dropdown")).toBe("Other");
  });
});

describe("computeDocumentationScore — empty claim", () => {
  it("grades F with no data at all, and never throws", () => {
    const result = computeDocumentationScore(baseInput(), NOW);
    // Consistency Analysis has nothing to be inconsistent about yet, so it
    // scores full (10/10) — that's correct, not a bug: there are no
    // payments, deadlines, or offers to cross-reference. Claim Readiness
    // derives a small non-zero credit from that alone (round(5 * 10/95) = 1),
    // so total is 11, not 0. Still a firm F.
    expect(result.grade).toBe("F");
    expect(result.categories.evidenceCoverage.points).toBe(0);
    expect(result.categories.documentationCompleteness.points).toBe(0);
    expect(result.categories.timelineIntegrity.points).toBe(0);
    expect(result.categories.evidenceQualityOrganization.points).toBe(0);
    expect(result.categories.deadlineReadiness.points).toBe(0);
    expect(result.categories.consistencyAnalysis.points).toBe(10);
    expect(result.total).toBe(11);
  });
});

describe("Evidence Coverage / Documentation Completeness (checklist categories)", () => {
  it("gives full credit when every tagged item has a file", () => {
    const result = computeDocumentationScore(
      baseInput({
        evidenceItems: [
          { label: "Wide shot", checked: true, file_id: "f1", category: "evidence_coverage", created_at: "2026-07-01" },
          { label: "Close-up", checked: true, file_id: "f2", category: "evidence_coverage", created_at: "2026-07-01" },
        ],
      }),
      NOW,
    );
    expect(result.categories.evidenceCoverage.points).toBe(25);
    expect(result.categories.evidenceCoverage.gaps).toHaveLength(0);
  });

  it("gives half credit for checked-but-unfiled items, zero for untouched", () => {
    const result = computeDocumentationScore(
      baseInput({
        evidenceItems: [
          { label: "Policy", checked: false, file_id: null, category: "documentation_completeness", created_at: "2026-07-01" },
          { label: "Estimate", checked: true, file_id: null, category: "documentation_completeness", created_at: "2026-07-01" },
        ],
      }),
      NOW,
    );
    // 2 items, perItem = 10; one at 0, one at half (5) -> round(5) = 5
    expect(result.categories.documentationCompleteness.points).toBe(5);
    expect(result.categories.documentationCompleteness.gaps).toHaveLength(2);
  });

  it("does not let untagged items count toward either category", () => {
    const result = computeDocumentationScore(
      baseInput({
        evidenceItems: [{ label: "Untagged item", checked: true, file_id: "f1", category: null, created_at: "2026-07-01" }],
      }),
      NOW,
    );
    expect(result.categories.evidenceCoverage.points).toBe(0);
    expect(result.categories.documentationCompleteness.points).toBe(0);
  });
});

describe("Timeline Integrity", () => {
  it("scores full points with tight, evenly-spaced activity and a date of loss", () => {
    const result = computeDocumentationScore(
      baseInput({
        claim: emptyClaim({ dateOfLoss: "2026-06-01" }),
        entries: [
          { type: "note", date: "2026-06-05", created_at: "2026-06-05" },
          { type: "note", date: "2026-06-15", created_at: "2026-06-15" },
        ],
      }),
      NOW,
    );
    expect(result.categories.timelineIntegrity.points).toBe(15);
  });

  it("deducts for a large gap and for a missing date of loss, independently", () => {
    const withGapOnly = computeDocumentationScore(
      baseInput({
        claim: emptyClaim({ dateOfLoss: "2026-01-01" }),
        entries: [
          { type: "note", date: "2026-01-05", created_at: "2026-01-05" },
          { type: "note", date: "2026-04-10", created_at: "2026-04-10" }, // ~95 day gap
        ],
      }),
      NOW,
    );
    expect(withGapOnly.categories.timelineIntegrity.points).toBe(3); // 15 - 12

    const noDateOfLoss = computeDocumentationScore(
      baseInput({
        entries: [
          { type: "note", date: "2026-07-01", created_at: "2026-07-01" },
          { type: "note", date: "2026-07-05", created_at: "2026-07-05" },
        ],
      }),
      NOW,
    );
    expect(noDateOfLoss.categories.timelineIntegrity.points).toBe(12); // 15 - 3
  });

  it("floors at 0, never goes negative", () => {
    const result = computeDocumentationScore(
      baseInput({
        entries: [
          { type: "note", date: "2020-01-01", created_at: "2020-01-01" },
          { type: "note", date: "2026-07-01", created_at: "2026-07-01" },
        ],
      }),
      NOW,
    );
    expect(result.categories.timelineIntegrity.points).toBeGreaterThanOrEqual(0);
    expect(result.categories.timelineIntegrity.points).toBe(0); // huge gap + no date of loss
  });
});

describe("Evidence Quality & Organization", () => {
  it("rewards linked files and descriptive labels", () => {
    const result = computeDocumentationScore(
      baseInput({
        files: [{ id: "f1", kind: "photo", original_name: "img.jpg", uploaded_at: "2026-07-01" }],
        evidenceItems: [
          {
            label: "Kitchen ceiling water stain, wide shot",
            checked: true,
            file_id: "f1",
            category: "evidence_coverage",
            created_at: "2026-07-01",
          },
        ],
      }),
      NOW,
    );
    expect(result.categories.evidenceQualityOrganization.points).toBe(15);
  });

  it("penalizes unlinked files and auto-generated labels", () => {
    const result = computeDocumentationScore(
      baseInput({
        files: [{ id: "f1", kind: "photo", original_name: "img.jpg", uploaded_at: "2026-07-01" }],
        evidenceItems: [
          {
            label: "Photo — img.jpg", // matches the auto-generated pattern verbatim
            checked: true,
            file_id: null, // not linked to the actual file
            category: "evidence_coverage",
            created_at: "2026-07-01",
          },
        ],
      }),
      NOW,
    );
    expect(result.categories.evidenceQualityOrganization.points).toBe(0);
    expect(result.categories.evidenceQualityOrganization.gaps.length).toBeGreaterThan(0);
  });
});

describe("Deadline Readiness — decay and recovery", () => {
  it("gives full credit for a far-off deadline", () => {
    const result = computeDocumentationScore(
      baseInput({ deadlines: [{ title: "Suit deadline", due_date: "2027-06-01", created_at: "2026-07-01" }] }),
      NOW,
    );
    expect(result.categories.deadlineReadiness.points).toBe(10);
  });

  it("gives zero credit for an overdue deadline regardless of activity", () => {
    const result = computeDocumentationScore(
      baseInput({
        deadlines: [{ title: "Missed deadline", due_date: "2026-07-01", created_at: "2026-01-01" }],
        entries: [{ type: "note", date: "2026-07-20", created_at: "2026-07-20T00:00:00Z" }],
      }),
      NOW,
    );
    expect(result.categories.deadlineReadiness.points).toBe(0);
  });

  it("recovers partial credit for an approaching deadline with recent activity", () => {
    const noActivity = computeDocumentationScore(
      baseInput({ deadlines: [{ title: "Soon", due_date: "2026-07-25", created_at: "2026-01-01" }] }), // 4 days out
      NOW,
    );
    const withActivity = computeDocumentationScore(
      baseInput({
        deadlines: [{ title: "Soon", due_date: "2026-07-25", created_at: "2026-01-01" }],
        entries: [{ type: "call", date: "2026-07-20", created_at: "2026-07-20T00:00:00Z" }], // within last 3 days
      }),
      NOW,
    );
    expect(withActivity.categories.deadlineReadiness.points).toBeGreaterThan(noActivity.categories.deadlineReadiness.points);
  });
});

describe("Consistency Analysis — structural checks", () => {
  it("triggers the payment-without-support check", () => {
    const result = computeDocumentationScore(
      baseInput({ entries: [{ type: "payment", date: "2026-06-01", created_at: "2026-06-01T00:00:00Z" }] }),
      NOW,
    );
    expect(result.categories.consistencyAnalysis.points).toBe(8); // 10 - 2
    expect(result.categories.consistencyAnalysis.gaps[0].description).toMatch(/payment/i);
  });

  it("does not trigger payment check when a file is nearby", () => {
    const result = computeDocumentationScore(
      baseInput({
        entries: [{ type: "payment", date: "2026-06-01", created_at: "2026-06-01T00:00:00Z" }],
        files: [{ id: "f1", kind: "pdf", original_name: "check.pdf", uploaded_at: "2026-06-03T00:00:00Z" }],
      }),
      NOW,
    );
    expect(result.categories.consistencyAnalysis.gaps.some((g) => /payment/i.test(g.description))).toBe(false);
  });

  it("triggers the offer-without-payment check", () => {
    const result = computeDocumentationScore(baseInput({ claim: emptyClaim({ offerAmount: 12000 }) }), NOW);
    expect(result.categories.consistencyAnalysis.gaps.some((g) => /offer/i.test(g.description))).toBe(true);
  });
});

describe("Consistency Analysis — stale required document", () => {
  it("does not trigger before 30 days, does trigger after", () => {
    const recentLoss = computeDocumentationScore(
      baseInput({
        claim: emptyClaim({ dateOfLoss: "2026-07-10" }), // 11 days before NOW
        evidenceItems: [
          { label: "Estimate", checked: false, file_id: null, category: "documentation_completeness", created_at: "2026-07-10" },
        ],
      }),
      NOW,
    );
    expect(recentLoss.categories.consistencyAnalysis.gaps.some((g) => /outstanding/i.test(g.description))).toBe(false);

    const oldLoss = computeDocumentationScore(
      baseInput({
        claim: emptyClaim({ dateOfLoss: "2026-05-01" }), // 81 days before NOW
        evidenceItems: [
          { label: "Estimate", checked: false, file_id: null, category: "documentation_completeness", created_at: "2026-05-01" },
        ],
      }),
      NOW,
    );
    expect(oldLoss.categories.consistencyAnalysis.gaps.some((g) => /outstanding/i.test(g.description))).toBe(true);
  });
});

describe("Claim Readiness — derived category", () => {
  it("scores 5/5 only when every other category is maxed", () => {
    const result = computeDocumentationScore(
      baseInput({
        claim: emptyClaim({ dateOfLoss: "2026-01-01" }),
        entries: [
          { type: "note", date: "2026-01-02", created_at: "2026-01-02T00:00:00Z" },
          { type: "note", date: "2026-01-10", created_at: "2026-01-10T00:00:00Z" },
        ],
        files: [{ id: "f1", kind: "photo", original_name: "a.jpg", uploaded_at: "2026-01-02" }],
        evidenceItems: [
          {
            label: "Wide shot of kitchen",
            checked: true,
            file_id: "f1",
            category: "evidence_coverage",
            created_at: "2026-01-02",
          },
        ],
      }),
      NOW,
    );
    const otherSix: (keyof typeof result.categories)[] = [
      "evidenceCoverage",
      "documentationCompleteness",
      "timelineIntegrity",
      "evidenceQualityOrganization",
      "deadlineReadiness",
      "consistencyAnalysis",
    ];
    const allMaxed = otherSix.every((k) => result.categories[k].points === result.categories[k].max);
    if (allMaxed) {
      expect(result.categories.claimReadiness.points).toBe(5);
    } else {
      // Documentation Completeness has no tagged items here, so it's 0/20 —
      // Claim Readiness should be proportionally less than 5.
      expect(result.categories.claimReadiness.points).toBeLessThan(5);
    }
  });

  it("total never exceeds 100 even when every category is maxed", () => {
    const result = computeDocumentationScore(
      baseInput({
        claim: emptyClaim({ dateOfLoss: "2026-01-01" }),
        entries: [
          { type: "note", date: "2026-01-02", created_at: "2026-01-02T00:00:00Z" },
          { type: "note", date: "2026-01-10", created_at: "2026-01-10T00:00:00Z" },
        ],
        files: [
          { id: "f1", kind: "photo", original_name: "a.jpg", uploaded_at: "2026-01-02" },
          { id: "f2", kind: "pdf", original_name: "b.pdf", uploaded_at: "2026-01-02" },
        ],
        evidenceItems: [
          {
            label: "Wide shot of kitchen",
            checked: true,
            file_id: "f1",
            category: "evidence_coverage",
            created_at: "2026-01-02",
          },
          {
            label: "Full policy document",
            checked: true,
            file_id: "f2",
            category: "documentation_completeness",
            created_at: "2026-01-02",
          },
        ],
      }),
      NOW,
    );
    expect(result.total).toBeLessThanOrEqual(100);
  });
});

describe("Recommendation prioritization", () => {
  it("sorts by points recoverable, descending", () => {
    const result = computeDocumentationScore(
      baseInput({
        evidenceItems: [
          { label: "Missing evidence item", checked: false, file_id: null, category: "evidence_coverage", created_at: "2026-07-01" },
        ],
        deadlines: [{ title: "Overdue", due_date: "2026-01-01", created_at: "2026-01-01" }],
      }),
      NOW,
    );
    expect(result.recommendations.length).toBeGreaterThan(0);
    for (let i = 1; i < result.recommendations.length; i++) {
      expect(result.recommendations[i - 1].pointsRecoverable).toBeGreaterThanOrEqual(
        result.recommendations[i].pointsRecoverable,
      );
    }
  });

  it("never returns more than 5 recommendations", () => {
    const result = computeDocumentationScore(
      baseInput({
        deadlines: [
          { title: "One", due_date: "2020-01-01", created_at: "2020-01-01" },
          { title: "Two", due_date: "2020-02-01", created_at: "2020-01-01" },
          { title: "Three", due_date: "2020-03-01", created_at: "2020-01-01" },
        ],
        evidenceItems: [
          { label: "A", checked: false, file_id: null, category: "evidence_coverage", created_at: "2026-07-01" },
          { label: "B", checked: false, file_id: null, category: "documentation_completeness", created_at: "2026-07-01" },
        ],
        claim: emptyClaim({ offerAmount: 5000 }),
      }),
      NOW,
    );
    expect(result.recommendations.length).toBeLessThanOrEqual(5);
  });
});

describe("Grade bands — decoupled from the public Grader Quiz's GRADE_BANDS", () => {
  const bandCases: [number, string][] = [
    [100, "A"],
    [90, "A"],
    [89, "B"],
    [80, "B"],
    [79, "C"],
    [70, "C"],
    [69, "D"],
    [60, "D"],
    [59, "F"],
    [0, "F"],
  ];

  it.each(bandCases)("scores %i as grade %s", (total, expectedGrade) => {
    expect(gradeForScore(total)).toBe(expectedGrade);
  });
});

describe("toClientView — confidentiality boundary", () => {
  it("never exposes weights, maxes, raw points, or point deltas", () => {
    const result = computeDocumentationScore(
      baseInput({
        evidenceItems: [
          { label: "Missing item", checked: false, file_id: null, category: "evidence_coverage", created_at: "2026-07-01" },
        ],
      }),
      NOW,
    );
    const clientView = toClientView(result);
    const serialized = JSON.stringify(clientView);

    // No numeric weight/max values anywhere in the serialized client view.
    for (const maxValue of [25, 20, 15, 10, 5]) {
      // 15 appears twice (timelineIntegrity/evidenceQualityOrganization) —
      // still must never appear as a bare number in the client payload.
      expect(serialized.includes(`:${maxValue}`)).toBe(false);
      expect(serialized.includes(`:${maxValue}.`)).toBe(false);
    }

    // Only status/priority enums and the final total/grade are present.
    expect(clientView).not.toHaveProperty("categories.0.points");
    expect(clientView).not.toHaveProperty("categories.0.max");
    expect(clientView.recommendations.every((r) => !("pointsRecoverable" in r))).toBe(true);
    expect(clientView.categories.every((c) => !("points" in c) && !("max" in c))).toBe(true);

    // Category labels are the official names, verbatim.
    expect(clientView.categories.map((c) => c.label)).toEqual([
      "Evidence Coverage",
      "Documentation Completeness",
      "Timeline Integrity",
      "Evidence Quality & Organization",
      "Deadline Readiness",
      "Consistency Analysis",
      "Claim Readiness",
    ]);
  });

  it("total and grade are present and consistent with each other", () => {
    const result = computeDocumentationScore(baseInput(), NOW);
    const clientView = toClientView(result);
    expect(clientView.total).toBe(result.total);
    expect(clientView.grade).toBe(result.grade);
  });
});

describe("Determinism", () => {
  it("produces identical output for identical input", () => {
    const input = baseInput({
      claim: emptyClaim({ dateOfLoss: "2026-06-01", damageCategory: "Fire", offerAmount: 9000 }),
      entries: [{ type: "payment", date: "2026-06-10", created_at: "2026-06-10T00:00:00Z" }],
      deadlines: [{ title: "Proof of loss due", due_date: "2026-08-01", created_at: "2026-06-01" }],
      evidenceItems: [
        { label: "Smoke damage photo", checked: true, file_id: "f1", category: "evidence_coverage", created_at: "2026-06-05" },
      ],
      files: [{ id: "f1", kind: "photo", original_name: "smoke.jpg", uploaded_at: "2026-06-05" }],
    });
    const a = computeDocumentationScore(input, NOW);
    const b = computeDocumentationScore(input, NOW);
    expect(a).toEqual(b);
  });
});
