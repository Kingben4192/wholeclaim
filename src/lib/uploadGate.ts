import type { SupabaseClient } from "@supabase/supabase-js";
import { isPro } from "./entitlements";
import { FREE_UPLOAD_LIMIT_PER_CLAIM } from "./uploadLimits";
import { computeFreeStorageStatus, computeProStorageStatus, type StorageStatus } from "./storageStatus";

// Billing Build Order Step 6 — the one server-side evidence-upload gate.
// Same pattern as Step 5's checkAiAccess/requireProAiAccess: isPro() is
// the sole entitlement source of truth, checked first; Pro (any grant —
// active subscription, lifetime entitlement for this claim, or past_due
// grace) skips the counter entirely. This exact structured shape is what
// the spec calls "the block response format" — kept as this function's
// real return type so it's independently verifiable and directly reusable
// by a future API route. uploadFile (a Server Action) translates a
// blocked result into a thrown Error for its existing callers, since
// Next.js Server Actions only reliably serialize an Error's .message
// across the client/server boundary, not custom properties on a thrown
// object — see the comment at its call site in claim/actions.ts.
export type UploadGateResult =
  | { allowed: true }
  | { allowed: false; blocked: true; reason: "UPLOAD_LIMIT_REACHED"; upgradeRequired: true }
  | {
      allowed: false;
      blocked: true;
      reason: "STORAGE_LIMIT_REACHED";
      upgradeRequired: boolean;
      bindingLimit: "claim" | "account";
      status: StorageStatus;
    };

// incomingFileSizeBytes: checked against current usage BEFORE the file is
// uploaded (Decision #88 / STORAGE_ENFORCEMENT_BRIEF.md step 3), so a
// blocked attempt never touches Storage or the database.
//
// Storage enforcement is Pro-aware, not skip-entirely like the file-count
// cap above it -- Decision #81 gives Pro a real 10GB + 500MB-buffer
// ceiling, not "unlimited" (unlike uploads, which genuinely are unlimited
// for Pro per Roadmap.md). isPro() still short-circuits the file-COUNT
// check specifically, since that entitlement is real; it does not
// short-circuit storage.
export async function checkUploadAccess(
  supabase: SupabaseClient,
  userId: string,
  claimId: string,
  incomingFileSizeBytes: number,
): Promise<UploadGateResult> {
  const pro = await isPro(supabase, claimId, userId);

  if (pro) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("storage_used_bytes")
      .eq("id", userId)
      .single();
    if (error || !profile) {
      console.error("checkUploadAccess: profile storage query failed:", error?.message);
      throw new Error("Could not verify your storage usage. Try again.");
    }

    const result = computeProStorageStatus(profile.storage_used_bytes + incomingFileSizeBytes);
    if (result.status === "blocked") {
      return {
        allowed: false,
        blocked: true,
        reason: "STORAGE_LIMIT_REACHED",
        upgradeRequired: false,
        bindingLimit: result.bindingLimit,
        status: result.status,
      };
    }
    return { allowed: true };
  }

  const { count, error } = await supabase
    .from("files")
    .select("id", { count: "exact", head: true })
    .eq("claim_id", claimId);
  if (error) {
    // Genuine infrastructure failure, not a policy decision — this is not
    // the same thing as "cap reached" and must not be reported as such.
    console.error("checkUploadAccess: files count query failed:", error.message);
    throw new Error("Could not verify your upload limit. Try again.");
  }

  if ((count ?? 0) >= FREE_UPLOAD_LIMIT_PER_CLAIM) {
    return { allowed: false, blocked: true, reason: "UPLOAD_LIMIT_REACHED", upgradeRequired: true };
  }

  const [claimUsage, profileUsage] = await Promise.all([
    supabase.from("claims").select("storage_used_bytes").eq("id", claimId).single(),
    supabase.from("profiles").select("storage_used_bytes").eq("id", userId).single(),
  ]);
  if (claimUsage.error || !claimUsage.data || profileUsage.error || !profileUsage.data) {
    console.error(
      "checkUploadAccess: storage usage query failed:",
      claimUsage.error?.message,
      profileUsage.error?.message,
    );
    throw new Error("Could not verify your storage usage. Try again.");
  }

  const result = computeFreeStorageStatus(
    claimUsage.data.storage_used_bytes + incomingFileSizeBytes,
    profileUsage.data.storage_used_bytes + incomingFileSizeBytes,
  );
  if (result.status === "blocked") {
    return {
      allowed: false,
      blocked: true,
      reason: "STORAGE_LIMIT_REACHED",
      upgradeRequired: true,
      bindingLimit: result.bindingLimit,
      status: result.status,
    };
  }

  return { allowed: true };
}
