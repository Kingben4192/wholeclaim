import type { SupabaseClient } from "@supabase/supabase-js";
import { GRADE_BANDS } from "./grader/rubric";
import { computeClaimHealth } from "./claimHealth";
import { getAdminClient } from "./supabase/admin";
import { SUBSCRIPTION_STATUSES_GRANTING_PRO } from "./entitlements";

// Success Guarantee — eligibility foundation only (Decision #36, Billing
// Build Order Step 7). Explicitly NOT here: refund issuance, automatic
// refund execution, user-facing guarantee marketing copy. This file only
// tracks checklist completion and computes whether the documentation
// score improved by at least one letter grade — a stored fact, not an
// action.

// Decision #36 — fixed, identical for every user. Self-attested: the
// schema has no reliable way to distinguish "policy document" / "repair
// estimate" from any other upload (files.kind is only photo/pdf/doc), and
// "documentation review" is inherently a self-attestation step, not
// something derivable from other data — so all five items are user-marked
// checkboxes, not auto-detected. Flagged as a judgment call in the report.
export const GUARANTEE_CHECKLIST_ITEMS = [
  { key: "step_policy_uploaded", label: "Upload policy documents" },
  { key: "step_loss_timeline_added", label: "Add loss timeline" },
  { key: "step_damage_evidence_added", label: "Add damage evidence/photos" },
  { key: "step_repair_estimates_added", label: "Add repair estimates" },
  { key: "step_documentation_reviewed", label: "Complete claim documentation review" },
] as const;

export type GuaranteeChecklistKey = (typeof GUARANTEE_CHECKLIST_ITEMS)[number]["key"];

export function isGuaranteeChecklistKey(key: string): key is GuaranteeChecklistKey {
  return GUARANTEE_CHECKLIST_ITEMS.some((item) => item.key === key);
}

const GRADE_ORDER = ["F", "D", "C", "B", "A"] as const;
export type Grade = (typeof GRADE_ORDER)[number];

// Reuses the grader's own GRADE_BANDS thresholds (src/lib/grader/rubric.ts)
// so a Claim Health numeric score (0-100) maps onto the exact same A-F
// bands already shown everywhere else in the product — not a second,
// diverging scale invented for this feature. Read-only reuse; rubric.ts
// itself is untouched.
export function scoreToGrade(score: number): Grade {
  const band = GRADE_BANDS.find((b) => score >= b.min) ?? GRADE_BANDS[GRADE_BANDS.length - 1];
  return band.g as Grade;
}

export function gradeRank(grade: string): number {
  const idx = GRADE_ORDER.indexOf(grade as Grade);
  return idx === -1 ? 0 : idx;
}

export type GuaranteeChecklistState = Record<GuaranteeChecklistKey, boolean>;

// Decision #36: eligible only if ALL checklist items are complete AND the
// grade did not improve by at least one full letter band between purchase
// and completion.
//
// Decision #37: a claim that starts at A never qualifies. A one-letter
// improvement above A is mathematically impossible (there's no higher
// band to reach), so without this carve-out an already-A claim would
// read as eligible purely from having nowhere to go, not because nothing
// improved. A→A is explicitly not a failed guarantee.
export function computeGuaranteeEligibility(
  checklist: GuaranteeChecklistState,
  initialGrade: string,
  finalGrade: string,
): boolean {
  const allComplete = GUARANTEE_CHECKLIST_ITEMS.every((item) => checklist[item.key]);
  if (!allComplete) return false;
  if (initialGrade === "A") return false;
  return gradeRank(finalGrade) < gradeRank(initialGrade) + 1;
}

export type GuaranteeRow = {
  id: string;
  claim_id: string;
  user_id: string;
  purchase_type: string;
  initial_grade: string | null;
  initial_score: number | null;
  current_status: string;
  eligible_for_refund: boolean;
  step_policy_uploaded: boolean;
  step_loss_timeline_added: boolean;
  step_damage_evidence_added: boolean;
  step_repair_estimates_added: boolean;
  step_documentation_reviewed: boolean;
  final_grade: string | null;
  final_score: number | null;
  completed_at: string | null;
  eligibility_checked_at: string | null;
};

// Called from the claim page (Server Component) on every load for a Pro
// user. Cheap (one indexed select for the common case where a row already
// exists), idempotent (claim_guarantee.claim_id is unique — 0011), and the
// closest reliable proxy for "at time of purchase" available without
// touching the webhook, which every prior Billing Build Order step
// explicitly marked DO NOT MODIFY. Reads use the caller's own
// authenticated client (real RLS); the insert uses the service-role
// client since claim_guarantee has no client-write RLS policy (0012).
export async function ensureGuaranteeSnapshot(
  userClient: SupabaseClient,
  claimId: string,
  userId: string,
  currentScore: number,
): Promise<GuaranteeRow | null> {
  const { data: existing, error: existingError } = await userClient
    .from("claim_guarantee")
    .select("*")
    .eq("claim_id", claimId)
    .maybeSingle();
  if (existingError) {
    console.error("ensureGuaranteeSnapshot: existing-row query failed:", existingError.message);
    return null;
  }
  if (existing) return existing as GuaranteeRow;

  // Determine purchase_type the same way isPro() resolves it, without
  // calling isPro() itself (not modified this step): subscription checked
  // first, then a claim-level lifetime entitlement. If neither is true,
  // this claim isn't actually Pro — nothing to snapshot.
  const { data: profile } = await userClient
    .from("profiles")
    .select("subscription_status")
    .eq("id", userId)
    .maybeSingle();
  const hasSubscription =
    !!profile?.subscription_status &&
    SUBSCRIPTION_STATUSES_GRANTING_PRO.includes(profile.subscription_status);

  let purchaseType: string;
  if (hasSubscription) {
    purchaseType = "subscription";
  } else {
    const { data: entitlements } = await userClient
      .from("claim_entitlements")
      .select("id")
      .eq("claim_id", claimId)
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(1);
    if (!entitlements || entitlements.length === 0) return null;
    purchaseType = "lifetime";
  }

  const admin = getAdminClient();
  const { data: created, error } = await admin
    .from("claim_guarantee")
    .insert({
      claim_id: claimId,
      user_id: userId,
      purchase_type: purchaseType,
      initial_grade: scoreToGrade(currentScore),
      initial_score: currentScore,
    })
    .select("*")
    .single();
  if (error) {
    console.error("ensureGuaranteeSnapshot: insert failed:", error.message);
    return null;
  }
  return created as GuaranteeRow;
}

// Ownership-scoped even though it uses the service-role client (no
// client-write RLS policy exists) — both claim_id AND user_id are always
// required to match in the WHERE clause, so this can never touch another
// user's row regardless of who calls it. The caller (claim/actions.ts) is
// responsible for verifying the caller IS that authenticated user first.
export async function setGuaranteeChecklistItem(
  claimId: string,
  userId: string,
  itemKey: GuaranteeChecklistKey,
  value: boolean,
): Promise<GuaranteeRow | null> {
  const admin = getAdminClient();
  const { data: updated, error } = await admin
    .from("claim_guarantee")
    .update({ [itemKey]: value })
    .eq("claim_id", claimId)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error) {
    console.error("setGuaranteeChecklistItem: update failed:", error.message);
    throw new Error("Could not update checklist. Try again.");
  }
  return updated as GuaranteeRow;
}

// If every checklist item is now complete and this claim hasn't already
// been finalized (completed_at still null), snapshots the CURRENT Claim
// Health Score as final_grade/final_score, compares it against the
// purchase-time initial_grade, and stores the result — a stored fact
// about documentation completion vs. score change. Does not trigger, queue,
// or request any refund; eligible_for_refund here is data, not an action.
export async function finalizeGuaranteeIfComplete(
  userClient: SupabaseClient,
  claimId: string,
  userId: string,
): Promise<GuaranteeRow | null> {
  const { data: row, error: rowError } = await userClient
    .from("claim_guarantee")
    .select("*")
    .eq("claim_id", claimId)
    .eq("user_id", userId)
    .maybeSingle();
  if (rowError || !row) {
    if (rowError) console.error("finalizeGuaranteeIfComplete: row query failed:", rowError.message);
    return null;
  }
  const guarantee = row as GuaranteeRow;
  if (guarantee.completed_at) return guarantee; // already finalized, no-op

  const allComplete = GUARANTEE_CHECKLIST_ITEMS.every((item) => guarantee[item.key]);
  if (!allComplete) return guarantee;

  const [{ data: claim }, { data: entries }, { data: deadlines }, { data: evidenceItems }, { data: files }] =
    await Promise.all([
      userClient.from("claims").select("created_at").eq("id", claimId).single(),
      userClient.from("entries").select("type, created_at").eq("claim_id", claimId),
      userClient.from("deadlines").select("due_date, created_at").eq("claim_id", claimId),
      userClient.from("evidence_items").select("checked, file_id, created_at").eq("claim_id", claimId),
      userClient.from("files").select("uploaded_at").eq("claim_id", claimId),
    ]);

  const health = computeClaimHealth({
    claimCreatedAt: claim?.created_at ?? new Date().toISOString(),
    entries: entries ?? [],
    deadlines: deadlines ?? [],
    evidenceItems: evidenceItems ?? [],
    files: files ?? [],
  });

  const finalGrade = scoreToGrade(health.total);
  const checklist: GuaranteeChecklistState = {
    step_policy_uploaded: guarantee.step_policy_uploaded,
    step_loss_timeline_added: guarantee.step_loss_timeline_added,
    step_damage_evidence_added: guarantee.step_damage_evidence_added,
    step_repair_estimates_added: guarantee.step_repair_estimates_added,
    step_documentation_reviewed: guarantee.step_documentation_reviewed,
  };
  const eligible = computeGuaranteeEligibility(checklist, guarantee.initial_grade ?? "F", finalGrade);

  const admin = getAdminClient();
  const { data: finalized, error } = await admin
    .from("claim_guarantee")
    .update({
      final_grade: finalGrade,
      final_score: health.total,
      eligibility_checked_at: new Date().toISOString(),
      eligible_for_refund: eligible,
      completed_at: new Date().toISOString(),
    })
    .eq("claim_id", claimId)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error) {
    console.error("finalizeGuaranteeIfComplete: update failed:", error.message);
    return guarantee;
  }
  return finalized as GuaranteeRow;
}
