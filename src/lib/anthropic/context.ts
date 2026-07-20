import type { SupabaseClient } from "@supabase/supabase-js";

const RECENT_ENTRIES_LIMIT = 15;

export async function buildClaimContext(
  supabase: SupabaseClient,
  claimId: string,
) {
  const [
    { data: claim },
    { data: recentEntries, count: entryCount },
    { data: evidenceItems },
    { data: deadlines },
  ] = await Promise.all([
    supabase.from("claims").select("*").eq("id", claimId).single(),
    supabase
      .from("entries")
      .select("date, type, contact, summary", { count: "exact" })
      .eq("claim_id", claimId)
      .order("date", { ascending: false })
      .limit(RECENT_ENTRIES_LIMIT),
    supabase
      .from("evidence_items")
      .select("label, checked, file_id")
      .eq("claim_id", claimId),
    supabase
      .from("deadlines")
      .select("title, due_date")
      .eq("claim_id", claimId)
      .order("due_date", { ascending: true }),
  ]);

  if (!claim) return "CLAIM CONTEXT\n(No claim found.)";

  const entryLines = (recentEntries ?? [])
    .map(
      (e) =>
        `  ${e.date} [${e.type}]${e.contact ? ` ${e.contact}` : ""}: ${e.summary}`,
    )
    .join("\n");

  const items = evidenceItems ?? [];
  const missingCount = items.filter((i) => !i.file_id).length;
  const evidenceLines = items
    .map((i) => {
      const status = i.file_id
        ? "on file"
        : i.checked
          ? "checked, no file attached"
          : "not started";
      return `  ${i.label}: ${status}`;
    })
    .join("\n");

  const todayStr = new Date().toISOString().slice(0, 10);
  const deadlineLines = (deadlines ?? [])
    .map(
      (d) =>
        `  ${d.title}: ${d.due_date}${d.due_date < todayStr ? " (OVERDUE)" : ""}`,
    )
    .join("\n");

  return `CLAIM CONTEXT
Carrier: ${claim.carrier || "—"}
Claim number: ${claim.claim_number || "—"}
Policy number: ${claim.policy_number || "—"}
Date of loss: ${claim.date_of_loss || "—"}
Damage: ${claim.damage_desc || claim.damage_category || "—"} (${claim.damage_category || "—"})
State: ${claim.us_state || "—"}
Carrier offer or paid to date: ${claim.offer_amount ?? "—"}

CHRONOLOGY (${entryCount ?? 0} entries on file, most recent ${Math.min(entryCount ?? 0, RECENT_ENTRIES_LIMIT)} shown):
${entryLines || "  None logged yet."}

EVIDENCE CHECKLIST (${missingCount} of ${items.length} items with no file on record):
${evidenceLines || "  No checklist items yet."}

DEADLINES:
${deadlineLines || "  None tracked yet."}`;
}

// Mirrors libraryContext() in the prototype: up to 12 active entries, owned by
// this user or globally curated (owner_id null).
export async function buildLibraryContext(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data } = await supabase
    .from("library_entries")
    .select("type, jurisdiction, cite, summary, verified_date")
    .eq("active", true)
    .eq("status", "approved")
    .or(`owner_id.eq.${userId},owner_id.is.null`)
    .order("verified_date", { ascending: false })
    .limit(12);

  if (!data || data.length === 0) {
    return "KNOWLEDGE LIBRARY: no approved entries yet. Rely on general knowledge and tell the user to verify specifics for their state.";
  }

  return (
    "OWNER-APPROVED KNOWLEDGE LIBRARY (verified entries; prefer these over general knowledge and reference them where they apply; still tell the user to verify final details):\n" +
    data
      .map(
        (e) =>
          `[${(e.type || "").toUpperCase()} | ${e.jurisdiction} | verified ${e.verified_date ?? "—"}] ${e.cite}: ${e.summary}`,
      )
      .join("\n")
  );
}

// Deterministic pattern detection (Appendix A.2 rule #1: "Deterministic
// first... AI explains results; it never determines them"). Every signal
// here is computed from the claim's own tracked rows — nothing inferred
// from free text, nothing guessed. "Denied claim" is deliberately absent:
// there is no status field anywhere in the schema to detect it from (the
// grader asks this exact question but the answer is currently discarded,
// not stored on the claim — a real gap, not something to fake a heuristic
// for here).
export type EscalationSignal = { category: string; note: string };

export async function buildEscalationSignals(
  supabase: SupabaseClient,
  claimId: string,
  userId: string,
): Promise<EscalationSignal[]> {
  const [{ data: deadlines }, { data: payments }, { data: nonrenewalLetters }] =
    await Promise.all([
      supabase.from("deadlines").select("title, due_date").eq("claim_id", claimId),
      supabase
        .from("entries")
        .select("id")
        .eq("claim_id", claimId)
        .eq("type", "payment"),
      supabase
        .from("ai_runs")
        .select("id")
        .eq("claim_id", claimId)
        .eq("user_id", userId)
        .eq("tool", "letter:nonrenewal")
        .limit(1),
    ]);

  const signals: EscalationSignal[] = [];
  const todayStr = new Date().toISOString().slice(0, 10);

  const overdue = (deadlines ?? []).filter((d) => d.due_date < todayStr);
  if (overdue.length > 0) {
    signals.push({
      category: "blown deadline",
      note: `${overdue.length} tracked deadline(s) past due: ${overdue
        .map((d) => `${d.title} (${d.due_date})`)
        .join(", ")}.`,
    });
  }

  if ((payments?.length ?? 0) >= 2) {
    signals.push({
      category: "repeated same-peril payments",
      note: `${payments!.length} payment entries logged on this claim — worth checking whether the carrier counted any of them as a separate occurrence rather than a supplement to the same loss.`,
    });
  }

  if ((nonrenewalLetters?.length ?? 0) > 0) {
    signals.push({
      category: "non-renewal dispute",
      note: "A non-renewal challenge letter has already been drafted for this claim.",
    });
  }

  return signals;
}

export function formatEscalationSignals(signals: EscalationSignal[]): string {
  if (signals.length === 0) {
    return "ESCALATION PATTERN CHECK: none of the tracked patterns (blown deadline, repeated payments, non-renewal dispute) are currently present in this claim's data.";
  }
  return (
    "ESCALATION PATTERN CHECK (computed from the claim's own tracked data, not inferred — reference what applies, name the pattern category and why it's typically worth attention, but this is a decision aid the user applies themselves: never assert a conclusion about this specific case, never a directive):\n" +
    signals.map((s) => `[${s.category.toUpperCase()}] ${s.note}`).join("\n")
  );
}

// Mold Coverage Timeline (Roadmap, Phase 1, Pro). Same deterministic-first
// rule as buildEscalationSignals: every date and match here comes from the
// claim's own tracked rows — date_of_loss, entries, evidence_items. No
// state-specific reporting deadline is ever computed or asserted here;
// mold reporting/sublimit rules vary by policy and state and only enter
// analysis through an owner-approved Knowledge Library entry (A.2 rule #2).
const WATER_MOLD_KEYWORDS = [
  "water",
  "leak",
  "pipe",
  "plumbing",
  "flood",
  "moisture",
  "mold",
  "mildew",
  "dry-out",
  "dryout",
  "drying",
  "remediation",
  "mitigation",
  "humidity",
  "sewage",
  "dehumidif",
];

function matchesWaterMoldKeyword(text: string): boolean {
  const lower = text.toLowerCase();
  return WATER_MOLD_KEYWORDS.some((k) => lower.includes(k));
}

export type MoldTimelineSignals = {
  dateOfLoss: string | null;
  damageCategory: string | null;
  daysSinceLoss: number | null;
  relatedEntries: { date: string; type: string; summary: string }[];
  relatedEvidence: { label: string; onFile: boolean }[];
};

export async function buildMoldSignals(
  supabase: SupabaseClient,
  claimId: string,
): Promise<MoldTimelineSignals> {
  const [{ data: claim }, { data: entries }, { data: evidenceItems }] =
    await Promise.all([
      supabase
        .from("claims")
        .select("date_of_loss, damage_category")
        .eq("id", claimId)
        .single(),
      supabase
        .from("entries")
        .select("date, type, summary")
        .eq("claim_id", claimId)
        .order("date", { ascending: true }),
      supabase
        .from("evidence_items")
        .select("label, file_id")
        .eq("claim_id", claimId),
    ]);

  const dateOfLoss = claim?.date_of_loss ?? null;
  const daysSinceLoss = dateOfLoss
    ? Math.floor((Date.now() - new Date(dateOfLoss).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const relatedEntries = (entries ?? [])
    .filter((e) => matchesWaterMoldKeyword(e.summary ?? ""))
    .map((e) => ({ date: e.date, type: e.type, summary: e.summary }));

  const relatedEvidence = (evidenceItems ?? [])
    .filter((i) => matchesWaterMoldKeyword(i.label ?? ""))
    .map((i) => ({ label: i.label, onFile: !!i.file_id }));

  return {
    dateOfLoss,
    damageCategory: claim?.damage_category ?? null,
    daysSinceLoss,
    relatedEntries,
    relatedEvidence,
  };
}

export function formatMoldSignals(s: MoldTimelineSignals): string {
  const lines: string[] = ["WATER/MOLD TIMELINE (computed from the claim's own tracked data — date of loss, entries, and evidence checklist; keyword-matched, not inferred):"];

  if (s.dateOfLoss) {
    lines.push(
      `Date of loss on file: ${s.dateOfLoss} (${s.daysSinceLoss} day(s) ago). Damage category: ${s.damageCategory ?? "not set"}.`,
    );
  } else {
    lines.push("No date of loss on file for this claim.");
  }

  if (s.relatedEntries.length > 0) {
    lines.push(
      "Water/moisture/mold-related entries logged, in chronological order:\n" +
        s.relatedEntries
          .map((e) => `  ${e.date} [${e.type}]: ${e.summary}`)
          .join("\n"),
    );
  } else {
    lines.push("No entries logged yet mention water, moisture, leak, or mold-related activity.");
  }

  if (s.relatedEvidence.length > 0) {
    lines.push(
      "Water/mold-related evidence checklist items:\n" +
        s.relatedEvidence
          .map((i) => `  ${i.label}: ${i.onFile ? "on file" : "no file attached yet"}`)
          .join("\n"),
    );
  } else {
    lines.push("No evidence checklist items reference water or mold specifically.");
  }

  return lines.join("\n");
}
