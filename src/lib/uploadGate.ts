import type { SupabaseClient } from "@supabase/supabase-js";
import { isPro } from "./entitlements";
import { FREE_UPLOAD_LIMIT_PER_CLAIM } from "./uploadLimits";

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
  | { allowed: false; blocked: true; reason: "UPLOAD_LIMIT_REACHED"; upgradeRequired: true };

export async function checkUploadAccess(
  supabase: SupabaseClient,
  userId: string,
  claimId: string,
): Promise<UploadGateResult> {
  const pro = await isPro(supabase, claimId, userId);
  if (pro) return { allowed: true };

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

  return { allowed: true };
}
