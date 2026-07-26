import { describe, it, expect } from "vitest";
import {
  computeDocumentationScore,
  type DocumentationScoreInput,
  type DocumentationScoreClaim,
  type DocumentationScoreEntry,
  type DocumentationScoreEvidenceItem,
  type DocumentationScoreFile,
  type DocumentationScoreDeadline,
  type CategoryKey,
} from "./documentationScore";

// Permanent 50-case fixture suite for the Documentation Score engine.
// Everything here calls computeDocumentationScore() directly, in-memory --
// no HTTP path, no database, no claim rows. Pairs with the existing
// documentationScore.test.ts (per-mechanic unit tests); this file is about
// the *distribution* across a realistic population of claims plus the
// cross-cutting properties (isolation, monotonicity, range) that only show
// up when you look at many cases side by side.

const NOW = new Date("2026-07-21T12:00:00Z");

// ---------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------

function claim(overrides: Partial<DocumentationScoreClaim> = {}): DocumentationScoreClaim {
  return { dateOfLoss: null, damageCategory: null, offerAmount: null, ...overrides };
}

function entry(date: string, overrides: Partial<DocumentationScoreEntry> = {}): DocumentationScoreEntry {
  return { type: "note", date, created_at: date, ...overrides };
}

function evidenceItem(
  label: string,
  category: DocumentationScoreEvidenceItem["category"],
  overrides: Partial<DocumentationScoreEvidenceItem> = {},
): DocumentationScoreEvidenceItem {
  return { label, checked: true, file_id: null, category, created_at: "2026-06-01", ...overrides };
}

function file(id: string, overrides: Partial<DocumentationScoreFile> = {}): DocumentationScoreFile {
  return { id, kind: "photo", original_name: `${id}.jpg`, uploaded_at: "2026-06-01", ...overrides };
}

function deadline(title: string, due_date: string, overrides: Partial<DocumentationScoreDeadline> = {}): DocumentationScoreDeadline {
  return { title, due_date, created_at: "2026-06-01", ...overrides };
}

function emptyInput(overrides: Partial<DocumentationScoreInput> = {}): DocumentationScoreInput {
  return { claim: claim(), entries: [], deadlines: [], evidenceItems: [], files: [], ...overrides };
}

type Fixture = { name: string; input: DocumentationScoreInput };

// ---------------------------------------------------------------------
// The baseline "complete" claim -- every independent category at or near
// its max, simultaneously, from ONE coherent, internally-consistent story
// (not seven unrelated snippets). Every near-complete/partial fixture
// below is derived from this exact object so the isolation assertion is
// actually meaningful (one variable changed at a time from a shared base).
//
// Story: water damage discovered 2026-06-01, tightly logged through
// 2026-07-19 (max gap 13 days, under the 14-day threshold), a non-keyword
// deadline 11 days out with recent activity, six evidence items (three
// per checklist category) all filed and descriptively labeled, six files
// all linked. No payment/offer data at all -- deliberately, since their
// absence cleanly avoids two of the five consistency checks without any
// special-casing (nothing to be inconsistent about).
// ---------------------------------------------------------------------

const COMPLETE_EVIDENCE_COVERAGE: DocumentationScoreEvidenceItem[] = [
  evidenceItem("Wide shot of kitchen ceiling water stain", "evidence_coverage", { file_id: "f1" }),
  evidenceItem("Close-up of warped flooring near the sink", "evidence_coverage", { file_id: "f2" }),
  evidenceItem("Video walkthrough of affected rooms", "evidence_coverage", { file_id: "f3" }),
];

const COMPLETE_DOC_COMPLETENESS: DocumentationScoreEvidenceItem[] = [
  evidenceItem("Full homeowner's policy with endorsements", "documentation_completeness", { file_id: "f4" }),
  evidenceItem("Plumber's repair estimate, itemized", "documentation_completeness", { file_id: "f5" }),
  evidenceItem("Moisture reading report from mitigation company", "documentation_completeness", { file_id: "f6" }),
];

const COMPLETE_FILES: DocumentationScoreFile[] = [
  file("f1"), file("f2"), file("f3", { kind: "doc" }), file("f4", { kind: "pdf" }), file("f5", { kind: "pdf" }), file("f6", { kind: "pdf" }),
];

const COMPLETE_ENTRIES: DocumentationScoreEntry[] = [
  entry("2026-06-05"), // gap from loss: 4 days
  entry("2026-06-15"), // gap: 10
  entry("2026-06-28"), // gap: 13
  entry("2026-07-10"), // gap: 12
  entry("2026-07-19"), // gap: 9 -- also within 7 days of NOW, backs deadline credit
];

const COMPLETE_DEADLINES: DocumentationScoreDeadline[] = [
  // 11 days out from NOW -- recent activity (the 07-19 entry, 2 days before
  // NOW) gives 0.8 credit; due_date is within 14 days of that entry's
  // created_at, so it doesn't trip checkDeadlineWithoutActivity either.
  // Title deliberately has no keyword overlap with the baseline or "Other"
  // profile lists.
  deadline("Suit limitation deadline", "2026-08-01"),
];

const COMPLETE_INPUT: DocumentationScoreInput = {
  claim: claim({ dateOfLoss: "2026-06-01" }),
  entries: COMPLETE_ENTRIES,
  deadlines: COMPLETE_DEADLINES,
  evidenceItems: [...COMPLETE_EVIDENCE_COVERAGE, ...COMPLETE_DOC_COMPLETENESS],
  files: COMPLETE_FILES,
};

// ---------------------------------------------------------------------
// 7 near-complete fixtures -- baseline with exactly one category's own
// data emptied out (the literal, realistic "user never touched this
// category" case), everything else identical to COMPLETE_INPUT.
// ---------------------------------------------------------------------

const NEAR_COMPLETE: Fixture[] = [
  {
    name: "Near-complete — no Evidence Coverage",
    input: { ...COMPLETE_INPUT, evidenceItems: COMPLETE_DOC_COMPLETENESS },
  },
  {
    name: "Near-complete — no Documentation Completeness",
    input: { ...COMPLETE_INPUT, evidenceItems: COMPLETE_EVIDENCE_COVERAGE },
  },
  {
    name: "Near-complete — no Timeline Integrity (no entries logged)",
    input: { ...COMPLETE_INPUT, entries: [] },
  },
  {
    name: "Near-complete — no Evidence Quality & Organization (nothing uploaded)",
    input: { ...COMPLETE_INPUT, evidenceItems: [], files: [] },
  },
  {
    name: "Near-complete — no Deadline Readiness (no deadlines tracked)",
    input: { ...COMPLETE_INPUT, deadlines: [] },
  },
  {
    name: "Near-complete — worst-case Consistency Analysis",
    // Consistency has no dedicated "empty" input to remove (it's five
    // structural checks over shared data) -- its "empty" analogue is
    // every check triggered at once, not an absence of data.
    input: {
      claim: claim({ dateOfLoss: "2026-05-01", offerAmount: 15000 }), // offer w/o payment
      entries: [
        entry("2026-06-15", { type: "payment", created_at: "2026-06-15T00:00:00Z" }), // unbacked payment
      ],
      deadlines: [deadline("Proof of loss estimate due", "2026-06-01")], // keyword match, overdue, no nearby activity
      evidenceItems: [
        evidenceItem("Estimate", "documentation_completeness", { checked: false, file_id: null, created_at: "2026-05-01" }), // stale, unfiled, unchecked
      ],
      files: [],
    },
  },
  {
    name: "Near-complete — Claim Readiness (no independent input; see note)",
    // Claim Readiness has no data of its own -- it's purely 5 * (other six
    // earned / other six max). There is no fixture that "empties only
    // Claim Readiness" without emptying something else first. Included
    // as the complete claim itself, annotated, rather than omitted
    // silently -- the isolation assertion below documents this precisely.
    input: COMPLETE_INPUT,
  },
];

// ---------------------------------------------------------------------
// 7 partial fixtures -- baseline with exactly one category degraded to
// roughly half credit, everything else identical to COMPLETE_INPUT.
// ---------------------------------------------------------------------

const PARTIAL: Fixture[] = [
  {
    name: "Partial — Evidence Coverage half-satisfied",
    // All three items checked but unfiled -> each worth half its share.
    input: {
      ...COMPLETE_INPUT,
      evidenceItems: [
        ...COMPLETE_EVIDENCE_COVERAGE.map((i) => ({ ...i, file_id: null })),
        ...COMPLETE_DOC_COMPLETENESS,
      ],
    },
  },
  {
    name: "Partial — Documentation Completeness half-satisfied",
    input: {
      ...COMPLETE_INPUT,
      evidenceItems: [
        ...COMPLETE_EVIDENCE_COVERAGE,
        ...COMPLETE_DOC_COMPLETENESS.map((i) => ({ ...i, file_id: null })),
      ],
    },
  },
  {
    name: "Partial — Timeline Integrity half-satisfied",
    // Same entries (so deadline/consistency math is untouched -- those
    // read created_at/type, never date), but `date` spread into a >30-day
    // gap -> -7, dateOfLoss stays set -> points = 15-7 = 8 (~53%).
    input: {
      ...COMPLETE_INPUT,
      entries: [
        entry("2026-06-05", { created_at: COMPLETE_ENTRIES[0].created_at }),
        entry("2026-07-10", { created_at: COMPLETE_ENTRIES[1].created_at }),
        entry("2026-07-15", { created_at: COMPLETE_ENTRIES[2].created_at }),
        entry("2026-07-17", { created_at: COMPLETE_ENTRIES[3].created_at }),
        entry("2026-07-19", { created_at: COMPLETE_ENTRIES[4].created_at }),
      ],
    },
  },
  {
    name: "Partial — Evidence Quality & Organization half-satisfied",
    // Half the files unlinked, half the items auto-labeled.
    input: {
      ...COMPLETE_INPUT,
      evidenceItems: [
        { ...COMPLETE_EVIDENCE_COVERAGE[0], label: "Photo — img1.jpg" }, // matches auto-generated pattern
        COMPLETE_EVIDENCE_COVERAGE[1],
        COMPLETE_EVIDENCE_COVERAGE[2],
        { ...COMPLETE_DOC_COMPLETENESS[0], label: "Photo — img2.jpg" },
        COMPLETE_DOC_COMPLETENESS[1],
        COMPLETE_DOC_COMPLETENESS[2],
      ],
      files: [file("f1"), file("f2"), file("f3"), file("f4"), file("unlinked-1"), file("unlinked-2")],
    },
  },
  {
    name: "Partial — Deadline Readiness half-satisfied",
    // Two deadlines: one far off (credit 1.0) and one overdue (credit 0)
    // -> exact average 0.5, deliberately (not an approximation).
    input: {
      ...COMPLETE_INPUT,
      deadlines: [
        deadline("Far-off deadline", "2027-01-01"),
        deadline("Overdue deadline", "2026-01-01"),
      ],
    },
  },
  {
    name: "Partial — Consistency Analysis half-satisfied (2 of 5 checks)",
    input: {
      ...COMPLETE_INPUT,
      claim: claim({ dateOfLoss: "2026-06-01", offerAmount: 15000 }), // offer w/o payment: 1 check
      entries: [...COMPLETE_ENTRIES, entry("2026-06-15", { type: "payment", created_at: "2026-06-15T00:00:00Z" })], // unbacked payment: 2nd check
    },
  },
  {
    name: "Partial — Claim Readiness (derived; ~half via other six averaging down)",
    input: {
      claim: claim({ dateOfLoss: "2026-06-01" }),
      entries: [],
      deadlines: [],
      evidenceItems: COMPLETE_EVIDENCE_COVERAGE,
      files: [],
    },
  },
];

// ---------------------------------------------------------------------
// ~20 mixed realistic claims spanning the range
// ---------------------------------------------------------------------

const MIXED: Fixture[] = [
  {
    name: "Mixed — well-documented homeowner, minor gaps",
    input: {
      claim: claim({ dateOfLoss: "2026-05-15", damageCategory: "Roof / storm" }),
      entries: [entry("2026-05-16"), entry("2026-05-28"), entry("2026-06-20"), entry("2026-07-05")],
      deadlines: [deadline("Suit limitation deadline", "2026-09-15")],
      evidenceItems: [
        evidenceItem("Roof elevation photos, all sides", "evidence_coverage", { file_id: "r1" }),
        evidenceItem("Close-up of hail impact points", "evidence_coverage", { file_id: "r2" }),
        evidenceItem("NOAA storm report", "documentation_completeness", { file_id: "r3" }),
        evidenceItem("Contractor estimate", "documentation_completeness", { checked: false, file_id: null }),
      ],
      files: [file("r1"), file("r2"), file("r3")],
    },
  },
  {
    name: "Mixed — average homeowner, mid-progress",
    input: {
      claim: claim({ dateOfLoss: "2026-06-10" }),
      entries: [entry("2026-06-12"), entry("2026-06-25")],
      deadlines: [deadline("Follow up with adjuster", "2026-08-10")],
      evidenceItems: [
        evidenceItem("Damage photos", "evidence_coverage", { file_id: "a1" }),
        evidenceItem("Policy declarations page", "documentation_completeness", { checked: true, file_id: null }),
      ],
      files: [file("a1")],
    },
  },
  {
    name: "Mixed — sparse, early confusion",
    input: {
      claim: claim({ dateOfLoss: "2026-07-01" }),
      entries: [entry("2026-07-02")],
      deadlines: [],
      evidenceItems: [evidenceItem("Photo — img.jpg", "evidence_coverage", { checked: true, file_id: null })],
      files: [],
    },
  },
  {
    name: "Mixed — early-stage, just started",
    input: {
      claim: claim({ dateOfLoss: "2026-07-18" }),
      entries: [],
      deadlines: [],
      evidenceItems: [],
      files: [],
    },
  },
  {
    name: "Mixed — fire claim, strong evidence, weak paperwork",
    input: {
      claim: claim({ dateOfLoss: "2026-04-01", damageCategory: "Fire" }),
      entries: [entry("2026-04-02"), entry("2026-04-10"), entry("2026-04-20")],
      deadlines: [deadline("Sworn statement in proof of loss", "2026-08-15")],
      evidenceItems: [
        evidenceItem("Smoke damage, living room", "evidence_coverage", { file_id: "fi1" }),
        evidenceItem("Soot damage, kitchen", "evidence_coverage", { file_id: "fi2" }),
        evidenceItem("Structural assessment", "evidence_coverage", { file_id: "fi3" }),
        evidenceItem("Itemized contents loss", "documentation_completeness", { checked: false, file_id: null }),
      ],
      files: [file("fi1"), file("fi2"), file("fi3")],
    },
  },
  {
    name: "Mixed — theft claim with police report, no photos",
    input: {
      claim: claim({ dateOfLoss: "2026-06-20", damageCategory: "Theft" }),
      entries: [entry("2026-06-20"), entry("2026-06-21")],
      deadlines: [],
      evidenceItems: [
        evidenceItem("Police report", "documentation_completeness", { file_id: "th1" }),
        evidenceItem("Itemized loss list", "documentation_completeness", { file_id: "th2" }),
      ],
      files: [file("th1"), file("th2")],
    },
  },
  {
    name: "Mixed — offer on the table, payment logged and backed",
    input: {
      claim: claim({ dateOfLoss: "2026-04-01", offerAmount: 22000 }),
      entries: [
        entry("2026-04-05"),
        entry("2026-04-15"),
        entry("2026-06-01", { type: "payment", created_at: "2026-06-01T00:00:00Z" }),
      ],
      deadlines: [deadline("Suit limitation deadline", "2026-10-01")],
      evidenceItems: [
        evidenceItem("Damage photos", "evidence_coverage", { file_id: "p1" }),
        evidenceItem("Settlement letter", "documentation_completeness", { file_id: "p2", created_at: "2026-06-02" }),
      ],
      files: [file("p1"), file("p2", { uploaded_at: "2026-06-02" })],
    },
  },
  {
    name: "Mixed — offer on the table, payment logged but unbacked",
    input: {
      claim: claim({ dateOfLoss: "2026-04-01", offerAmount: 22000 }),
      entries: [entry("2026-04-05"), entry("2026-06-01", { type: "payment", created_at: "2026-06-01T00:00:00Z" })],
      deadlines: [],
      evidenceItems: [evidenceItem("Damage photos", "evidence_coverage", { file_id: "p3" })],
      files: [file("p3")],
    },
  },
  {
    name: "Mixed — long gap in activity, otherwise solid",
    input: {
      claim: claim({ dateOfLoss: "2026-02-01" }),
      entries: [entry("2026-02-03"), entry("2026-06-01")], // ~118 day gap
      deadlines: [deadline("Suit limitation deadline", "2026-11-01")],
      evidenceItems: [
        evidenceItem("Photos", "evidence_coverage", { file_id: "g1" }),
        evidenceItem("Estimate", "documentation_completeness", { file_id: "g2" }),
      ],
      files: [file("g1"), file("g2")],
    },
  },
  {
    name: "Mixed — no date of loss set, otherwise active",
    input: {
      claim: claim(),
      entries: [entry("2026-07-01"), entry("2026-07-10")],
      deadlines: [deadline("Suit limitation deadline", "2026-09-01")],
      evidenceItems: [evidenceItem("Photos", "evidence_coverage", { file_id: "n1" })],
      files: [file("n1")],
    },
  },
  {
    name: "Mixed — deadline overdue, nothing else tracked",
    input: {
      claim: claim({ dateOfLoss: "2026-03-01" }),
      entries: [],
      deadlines: [deadline("Missed deadline", "2026-07-01")],
      evidenceItems: [],
      files: [],
    },
  },
  {
    name: "Mixed — plumbing claim, moderate documentation",
    input: {
      claim: claim({ dateOfLoss: "2026-06-05", damageCategory: "Water / plumbing" }),
      entries: [entry("2026-06-06"), entry("2026-06-18")],
      deadlines: [deadline("Drying company follow-up", "2026-08-05")],
      evidenceItems: [
        evidenceItem("Point-of-failure photo", "evidence_coverage", { file_id: "pl1" }),
        evidenceItem("Moisture reading documentation", "documentation_completeness", { file_id: "pl2" }),
        evidenceItem("Repair invoice", "documentation_completeness", { checked: false, file_id: null }),
      ],
      files: [file("pl1"), file("pl2")],
    },
  },
  {
    name: "Mixed — heavy evidence, zero paperwork",
    input: {
      claim: claim({ dateOfLoss: "2026-06-01" }),
      entries: [entry("2026-06-02"), entry("2026-06-10"), entry("2026-06-20")],
      deadlines: [],
      evidenceItems: [
        evidenceItem("Wide shot", "evidence_coverage", { file_id: "h1" }),
        evidenceItem("Close-up 1", "evidence_coverage", { file_id: "h2" }),
        evidenceItem("Close-up 2", "evidence_coverage", { file_id: "h3" }),
        evidenceItem("Video walkthrough", "evidence_coverage", { file_id: "h4" }),
      ],
      files: [file("h1"), file("h2"), file("h3"), file("h4")],
    },
  },
  {
    name: "Mixed — heavy paperwork, zero photos",
    input: {
      claim: claim({ dateOfLoss: "2026-06-01" }),
      entries: [entry("2026-06-02")],
      deadlines: [],
      evidenceItems: [
        evidenceItem("Policy", "documentation_completeness", { file_id: "pp1" }),
        evidenceItem("Estimate", "documentation_completeness", { file_id: "pp2" }),
        evidenceItem("Correspondence log", "documentation_completeness", { file_id: "pp3" }),
      ],
      files: [file("pp1"), file("pp2"), file("pp3")],
    },
  },
  {
    name: "Mixed — two deadlines, mixed proximity and activity",
    input: {
      claim: claim({ dateOfLoss: "2026-05-01" }),
      entries: [entry("2026-05-02"), entry("2026-07-18", { created_at: "2026-07-18T00:00:00Z" })],
      deadlines: [deadline("Soon, no recent activity", "2026-07-23"), deadline("Far off", "2027-02-01")],
      evidenceItems: [evidenceItem("Photos", "evidence_coverage", { file_id: "d1" })],
      files: [file("d1")],
    },
  },
  {
    name: "Mixed — mold claim, moderate",
    input: {
      claim: claim({ dateOfLoss: "2026-06-15", damageCategory: "Mold" }),
      entries: [entry("2026-06-16"), entry("2026-06-25")],
      deadlines: [],
      evidenceItems: [
        evidenceItem("Visible mold growth photos", "evidence_coverage", { file_id: "m1" }),
        evidenceItem("Moisture reading documentation", "documentation_completeness", { checked: false, file_id: null }),
      ],
      files: [file("m1")],
    },
  },
  {
    name: "Mixed — very sparse, single stale item",
    input: {
      claim: claim({ dateOfLoss: "2026-05-01" }),
      entries: [],
      deadlines: [],
      evidenceItems: [evidenceItem("Estimate", "documentation_completeness", { checked: false, file_id: null, created_at: "2026-05-01" })],
      files: [],
    },
  },
  {
    name: "Mixed — non-renewal notice context, decent file",
    input: {
      claim: claim({ dateOfLoss: "2026-03-15" }),
      entries: [entry("2026-03-16"), entry("2026-03-25"), entry("2026-04-05")],
      deadlines: [deadline("Suit limitation deadline", "2026-12-01")],
      evidenceItems: [
        evidenceItem("Damage photos", "evidence_coverage", { file_id: "nr1" }),
        evidenceItem("Non-renewal letter", "documentation_completeness", { file_id: "nr2" }),
      ],
      files: [file("nr1"), file("nr2")],
    },
  },
  {
    name: "Mixed — high evidence count, all half-credit (checked, unfiled)",
    input: {
      claim: claim({ dateOfLoss: "2026-06-01" }),
      entries: [entry("2026-06-05")],
      deadlines: [],
      evidenceItems: Array.from({ length: 8 }, (_, i) =>
        evidenceItem(`Item ${i + 1}`, i % 2 === 0 ? "evidence_coverage" : "documentation_completeness", {
          checked: true,
          file_id: null,
        }),
      ),
      files: [],
    },
  },
  {
    name: "Mixed — recently discovered, active within days",
    input: {
      claim: claim({ dateOfLoss: "2026-07-17" }),
      entries: [entry("2026-07-18"), entry("2026-07-19")],
      deadlines: [deadline("Suit limitation deadline", "2026-07-28")],
      evidenceItems: [evidenceItem("Photos", "evidence_coverage", { file_id: "rd1" })],
      files: [file("rd1")],
    },
  },
];

// ---------------------------------------------------------------------
// 5 edge cases
// ---------------------------------------------------------------------

const EDGE_CASES: Fixture[] = [
  { name: "Edge — empty payload", input: emptyInput() },
  {
    name: "Edge — single field only (date of loss, nothing else)",
    input: emptyInput({ claim: claim({ dateOfLoss: "2026-06-01" }) }),
  },
  {
    name: "Edge — malformed dates throughout",
    input: {
      claim: claim({ dateOfLoss: "not-a-real-date" }),
      entries: [entry("also-not-a-date", { created_at: "still-not-a-date" })],
      deadlines: [deadline("Malformed", "2026-13-45")],
      evidenceItems: [evidenceItem("Item", "evidence_coverage", { created_at: "nonsense" })],
      files: [],
    },
  },
  {
    name: "Edge — oversized inputs (500 evidence items, 100 entries)",
    input: {
      claim: claim({ dateOfLoss: "2026-01-01" }),
      entries: Array.from({ length: 100 }, (_, i) => entry(`2026-0${(i % 9) + 1}-15`)),
      deadlines: Array.from({ length: 20 }, (_, i) => deadline(`Deadline ${i}`, "2026-12-01")),
      evidenceItems: Array.from({ length: 500 }, (_, i) =>
        evidenceItem(`Bulk item ${i}`, i % 2 === 0 ? "evidence_coverage" : "documentation_completeness", {
          file_id: i % 3 === 0 ? `bulk-${i}` : null,
          checked: i % 3 !== 2,
        }),
      ),
      files: Array.from({ length: 200 }, (_, i) => file(`bulk-${i}`)),
    },
  },
  {
    name: "Edge — unexpected nulls/undefined-shaped data",
    input: {
      claim: { dateOfLoss: null, damageCategory: null, offerAmount: null },
      entries: [{ type: "", date: "", created_at: "" } as DocumentationScoreEntry],
      deadlines: [{ title: "", due_date: "", created_at: "" } as DocumentationScoreDeadline],
      evidenceItems: [
        { label: "", checked: false, file_id: null, category: null, created_at: "" } as DocumentationScoreEvidenceItem,
      ],
      files: [],
    },
  },
];

// ---------------------------------------------------------------------
// Remainder — 10 more realistic variations to reach 50
// (1 complete + 7 near-complete + 7 partial + 20 mixed + 5 edge = 40)
// ---------------------------------------------------------------------

const REMAINDER: Fixture[] = [
  {
    name: "Variation — everything present but all checklist items auto-labeled",
    input: {
      ...COMPLETE_INPUT,
      evidenceItems: COMPLETE_INPUT.evidenceItems.map((i, idx) => ({ ...i, label: `Photo — img${idx}.jpg` })),
    },
  },
  {
    name: "Variation — three deadlines, all far off",
    input: {
      ...COMPLETE_INPUT,
      deadlines: [deadline("A", "2027-01-01"), deadline("B", "2027-03-01"), deadline("C", "2027-06-01")],
    },
  },
  {
    name: "Variation — claim with damage category but no other change",
    input: { ...COMPLETE_INPUT, claim: { ...COMPLETE_INPUT.claim, damageCategory: "Wind / storm" } },
  },
  {
    name: "Variation — evidence items present, zero files uploaded",
    input: {
      claim: claim({ dateOfLoss: "2026-06-01" }),
      entries: [entry("2026-06-05")],
      deadlines: [],
      evidenceItems: [
        evidenceItem("Photo pending upload", "evidence_coverage", { checked: false, file_id: null }),
        evidenceItem("Estimate pending upload", "documentation_completeness", { checked: false, file_id: null }),
      ],
      files: [],
    },
  },
  {
    name: "Variation — files uploaded, no checklist items at all",
    input: {
      claim: claim({ dateOfLoss: "2026-06-01" }),
      entries: [entry("2026-06-05")],
      deadlines: [],
      evidenceItems: [],
      files: [file("orphan-1"), file("orphan-2")],
    },
  },
  {
    name: "Variation — single evidence item, fully filed",
    input: emptyInput({
      claim: claim({ dateOfLoss: "2026-06-01" }),
      evidenceItems: [evidenceItem("One good photo", "evidence_coverage", { file_id: "s1" })],
      files: [file("s1")],
    }),
  },
  {
    name: "Variation — two entries exactly 14 days apart (boundary)",
    input: emptyInput({
      claim: claim({ dateOfLoss: "2026-06-01" }),
      entries: [entry("2026-06-01"), entry("2026-06-15")],
    }),
  },
  {
    name: "Variation — two entries exactly 15 days apart (just over boundary)",
    input: emptyInput({
      claim: claim({ dateOfLoss: "2026-06-01" }),
      entries: [entry("2026-06-01"), entry("2026-06-16")],
    }),
  },
  {
    name: "Variation — deadline exactly 90 days out (boundary)",
    input: emptyInput({ deadlines: [deadline("Boundary", "2026-10-19")] }),
  },
  {
    name: "Variation — deadline exactly 91 days out (just over boundary)",
    input: emptyInput({ deadlines: [deadline("Boundary+1", "2026-10-20")] }),
  },
];

// ---------------------------------------------------------------------
// The full 50
// ---------------------------------------------------------------------

const ALL_FIXTURES: Fixture[] = [
  { name: "Complete — fully documented claim", input: COMPLETE_INPUT },
  ...NEAR_COMPLETE,
  ...PARTIAL,
  ...MIXED,
  ...EDGE_CASES,
  ...REMAINDER,
];

// ---------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------

describe("Documentation Score — 50-case fixture suite", () => {
  it("has exactly 50 fixtures", () => {
    expect(ALL_FIXTURES.length).toBe(50);
  });

  it("REPORT — prints the full fixture table (name, 7 subscores, total, grade)", () => {
    const rows = ALL_FIXTURES.map(({ name, input }) => {
      const r = computeDocumentationScore(input, NOW);
      return {
        name,
        evidenceCoverage: r.categories.evidenceCoverage.points,
        documentationCompleteness: r.categories.documentationCompleteness.points,
        timelineIntegrity: r.categories.timelineIntegrity.points,
        evidenceQualityOrganization: r.categories.evidenceQualityOrganization.points,
        deadlineReadiness: r.categories.deadlineReadiness.points,
        consistencyAnalysis: r.categories.consistencyAnalysis.points,
        claimReadiness: r.categories.claimReadiness.points,
        total: r.total,
        grade: r.grade,
      };
    });
    console.log(JSON.stringify(rows, null, 2));
    expect(rows.length).toBe(50);
  });

  it("assertion: empty payload — grades F (total is 11, not 0, and that's correct)", () => {
    const result = computeDocumentationScore(emptyInput(), NOW);
    // Consistency Analysis scores full (10/10) on empty data -- there is
    // nothing to be inconsistent about, which is correct, not a bug.
    // Claim Readiness derives round(5 * 10/95) = 1 from that alone. Total
    // is 11, not 0. Grade is still F. This is the actual, verified
    // behavior (documentationScore.test.ts already asserts the same
    // total) -- the suite tests reality, not the literal "scores 0"
    // wording.
    expect(result.total).toBe(11);
    expect(result.grade).toBe("F");
    expect(result.categories.evidenceCoverage.points).toBe(0);
    expect(result.categories.documentationCompleteness.points).toBe(0);
    expect(result.categories.timelineIntegrity.points).toBe(0);
    expect(result.categories.evidenceQualityOrganization.points).toBe(0);
    expect(result.categories.deadlineReadiness.points).toBe(0);
  });

  it("assertion: the complete claim scores near maximum and grades A", () => {
    const result = computeDocumentationScore(COMPLETE_INPUT, NOW);
    expect(result.total).toBeGreaterThanOrEqual(90);
    expect(result.grade).toBe("A");
  });

  describe("assertion: category isolation (six independent categories)", () => {
    // Surgical isolation, decoupled from the "near-complete" fixtures
    // above (which use the literal, realistic empty-input case and can
    // therefore perturb a second category through a genuinely shared
    // input -- e.g. removing all entries affects both Timeline Integrity
    // AND Deadline Readiness/Consistency Analysis, which read entries too).
    // This block instead changes exactly one field at a time so only the
    // intended category can move, proving the point math itself doesn't
    // leak across categories -- independent of what a realistic UI action
    // would touch.
    const independent: CategoryKey[] = [
      "evidenceCoverage",
      "documentationCompleteness",
      "timelineIntegrity",
      "evidenceQualityOrganization",
      "deadlineReadiness",
      "consistencyAnalysis",
    ];

    // Real finding from an earlier run of this suite: evidenceItems feeds
    // THREE categories, not two -- Evidence Coverage, Documentation
    // Completeness, AND Evidence Quality & Organization (which measures
    // what fraction of uploaded files are still linked to a checklist
    // item). Removing a category's items while leaving their linked files
    // in place orphans those files, which correctly drops Evidence
    // Quality & Organization too -- a file with nothing pointing to it is
    // a real organization gap, not a scoring leak. To isolate Evidence
    // Coverage specifically, the now-unreferenced files (f1-f3) are
    // removed along with their items, same as a user actually deleting
    // that evidence rather than just un-tagging it.
    it("removing Evidence Coverage only moves Evidence Coverage (and Claim Readiness, expected)", () => {
      const before = computeDocumentationScore(COMPLETE_INPUT, NOW);
      const after = computeDocumentationScore(
        {
          ...COMPLETE_INPUT,
          evidenceItems: COMPLETE_DOC_COMPLETENESS,
          files: COMPLETE_FILES.filter((f) => !["f1", "f2", "f3"].includes(f.id)),
        },
        NOW,
      );
      expect(after.categories.evidenceCoverage.points).toBeLessThan(before.categories.evidenceCoverage.points);
      for (const key of independent) {
        if (key === "evidenceCoverage") continue;
        expect(after.categories[key].points).toBe(before.categories[key].points);
      }
      // Claim Readiness is expected to move here -- it's derived from
      // Evidence Coverage's own points. The precise, correct-value check
      // for that derivation lives in its own dedicated test below, not
      // repeated in every isolation case.
    });

    it("removing Documentation Completeness only moves Documentation Completeness", () => {
      const before = computeDocumentationScore(COMPLETE_INPUT, NOW);
      const after = computeDocumentationScore(
        {
          ...COMPLETE_INPUT,
          evidenceItems: COMPLETE_EVIDENCE_COVERAGE,
          files: COMPLETE_FILES.filter((f) => !["f4", "f5", "f6"].includes(f.id)),
        },
        NOW,
      );
      expect(after.categories.documentationCompleteness.points).toBeLessThan(
        before.categories.documentationCompleteness.points,
      );
      for (const key of independent) {
        if (key === "documentationCompleteness") continue;
        expect(after.categories[key].points).toBe(before.categories[key].points);
      }
    });

    it("documented coupling: un-tagging Evidence Coverage items WITHOUT removing their files also drops Evidence Quality & Organization (not a leak -- an orphaned file is a real organization gap)", () => {
      const before = computeDocumentationScore(COMPLETE_INPUT, NOW);
      const after = computeDocumentationScore(
        { ...COMPLETE_INPUT, evidenceItems: COMPLETE_DOC_COMPLETENESS }, // files left in place, unlike the isolated test above
        NOW,
      );
      expect(after.categories.evidenceCoverage.points).toBeLessThan(before.categories.evidenceCoverage.points);
      expect(after.categories.evidenceQualityOrganization.points).toBeLessThan(
        before.categories.evidenceQualityOrganization.points,
      );
      // Every other category is still genuinely unaffected.
      for (const key of ["documentationCompleteness", "timelineIntegrity", "deadlineReadiness", "consistencyAnalysis"] as CategoryKey[]) {
        expect(after.categories[key].points).toBe(before.categories[key].points);
      }
    });

    it("degrading Timeline Integrity via date-only changes moves only Timeline Integrity", () => {
      // Same entries, same created_at (deadline/consistency untouched),
      // only `date` values spread into a >60 day gap.
      const before = computeDocumentationScore(COMPLETE_INPUT, NOW);
      const after = computeDocumentationScore(
        {
          ...COMPLETE_INPUT,
          entries: COMPLETE_ENTRIES.map((e, i) => ({
            ...e,
            date: i === 0 ? "2026-01-01" : e.date, // blows the gap open, created_at untouched
          })),
        },
        NOW,
      );
      expect(after.categories.timelineIntegrity.points).toBeLessThan(before.categories.timelineIntegrity.points);
      for (const key of independent) {
        if (key === "timelineIntegrity") continue;
        expect(after.categories[key].points).toBe(before.categories[key].points);
      }
    });

    it("removing Evidence Quality & Organization inputs only moves that category", () => {
      const before = computeDocumentationScore(COMPLETE_INPUT, NOW);
      const after = computeDocumentationScore({ ...COMPLETE_INPUT, evidenceItems: [], files: [] }, NOW);
      expect(after.categories.evidenceQualityOrganization.points).toBeLessThan(
        before.categories.evidenceQualityOrganization.points,
      );
      // evidenceItems also feeds evidenceCoverage/documentationCompleteness
      // directly -- this change is NOT isolated in the realistic sense
      // (both checklist categories correctly drop to 0 too). Documented,
      // not hidden: evidenceItems is a genuinely shared input across three
      // categories, same as entries is shared across three others.
      expect(after.categories.evidenceCoverage.points).toBe(0);
      expect(after.categories.documentationCompleteness.points).toBe(0);
      for (const key of ["timelineIntegrity", "deadlineReadiness", "consistencyAnalysis"] as CategoryKey[]) {
        expect(after.categories[key].points).toBe(before.categories[key].points);
      }
    });

    it("removing Deadline Readiness inputs moves Deadline Readiness and Consistency Analysis (shared: checkDeadlineWithoutActivity/KeywordGap read deadlines too)", () => {
      const before = computeDocumentationScore(COMPLETE_INPUT, NOW);
      const after = computeDocumentationScore({ ...COMPLETE_INPUT, deadlines: [] }, NOW);
      expect(after.categories.deadlineReadiness.points).toBeLessThan(before.categories.deadlineReadiness.points);
      for (const key of ["evidenceCoverage", "documentationCompleteness", "timelineIntegrity", "evidenceQualityOrganization"] as CategoryKey[]) {
        expect(after.categories[key].points).toBe(before.categories[key].points);
      }
    });

    it("degrading Consistency Analysis via claim/entry additions moves only Consistency Analysis", () => {
      // Adds an offer with no payment -- claim.offerAmount is read only by
      // checkOfferWithoutPayment; nothing else in the engine reads it.
      const before = computeDocumentationScore(COMPLETE_INPUT, NOW);
      const after = computeDocumentationScore(
        { ...COMPLETE_INPUT, claim: { ...COMPLETE_INPUT.claim, offerAmount: 15000 } },
        NOW,
      );
      expect(after.categories.consistencyAnalysis.points).toBeLessThan(before.categories.consistencyAnalysis.points);
      for (const key of independent) {
        if (key === "consistencyAnalysis") continue;
        expect(after.categories[key].points).toBe(before.categories[key].points);
      }
    });

    it("Claim Readiness has no independent input to isolate -- its movement on every other change above is the documented, correct behavior, not a leak", () => {
      const before = computeDocumentationScore(COMPLETE_INPUT, NOW);
      const after = computeDocumentationScore(
        { ...COMPLETE_INPUT, evidenceItems: COMPLETE_DOC_COMPLETENESS },
        NOW,
      );
      const otherKeys: CategoryKey[] = [
        "evidenceCoverage",
        "documentationCompleteness",
        "timelineIntegrity",
        "evidenceQualityOrganization",
        "deadlineReadiness",
        "consistencyAnalysis",
      ];
      const otherEarned = otherKeys.reduce((sum, k) => sum + after.categories[k].points, 0);
      const otherMax = otherKeys.reduce((sum, k) => sum + after.categories[k].max, 0);
      const expectedClaimReadiness = Math.round(5 * (otherEarned / otherMax));
      expect(after.categories.claimReadiness.points).toBe(expectedClaimReadiness);
      expect(after.categories.claimReadiness.points).not.toBe(before.categories.claimReadiness.points);
    });
  });

  describe("assertion: monotonicity — adding documentation never lowers a score", () => {
    it("adding a filed evidence item never lowers Evidence Coverage or the total", () => {
      const before = computeDocumentationScore(emptyInput({ claim: claim({ dateOfLoss: "2026-06-01" }) }), NOW);
      const after = computeDocumentationScore(
        emptyInput({
          claim: claim({ dateOfLoss: "2026-06-01" }),
          evidenceItems: [evidenceItem("Photo", "evidence_coverage", { file_id: "m1" })],
          files: [file("m1")],
        }),
        NOW,
      );
      expect(after.categories.evidenceCoverage.points).toBeGreaterThanOrEqual(before.categories.evidenceCoverage.points);
      expect(after.total).toBeGreaterThanOrEqual(before.total);
    });

    it("adding a second, better-spaced entry never lowers Timeline Integrity", () => {
      const before = computeDocumentationScore(
        emptyInput({ claim: claim({ dateOfLoss: "2026-06-01" }), entries: [entry("2026-06-01")] }),
        NOW,
      );
      const after = computeDocumentationScore(
        emptyInput({
          claim: claim({ dateOfLoss: "2026-06-01" }),
          entries: [entry("2026-06-01"), entry("2026-06-05")],
        }),
        NOW,
      );
      expect(after.categories.timelineIntegrity.points).toBeGreaterThanOrEqual(before.categories.timelineIntegrity.points);
    });

    it("filing an already-checked item never lowers Evidence Coverage", () => {
      const before = computeDocumentationScore(
        emptyInput({
          evidenceItems: [evidenceItem("Photo", "evidence_coverage", { checked: true, file_id: null })],
        }),
        NOW,
      );
      const after = computeDocumentationScore(
        emptyInput({
          evidenceItems: [evidenceItem("Photo", "evidence_coverage", { checked: true, file_id: "m2" })],
          files: [file("m2")],
        }),
        NOW,
      );
      expect(after.categories.evidenceCoverage.points).toBeGreaterThanOrEqual(before.categories.evidenceCoverage.points);
    });

    it("across the full progression from empty to complete, the total is non-decreasing at every step", () => {
      const steps: DocumentationScoreInput[] = [
        emptyInput({ claim: claim({ dateOfLoss: "2026-06-01" }) }),
        emptyInput({ claim: claim({ dateOfLoss: "2026-06-01" }), entries: COMPLETE_ENTRIES }),
        emptyInput({ claim: claim({ dateOfLoss: "2026-06-01" }), entries: COMPLETE_ENTRIES, deadlines: COMPLETE_DEADLINES }),
        emptyInput({
          claim: claim({ dateOfLoss: "2026-06-01" }),
          entries: COMPLETE_ENTRIES,
          deadlines: COMPLETE_DEADLINES,
          evidenceItems: COMPLETE_EVIDENCE_COVERAGE,
          files: COMPLETE_FILES.slice(0, 3),
        }),
        COMPLETE_INPUT,
      ];
      const totals = steps.map((s) => computeDocumentationScore(s, NOW).total);
      for (let i = 1; i < totals.length; i++) {
        expect(totals[i]).toBeGreaterThanOrEqual(totals[i - 1]);
      }
    });
  });

  it("assertion: range — all five letter grades (A-F) appear across the 50 fixtures", () => {
    const grades = new Set(ALL_FIXTURES.map(({ input }) => computeDocumentationScore(input, NOW).grade));
    expect(Array.from(grades).sort()).toEqual(["A", "B", "C", "D", "F"]);
  });

  it("assertion: edge cases return a valid score without throwing", () => {
    for (const { name, input } of EDGE_CASES) {
      expect(() => computeDocumentationScore(input, NOW), name).not.toThrow();
      const result = computeDocumentationScore(input, NOW);
      expect(result.total, name).toBeGreaterThanOrEqual(0);
      expect(result.total, name).toBeLessThanOrEqual(100);
      expect(["A", "B", "C", "D", "F"], name).toContain(result.grade);
      for (const key of Object.keys(result.categories) as CategoryKey[]) {
        expect(result.categories[key].points, `${name} — ${key}`).toBeGreaterThanOrEqual(0);
        expect(result.categories[key].points, `${name} — ${key}`).toBeLessThanOrEqual(result.categories[key].max);
      }
    }
  });
});
