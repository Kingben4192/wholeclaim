import { describe, it, expect } from "vitest";
import { filesForScoring } from "./scoringFileFilter";
import {
  computeDocumentationScore,
  type DocumentationScoreInput,
  type DocumentationScoreClaim,
  type DocumentationScoreEvidenceItem,
  type DocumentationScoreFile,
} from "./scoring/documentationScore";

const NOW = new Date("2026-07-26T12:00:00Z");

function claim(overrides: Partial<DocumentationScoreClaim> = {}): DocumentationScoreClaim {
  return { dateOfLoss: null, damageCategory: null, offerAmount: null, ...overrides };
}

function baseInput(overrides: Partial<DocumentationScoreInput> = {}): DocumentationScoreInput {
  return {
    claim: claim(),
    entries: [],
    deadlines: [],
    evidenceItems: [],
    files: [],
    ...overrides,
  };
}

describe("filesForScoring — pure function", () => {
  it("excludes a file linked only to a promised item", () => {
    const files = [{ id: "f1" }, { id: "f2" }];
    const evidenceItems = [{ file_id: "f2" }];
    const promisedItems = [{ file_id: "f1" }];
    expect(filesForScoring(files, evidenceItems, promisedItems)).toEqual([{ id: "f2" }]);
  });

  it("keeps a file linked to both a promised item and an evidence item", () => {
    const files = [{ id: "f1" }];
    const evidenceItems = [{ file_id: "f1" }];
    const promisedItems = [{ file_id: "f1" }];
    expect(filesForScoring(files, evidenceItems, promisedItems)).toEqual([{ id: "f1" }]);
  });

  it("leaves files with no promised-item link completely unaffected", () => {
    const files = [{ id: "f1" }, { id: "f2" }];
    expect(filesForScoring(files, [], [])).toEqual(files);
  });

  it("ignores promised items with no file yet (file_id null)", () => {
    const files = [{ id: "f1" }];
    const promisedItems = [{ file_id: null }];
    expect(filesForScoring(files, [], promisedItems)).toEqual(files);
  });
});

// Regression coverage for the real bug found and fixed 2026-07-26: a
// promised-document upload silently dropped a claim's total score by 6
// points (53 -> 47) because Evidence Quality & Organization counted the
// uploaded file as orphaned. Kept as a permanent, deterministic,
// DB-free test (mirrors documentationScore.test.ts's own convention) --
// the original live-Supabase version that caught this was a throwaway
// verification script, deleted after use.
describe("Documentation Score — promised-document upload regression", () => {
  const baselineFile = { id: "photo-1", kind: "photo", original_name: "photo.jpg", uploaded_at: "2026-06-01" };
  const baselineEvidence = {
    label: "Damage photo",
    checked: true,
    file_id: "photo-1",
    category: "evidence_coverage" as const,
    created_at: "2026-06-01",
  };

  function scoreWith(files: DocumentationScoreFile[], evidenceItems: DocumentationScoreEvidenceItem[], promisedItems: { file_id: string | null }[]) {
    return computeDocumentationScore(
      baseInput({
        evidenceItems,
        files: filesForScoring(files, evidenceItems, promisedItems),
      }),
      NOW,
    );
  }

  it("a promised-only file leaves the total score unchanged", () => {
    const before = scoreWith([baselineFile], [baselineEvidence], []);

    const promisedFile = { id: "promised-1", kind: "pdf", original_name: "engineer-report.pdf", uploaded_at: "2026-07-01" };
    const after = scoreWith(
      [baselineFile, promisedFile],
      [baselineEvidence],
      [{ file_id: "promised-1" }],
    );

    expect(after.total).toBe(before.total);
    expect(after.categories.evidenceQualityOrganization.points).toBe(
      before.categories.evidenceQualityOrganization.points,
    );
  });

  it("a file linked to both a promised item and an evidence item still improves the score", () => {
    const before = scoreWith([baselineFile], [baselineEvidence], []);

    const bothFile = { id: "both-1", kind: "pdf", original_name: "denial-letter.pdf", uploaded_at: "2026-07-01" };
    const bothEvidenceItem = {
      label: "Denial letter",
      checked: true,
      file_id: "both-1",
      category: "documentation_completeness" as const,
      created_at: "2026-07-01",
    };
    const after = scoreWith(
      [baselineFile, bothFile],
      [baselineEvidence, bothEvidenceItem],
      [{ file_id: "both-1" }],
    );

    expect(after.total).toBeGreaterThan(before.total);
    expect(after.categories.documentationCompleteness.points).toBeGreaterThan(0);
  });
});
