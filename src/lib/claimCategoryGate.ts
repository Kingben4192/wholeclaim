import type { SupabaseClient } from "@supabase/supabase-js";
import { isAccountPro, isPro } from "./entitlements";
import type { ClaimCategory } from "./claimCategories";

// Free-plan claim limits, category-based (Decision #44). Mirrors
// uploadGate.ts's shape and philosophy: check Pro first (short-circuit),
// fail closed on query errors, return a discriminated-union block result
// rather than throwing (Server Actions translate a block into a thrown
// Error at the call site, matching uploadFile()'s pattern).

export type CategoryClaimState = {
  activeClaimId: string | null;
  // Every non-deleted claim id in this category, any status — used for
  // both the anti-abuse check and (via isPro on each) the admin-exception
  // check below.
  historyClaimIds: string[];
};

export async function getCategoryClaimState(
  supabase: SupabaseClient,
  userId: string,
  category: ClaimCategory,
): Promise<CategoryClaimState> {
  const { data, error } = await supabase
    .from("claims")
    .select("id, status")
    .eq("user_id", userId)
    .eq("claim_category", category)
    .is("deleted_at", null);

  if (error) {
    console.error("getCategoryClaimState: query failed, treating as no history:", error.message);
    return { activeClaimId: null, historyClaimIds: [] };
  }

  const rows = data ?? [];
  return {
    activeClaimId: rows.find((r) => r.status === "active")?.id ?? null,
    historyClaimIds: rows.map((r) => r.id),
  };
}

export type ClaimCategoryGateResult =
  | { allowed: true }
  | {
      allowed: false;
      blocked: true;
      upgradeRequired: true;
      // Distinguishes "blocked by a currently-active claim" from "blocked
      // by anti-abuse history" for UI messaging only — both are blocked
      // identically (Decision #44: resolved/archived/closed all trigger
      // the same anti-abuse rule as an active claim would, since a user
      // self-selects their own end state with no server-side verification
      // that a dispute actually resolved — an uneven rule would just train
      // users to always pick the lenient label).
      reason: "ACTIVE_CLAIM_EXISTS_IN_CATEGORY" | "CATEGORY_HISTORY_EXISTS";
      blockingClaimIds: string[];
    };

export async function checkClaimCategoryAccess(
  supabase: SupabaseClient,
  userId: string,
  category: ClaimCategory,
): Promise<ClaimCategoryGateResult> {
  // Account-wide Pro always bypasses — no claim exists yet at this point
  // (this gate runs before/at claim creation), so only the account-level
  // check applies here, unlike isPro()'s claim-scoped branch B.
  if (await isAccountPro(supabase, userId)) return { allowed: true };

  const state = await getCategoryClaimState(supabase, userId, category);
  if (state.historyClaimIds.length === 0) return { allowed: true };

  // Admin exception (Decision #44), reusing 100% existing infrastructure:
  // a manually-granted claim_entitlements lifetime-unlock row on ANY claim
  // in this category's history exempts the category. This is the exact
  // same mechanism a real Stripe lifetime purchase creates — no new admin
  // tooling, no new entitlement_type. Side effect the founder should know:
  // granting this way also unlocks that specific claim's own Pro features
  // (uploads/AI), since it's the same grant a paying customer gets.
  for (const claimId of state.historyClaimIds) {
    if (await isPro(supabase, claimId, userId)) return { allowed: true };
  }

  return {
    allowed: false,
    blocked: true,
    upgradeRequired: true,
    blockingClaimIds: state.historyClaimIds,
    reason: state.activeClaimId ? "ACTIVE_CLAIM_EXISTS_IN_CATEGORY" : "CATEGORY_HISTORY_EXISTS",
  };
}
