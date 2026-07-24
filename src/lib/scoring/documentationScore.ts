// Documentation Score™ — deterministic 7-category scoring engine.
// Decision Log #40. Server-side only, same invariant as claimHealth.ts and
// the Grader (Decision #7/#9/#25): "deterministic score, AI narrative —
// split," "AI explains, never decides." Never predicts, estimates, or
// implies claim approval/denial/payment likelihood, and never evaluates
// carrier conduct or legal merit — that boundary constrains every
// recommendation string produced below, not just public copy.
//
// CONFIDENTIALITY RULE — enforced by type, not just convention:
// `computeDocumentationScore()` returns full category weights/maxes/raw
// point math. That result must NEVER be passed to a Client Component or
// serialized into an API response a browser can read. Anything reaching
// the client MUST go through `toClientView()`, which strips weights,
// maxes, and raw points down to a status label and ordinal recommendation
// priority. If you're wiring this into a page or route, import
// `DocumentationScoreClientView`, not `DocumentationScoreResult`.
//
// Pure functions of already-fetched rows — no DB/network access here, same
// pattern as claimHealth.ts, directly unit-testable in isolation.

import { claimTypeProfile, type ClaimTypeProfile, type EvidenceCategory } from "./claimTypeProfile";

export type { ClaimTypeProfile, EvidenceCategory };
export { claimTypeProfile };

export type DocumentationScoreClaim = {
  dateOfLoss: string | null;
  damageCategory: string | null;
  offerAmount: number | null;
};

export type DocumentationScoreEntry = {
  type: string;
  date: string;
  created_at: string;
};

export type DocumentationScoreDeadline = {
  title: string;
  due_date: string;
  created_at: string;
};

export type DocumentationScoreFile = {
  id: string;
  kind: string;
  original_name: string;
  uploaded_at: string;
};

export type DocumentationScoreEvidenceItem = {
  label: string;
  checked: boolean;
  file_id: string | null;
  category: EvidenceCategory | null;
  created_at: string;
};

export type DocumentationScoreInput = {
  claim: DocumentationScoreClaim;
  entries: DocumentationScoreEntry[];
  deadlines: DocumentationScoreDeadline[];
  evidenceItems: DocumentationScoreEvidenceItem[];
  files: DocumentationScoreFile[];
};

export type CategoryKey =
  | "evidenceCoverage"
  | "documentationCompleteness"
  | "timelineIntegrity"
  | "evidenceQualityOrganization"
  | "deadlineReadiness"
  | "consistencyAnalysis"
  | "claimReadiness";

// Fixed order, matches the methodology's own listing — used for
// deterministic tie-breaking in recommendation prioritization, never
// exposed to the client as a ranking of "importance."
const CATEGORY_ORDER: CategoryKey[] = [
  "evidenceCoverage",
  "documentationCompleteness",
  "timelineIntegrity",
  "evidenceQualityOrganization",
  "deadlineReadiness",
  "consistencyAnalysis",
  "claimReadiness",
];

// Official category names — verbatim, never paraphrased, per founder
// instruction. Used in the client view only; the engine itself keys off
// CategoryKey internally.
const CATEGORY_LABELS: Record<CategoryKey, string> = {
  evidenceCoverage: "Evidence Coverage",
  documentationCompleteness: "Documentation Completeness",
  timelineIntegrity: "Timeline Integrity",
  evidenceQualityOrganization: "Evidence Quality & Organization",
  deadlineReadiness: "Deadline Readiness",
  consistencyAnalysis: "Consistency Analysis",
  claimReadiness: "Claim Readiness",
};

export type Gap = {
  description: string;
  pointsRecoverable: number;
};

export type CategoryResult = {
  points: number;
  max: number;
  gaps: Gap[];
};

export type DocumentationScoreResult = {
  total: number;
  grade: "A" | "B" | "C" | "D" | "F";
  profile: ClaimTypeProfile;
  categories: Record<CategoryKey, CategoryResult>;
  recommendations: (Gap & { categoryKey: CategoryKey })[];
};

export type DocumentationScoreClientView = {
  total: number;
  grade: "A" | "B" | "C" | "D" | "F";
  categories: {
    key: CategoryKey;
    label: string;
    status: "strong" | "solid" | "needs_attention" | "critical_gap";
  }[];
  recommendations: {
    description: string;
    priority: "high" | "medium" | "low";
  }[];
};

// ---------------------------------------------------------------------
// Category maxes — server-only. Never send this object, or any of the
// per-category `max`/`points` values below, to a browser.
// ---------------------------------------------------------------------

const MAX = {
  evidenceCoverage: 25,
  documentationCompleteness: 20,
  timelineIntegrity: 15,
  evidenceQualityOrganization: 15,
  deadlineReadiness: 10,
  consistencyAnalysis: 10,
  claimReadiness: 5,
} as const;

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

// ---------------------------------------------------------------------
// 2.1 / 2.2 — Evidence Coverage / Documentation Completeness
// ---------------------------------------------------------------------

function scoreChecklistCategory(
  items: DocumentationScoreEvidenceItem[],
  category: EvidenceCategory,
  max: number,
  categoryLabel: string,
): CategoryResult {
  const tagged = items.filter((i) => i.category === category);

  if (tagged.length === 0) {
    return {
      points: 0,
      max,
      gaps: [{
        description: `Add and check off evidence checklist items to improve ${categoryLabel}`,
        pointsRecoverable: max,
      }],
    };
  }

  const perItem = max / tagged.length;
  let points = 0;
  const gaps: Gap[] = [];

  for (const item of tagged) {
    if (item.file_id) {
      points += perItem;
    } else if (item.checked) {
      points += perItem * 0.5;
      gaps.push({
        description: `"${item.label}" is checked but has no file attached`,
        pointsRecoverable: perItem * 0.5,
      });
    } else {
      gaps.push({ description: `Missing: ${item.label}`, pointsRecoverable: perItem });
    }
  }

  return { points: Math.round(points), max, gaps };
}

// ---------------------------------------------------------------------
// 2.3 — Timeline Integrity
// ---------------------------------------------------------------------

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function scoreTimelineIntegrity(
  claim: DocumentationScoreClaim,
  entries: DocumentationScoreEntry[],
): CategoryResult {
  const max = MAX.timelineIntegrity;

  if (entries.length === 0) {
    return {
      points: 0,
      max,
      gaps: [{ description: "Log a claim timeline entry to improve Timeline Integrity", pointsRecoverable: max }],
    };
  }

  const points_in_time = [
    ...(claim.dateOfLoss ? [new Date(claim.dateOfLoss).getTime()] : []),
    ...entries.map((e) => new Date(e.date).getTime()),
  ]
    .filter((t) => !Number.isNaN(t))
    .sort((a, b) => a - b);

  let maxGapDays = 0;
  for (let i = 1; i < points_in_time.length; i++) {
    const gapDays = (points_in_time[i] - points_in_time[i - 1]) / MS_PER_DAY;
    if (gapDays > maxGapDays) maxGapDays = gapDays;
  }

  let deduction = 0;
  if (maxGapDays > 60) deduction = 12;
  else if (maxGapDays > 30) deduction = 7;
  else if (maxGapDays > 14) deduction = 3;

  if (!claim.dateOfLoss) deduction += 3;

  const points = clamp(max - deduction, 0, max);
  const gaps: Gap[] = [];
  if (!claim.dateOfLoss) {
    gaps.push({ description: "Date of loss isn't set — the timeline can't be anchored", pointsRecoverable: 3 });
  }
  if (maxGapDays > 14) {
    gaps.push({
      description: `Largest gap between logged activity: ${Math.round(maxGapDays)} days`,
      pointsRecoverable: deduction - (!claim.dateOfLoss ? 3 : 0),
    });
  }

  return { points, max, gaps };
}

// ---------------------------------------------------------------------
// 2.4 — Evidence Quality & Organization (v1 proxy — see engineering spec)
// ---------------------------------------------------------------------

const AUTO_GENERATED_LABEL_PATTERN = /^(Photo|PDF|Document) — .+$/;

function scoreEvidenceQualityOrganization(
  items: DocumentationScoreEvidenceItem[],
  files: DocumentationScoreFile[],
): CategoryResult {
  const max = MAX.evidenceQualityOrganization;
  const linkedMax = 10;
  const labeledMax = 5;

  if (files.length === 0 && items.length === 0) {
    return {
      points: 0,
      max,
      gaps: [{
        description: "Upload evidence or check off a checklist item to improve Evidence Quality & Organization",
        pointsRecoverable: max,
      }],
    };
  }

  const linkedFileIds = new Set(items.map((i) => i.file_id).filter((id): id is string => Boolean(id)));
  const linkedFraction = files.length > 0 ? files.filter((f) => linkedFileIds.has(f.id)).length / files.length : 1;
  const labeledFraction =
    items.length > 0 ? items.filter((i) => !AUTO_GENERATED_LABEL_PATTERN.test(i.label)).length / items.length : 1;

  const linkedPoints = linkedMax * linkedFraction;
  const labeledPoints = labeledMax * labeledFraction;

  const gaps: Gap[] = [];
  if (files.length > 0 && linkedFraction < 1) {
    gaps.push({
      description: "Some uploaded files aren't linked to a checklist item",
      pointsRecoverable: linkedMax - linkedPoints,
    });
  }
  if (items.length > 0 && labeledFraction < 1) {
    gaps.push({
      description: "Some checklist items still use the default upload label — add a real description",
      pointsRecoverable: labeledMax - labeledPoints,
    });
  }

  return { points: Math.round(linkedPoints + labeledPoints), max, gaps };
}

// ---------------------------------------------------------------------
// 2.5 — Deadline Readiness (decay + recovery)
// ---------------------------------------------------------------------

function scoreDeadlineReadiness(
  deadlines: DocumentationScoreDeadline[],
  entries: DocumentationScoreEntry[],
  now: Date,
): CategoryResult {
  const max = MAX.deadlineReadiness;

  if (deadlines.length === 0) {
    return {
      points: 0,
      max,
      gaps: [{ description: "Track a deadline to improve Deadline Readiness", pointsRecoverable: max }],
    };
  }

  const entryTimes = entries.map((e) => new Date(e.created_at).getTime()).filter((t) => !Number.isNaN(t));
  const hasRecentActivity = (days: number) => {
    const cutoff = now.getTime() - days * MS_PER_DAY;
    return entryTimes.some((t) => t >= cutoff);
  };

  let totalCredit = 0;
  const gaps: Gap[] = [];
  const perDeadlineMax = max / deadlines.length;

  for (const d of deadlines) {
    const daysUntilDue = (new Date(d.due_date).getTime() - now.getTime()) / MS_PER_DAY;
    let credit: number;
    if (daysUntilDue < 0) credit = 0;
    else if (daysUntilDue <= 7) credit = hasRecentActivity(3) ? 0.7 : 0.2;
    else if (daysUntilDue <= 14) credit = hasRecentActivity(7) ? 0.8 : 0.4;
    else if (daysUntilDue <= 30) credit = hasRecentActivity(14) ? 0.9 : 0.6;
    else if (daysUntilDue <= 90) credit = 0.8;
    else credit = 1;

    totalCredit += credit;
    if (credit < 1) {
      gaps.push({
        description: `"${d.title}" needs attention (due ${d.due_date})`,
        pointsRecoverable: (1 - credit) * perDeadlineMax,
      });
    }
  }

  const points = Math.round(max * (totalCredit / deadlines.length));
  return { points, max, gaps };
}

// ---------------------------------------------------------------------
// 2.6 — Consistency Analysis (structural, deterministic — no NLP/AI)
// ---------------------------------------------------------------------

const BASELINE_CONSISTENCY_KEYWORDS = ["estimate", "proof of loss", "appraisal", "inspection"];

const PROFILE_CONSISTENCY_KEYWORDS: Record<ClaimTypeProfile, string[]> = {
  Water: ["moisture", "drying"],
  WindHail: ["roof", "storm", "weather"],
  Fire: ["inventory", "soot", "structural"],
  Theft: ["police", "ownership"],
  Plumbing: ["point of failure", "repair"],
  Other: [],
};

function keywordsForProfile(profile: ClaimTypeProfile): string[] {
  return [...BASELINE_CONSISTENCY_KEYWORDS, ...PROFILE_CONSISTENCY_KEYWORDS[profile]];
}

function checkPaymentBacked(
  entries: DocumentationScoreEntry[],
  evidenceItems: DocumentationScoreEvidenceItem[],
  files: DocumentationScoreFile[],
): boolean {
  const window = 7 * MS_PER_DAY;
  return entries
    .filter((e) => e.type === "payment")
    .some((p) => {
      const paymentTime = new Date(p.created_at).getTime();
      const hasNearbyFile = files.some((f) => Math.abs(new Date(f.uploaded_at).getTime() - paymentTime) <= window);
      const hasNearbyItem = evidenceItems.some(
        (i) => Math.abs(new Date(i.created_at).getTime() - paymentTime) <= window,
      );
      return !hasNearbyFile && !hasNearbyItem;
    });
}

function checkDeadlineKeywordGap(
  deadlines: DocumentationScoreDeadline[],
  evidenceItems: DocumentationScoreEvidenceItem[],
  profile: ClaimTypeProfile,
): boolean {
  const keywords = keywordsForProfile(profile);
  return deadlines.some((d) => {
    const titleLower = d.title.toLowerCase();
    const matchedKeyword = keywords.find((k) => titleLower.includes(k));
    if (!matchedKeyword) return false;
    const hasCheckedMatch = evidenceItems.some(
      (i) => i.checked && i.label.toLowerCase().includes(matchedKeyword),
    );
    return !hasCheckedMatch;
  });
}

function checkStaleRequiredDoc(
  claim: DocumentationScoreClaim,
  evidenceItems: DocumentationScoreEvidenceItem[],
  now: Date,
): boolean {
  if (!claim.dateOfLoss) return false;
  const daysSinceLoss = (now.getTime() - new Date(claim.dateOfLoss).getTime()) / MS_PER_DAY;
  if (daysSinceLoss < 30) return false;
  return evidenceItems.some((i) => i.category === "documentation_completeness" && !i.file_id && !i.checked);
}

function checkDeadlineWithoutActivity(
  deadlines: DocumentationScoreDeadline[],
  entries: DocumentationScoreEntry[],
): boolean {
  if (deadlines.length === 0) return false;
  const window = 14 * MS_PER_DAY;
  return deadlines.some((d) => {
    const due = new Date(d.due_date).getTime();
    return !entries.some((e) => Math.abs(new Date(e.created_at).getTime() - due) <= window);
  });
}

function checkOfferWithoutPayment(claim: DocumentationScoreClaim, entries: DocumentationScoreEntry[]): boolean {
  if (claim.offerAmount === null || claim.offerAmount === undefined) return false;
  return !entries.some((e) => e.type === "payment");
}

function scoreConsistencyAnalysis(
  claim: DocumentationScoreClaim,
  entries: DocumentationScoreEntry[],
  deadlines: DocumentationScoreDeadline[],
  evidenceItems: DocumentationScoreEvidenceItem[],
  files: DocumentationScoreFile[],
  profile: ClaimTypeProfile,
  now: Date,
): CategoryResult {
  const max = MAX.consistencyAnalysis;
  const deductionPerCheck = 2;
  const gaps: Gap[] = [];

  if (checkPaymentBacked(entries, evidenceItems, files)) {
    gaps.push({
      description: "A payment was logged without supporting documentation nearby",
      pointsRecoverable: deductionPerCheck,
    });
  }
  if (checkDeadlineKeywordGap(deadlines, evidenceItems, profile)) {
    gaps.push({
      description: "A tracked deadline references a document type that hasn't been checked off",
      pointsRecoverable: deductionPerCheck,
    });
  }
  if (checkStaleRequiredDoc(claim, evidenceItems, now)) {
    gaps.push({
      description: "A required document has been outstanding for 30+ days since the date of loss",
      pointsRecoverable: deductionPerCheck,
    });
  }
  if (checkDeadlineWithoutActivity(deadlines, entries)) {
    gaps.push({
      description: "A deadline passed with no logged activity nearby",
      pointsRecoverable: deductionPerCheck,
    });
  }
  if (checkOfferWithoutPayment(claim, entries)) {
    gaps.push({
      description: "An offer amount is on file but no payment has been logged",
      pointsRecoverable: deductionPerCheck,
    });
  }

  const points = clamp(max - deductionPerCheck * gaps.length, 0, max);
  return { points, max, gaps };
}

// ---------------------------------------------------------------------
// 2.7 — Claim Readiness (derived, not independently measured)
// ---------------------------------------------------------------------

function scoreClaimReadiness(otherCategories: CategoryResult[]): CategoryResult {
  const max = MAX.claimReadiness;
  const otherEarned = otherCategories.reduce((sum, c) => sum + c.points, 0);
  const otherMax = otherCategories.reduce((sum, c) => sum + c.max, 0);
  const points = otherMax > 0 ? Math.round(max * (otherEarned / otherMax)) : 0;
  // No independent gaps — this category is a reflection of the other six,
  // not a separate action item, so it contributes nothing of its own to
  // the recommendation list.
  return { points, max, gaps: [] };
}

// ---------------------------------------------------------------------
// Grade bands — this engine's own scale, decoupled from the public Grader
// Quiz's GRADE_BANDS (src/lib/grader/rubric.ts), which is untouched.
// ---------------------------------------------------------------------

const GRADE_BANDS: { min: number; grade: DocumentationScoreResult["grade"] }[] = [
  { min: 90, grade: "A" },
  { min: 80, grade: "B" },
  { min: 70, grade: "C" },
  { min: 60, grade: "D" },
  { min: 0, grade: "F" },
];

// Exported for direct testing of the boundary table. Not a confidentiality
// concern like the category weights: the client view already exposes both
// `total` and `grade` together, so these cutoffs are inherently observable
// through normal product use regardless of whether this function is
// exported.
export function gradeForScore(total: number): DocumentationScoreResult["grade"] {
  return GRADE_BANDS.find((b) => total >= b.min)?.grade ?? "F";
}

// ---------------------------------------------------------------------
// Recommendation prioritization
// ---------------------------------------------------------------------

// Used only to break ties between gaps of equal point value — never
// exposed. Mirrors MAX above; kept as a separate lookup so the sort
// function reads as "weight order," not a duplicate of the score maxes.
const CATEGORY_WEIGHT_RANK: Record<CategoryKey, number> = MAX;

function prioritizeRecommendations(
  categories: Record<CategoryKey, CategoryResult>,
): (Gap & { categoryKey: CategoryKey })[] {
  const all: (Gap & { categoryKey: CategoryKey })[] = [];
  for (const key of CATEGORY_ORDER) {
    for (const gap of categories[key].gaps) {
      all.push({ ...gap, categoryKey: key });
    }
  }

  all.sort((a, b) => {
    if (b.pointsRecoverable !== a.pointsRecoverable) return b.pointsRecoverable - a.pointsRecoverable;
    const weightDiff = CATEGORY_WEIGHT_RANK[b.categoryKey] - CATEGORY_WEIGHT_RANK[a.categoryKey];
    if (weightDiff !== 0) return weightDiff;
    return CATEGORY_ORDER.indexOf(a.categoryKey) - CATEGORY_ORDER.indexOf(b.categoryKey);
  });

  return all.slice(0, 5);
}

// ---------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------

export function computeDocumentationScore(
  input: DocumentationScoreInput,
  now: Date = new Date(),
): DocumentationScoreResult {
  const profile = claimTypeProfile(input.claim.damageCategory);

  const evidenceCoverage = scoreChecklistCategory(
    input.evidenceItems,
    "evidence_coverage",
    MAX.evidenceCoverage,
    CATEGORY_LABELS.evidenceCoverage,
  );
  const documentationCompleteness = scoreChecklistCategory(
    input.evidenceItems,
    "documentation_completeness",
    MAX.documentationCompleteness,
    CATEGORY_LABELS.documentationCompleteness,
  );
  const timelineIntegrity = scoreTimelineIntegrity(input.claim, input.entries);
  const evidenceQualityOrganization = scoreEvidenceQualityOrganization(input.evidenceItems, input.files);
  const deadlineReadiness = scoreDeadlineReadiness(input.deadlines, input.entries, now);
  const consistencyAnalysis = scoreConsistencyAnalysis(
    input.claim,
    input.entries,
    input.deadlines,
    input.evidenceItems,
    input.files,
    profile,
    now,
  );
  const claimReadiness = scoreClaimReadiness([
    evidenceCoverage,
    documentationCompleteness,
    timelineIntegrity,
    evidenceQualityOrganization,
    deadlineReadiness,
    consistencyAnalysis,
  ]);

  const categories: Record<CategoryKey, CategoryResult> = {
    evidenceCoverage,
    documentationCompleteness,
    timelineIntegrity,
    evidenceQualityOrganization,
    deadlineReadiness,
    consistencyAnalysis,
    claimReadiness,
  };

  const total = Object.values(categories).reduce((sum, c) => sum + c.points, 0);

  return {
    total,
    grade: gradeForScore(total),
    profile,
    categories,
    recommendations: prioritizeRecommendations(categories),
  };
}

// ---------------------------------------------------------------------
// Client-safe view — the ONLY shape allowed to reach a Client Component or
// a browser-readable API response. Strips weights, maxes, raw points, and
// point-value deltas; status/priority are ordinal/bucketed, not numeric.
// ---------------------------------------------------------------------

function statusForFraction(fraction: number): "strong" | "solid" | "needs_attention" | "critical_gap" {
  if (fraction >= 0.9) return "strong";
  if (fraction >= 0.7) return "solid";
  if (fraction >= 0.4) return "needs_attention";
  return "critical_gap";
}

function priorityForIndex(index: number): "high" | "medium" | "low" {
  if (index < 2) return "high";
  if (index < 4) return "medium";
  return "low";
}

export function toClientView(result: DocumentationScoreResult): DocumentationScoreClientView {
  return {
    total: result.total,
    grade: result.grade,
    categories: CATEGORY_ORDER.map((key) => {
      const cat = result.categories[key];
      return {
        key,
        label: CATEGORY_LABELS[key],
        status: statusForFraction(cat.max > 0 ? cat.points / cat.max : 0),
      };
    }),
    recommendations: result.recommendations.map((r, i) => ({
      description: r.description,
      priority: priorityForIndex(i),
    })),
  };
}
