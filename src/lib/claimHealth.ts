// Claim Health Score — Product Bible invariant: "Never predicts claim
// outcomes. Never estimates settlement values. Always explainable (every
// component visible with points and maximum). Always deterministic
// (identical inputs -> identical score)." Decision #2 (Invariant): "Health,"
// never "Strength" — this measures the CONDITION of the documentation, not
// the claim's merits. Category weights (Evidence /40, Paper Trail /20,
// Deadlines /20, Freshness /20) match the sample shown on the marketing
// page (src/app/page.tsx SCORE_BREAKDOWN).
//
// Pure function of already-fetched rows — no DB/network access here, so
// it's directly unit-testable in isolation from Supabase.

export type ClaimHealthInput = {
  claimCreatedAt: string;
  entries: { type: string; created_at: string }[];
  deadlines: { due_date: string; created_at: string }[];
  evidenceItems: { checked: boolean; file_id: string | null; created_at: string }[];
  files: { uploaded_at: string }[];
};

export type ClaimHealthCategory = { points: number; max: number };

export type ClaimHealthResult = {
  total: number;
  evidence: ClaimHealthCategory;
  paperTrail: ClaimHealthCategory;
  deadlines: ClaimHealthCategory;
  freshness: ClaimHealthCategory;
};

// Entry types that represent something committed to writing, vs. a verbal
// contact (call/visit) that only becomes "paper trail" once followed up.
const WRITTEN_ENTRY_TYPES = new Set(["email", "letter"]);

function scoreEvidence(items: ClaimHealthInput["evidenceItems"]): number {
  // Nothing to grade against yet — never invent a score for an empty
  // checklist.
  if (items.length === 0) return 0;

  const perItem = 40 / items.length;
  const raw = items.reduce((sum, item) => {
    // Backed by an actual uploaded file: full credit.
    if (item.file_id) return sum + perItem;
    // Manually checked with nothing attached: half credit — the box is
    // ticked, but there's no file behind it to actually produce later.
    if (item.checked) return sum + perItem * 0.5;
    return sum;
  }, 0);

  return Math.round(raw);
}

function scorePaperTrail(entries: ClaimHealthInput["entries"]): number {
  // 1 point per logged contact, 2 for anything already in writing
  // (email/letter) — rewards both the logging habit and converting verbal
  // contacts into a written record.
  const raw = entries.reduce(
    (sum, e) => sum + (WRITTEN_ENTRY_TYPES.has(e.type) ? 2 : 1),
    0,
  );
  return Math.min(raw, 20);
}

function scoreDeadlines(deadlines: ClaimHealthInput["deadlines"]): number {
  // Nothing tracked at all is the worst state — a missed date is exactly
  // what this feature exists to prevent.
  if (deadlines.length === 0) return 0;

  const todayStr = new Date().toISOString().slice(0, 10);
  const notOverdue = deadlines.filter((d) => d.due_date >= todayStr).length;

  // 10 points just for tracking at least one deadline, plus up to 10 more
  // scaled by how many of them aren't currently overdue. (There's no
  // "resolved" flag on a deadline in the schema, so "overdue" is the only
  // determinable risk signal — an overdue row reads as missed-or-forgotten
  // either way.)
  return Math.round(10 + 10 * (notOverdue / deadlines.length));
}

function scoreFreshness(input: ClaimHealthInput): number {
  const timestamps = [
    input.claimCreatedAt,
    ...input.entries.map((e) => e.created_at),
    ...input.deadlines.map((d) => d.created_at),
    ...input.evidenceItems.map((i) => i.created_at),
    ...input.files.map((f) => f.uploaded_at),
  ]
    .filter(Boolean)
    .map((t) => new Date(t).getTime())
    .filter((t) => !Number.isNaN(t));

  // Falls back to claim creation if nothing else exists yet, so a
  // brand-new claim reads as fresh rather than stale.
  if (timestamps.length === 0) return 0;

  const daysSinceLastActivity =
    (Date.now() - Math.max(...timestamps)) / (1000 * 60 * 60 * 24);

  if (daysSinceLastActivity <= 7) return 20;
  if (daysSinceLastActivity <= 30) return 12;
  if (daysSinceLastActivity <= 90) return 5;
  return 0;
}

export function computeClaimHealth(input: ClaimHealthInput): ClaimHealthResult {
  const evidence = { points: scoreEvidence(input.evidenceItems), max: 40 };
  const paperTrail = { points: scorePaperTrail(input.entries), max: 20 };
  const deadlines = { points: scoreDeadlines(input.deadlines), max: 20 };
  const freshness = { points: scoreFreshness(input), max: 20 };

  return {
    total: evidence.points + paperTrail.points + deadlines.points + freshness.points,
    evidence,
    paperTrail,
    deadlines,
    freshness,
  };
}
