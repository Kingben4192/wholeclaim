import type { SupabaseClient } from "@supabase/supabase-js";
import { isPro } from "../entitlements";

const PRO_DAILY_CAP = 30;
const IP_HOURLY_CAP = 20;
// Decision #32: 3 total AI analyses per claim — lifetime, not monthly, not
// per-tool, not resettable. Fixed 2026-07-18 per founder direction: this
// constant and the free-tier branch below previously implemented the pre-
// Decision-#32 rule (1 lifetime call, counted globally across every claim
// a user owns) — Decision #32 was recorded but this function was never
// actually updated to match it until now.
const FREE_CLAIM_CAP = 3;

// Plan gate (free = 3 analyses per claim per Decision #32, pro = 30/day
// fair use — though Billing Build Order Step 5 has Pro bypass this
// function entirely via isPro(), so the pro branch below is now a
// defensive fallback, not the primary path for paying customers) plus a
// per-IP counter shared across accounts — cost-attack protection per the
// Production Build Brief §4/§7 (non-negotiable).
//
// claimId is optional: the two Knowledge Library ingestion call sites
// (src/app/api/ai/ingest/route.ts, src/app/library/actions.ts) have no
// claim context at all (logAiRun already records claimId: null for them)
// and are outside Decision #32's scope (admin-only, not one of the
// homeowner-facing Pro tools) — they keep the original global-per-user,
// 1-lifetime-call behavior, unchanged, by passing claimId: null.
export async function checkUsageGate(
  supabase: SupabaseClient,
  userId: string,
  claimId: string | null,
  ip: string,
): Promise<{ allowed: boolean; reason?: string }> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .single();

  const plan = profile?.plan ?? "free";

  // Fail CLOSED, not open: a query error (e.g. the PostgREST schema-cache
  // staleness this table has hit more than once) must never be read as
  // "zero calls made yet" — that would silently disable the free-plan cap
  // and the per-IP cost-attack protection the Build Brief calls
  // non-negotiable, for as long as the underlying issue lasts.
  const FAIL_CLOSED = {
    allowed: false,
    reason: "The usage check is temporarily unavailable. Try again shortly.",
  };

  if (plan === "free" && claimId) {
    const { count, error } = await supabase
      .from("ai_runs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("claim_id", claimId);
    if (error) {
      console.error("checkUsageGate: ai_runs query failed, denying:", error.message);
      return FAIL_CLOSED;
    }
    if ((count ?? 0) >= FREE_CLAIM_CAP) {
      return {
        allowed: false,
        reason:
          "Free plan includes 3 AI analyses per claim. Upgrade to Pro for unlimited analysis.",
      };
    }
  } else if (plan === "free") {
    // claimId === null — Knowledge Library ingestion only (see comment
    // above). Original, unchanged behavior: 1 lifetime call, global.
    const { count, error } = await supabase
      .from("ai_runs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    if (error) {
      console.error("checkUsageGate: ai_runs query failed, denying:", error.message);
      return FAIL_CLOSED;
    }
    if ((count ?? 0) >= 1) {
      return {
        allowed: false,
        reason:
          "Free plan includes one AI analysis. Upgrade to Pro for unlimited analysis (fair use).",
      };
    }
  } else {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error } = await supabase
      .from("ai_runs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", since);
    if (error) {
      console.error("checkUsageGate: ai_runs query failed, denying:", error.message);
      return FAIL_CLOSED;
    }
    if ((count ?? 0) >= PRO_DAILY_CAP) {
      return {
        allowed: false,
        reason: "Daily AI analysis limit reached. Try again tomorrow.",
      };
    }
  }

  const ipSince = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: ipCount, error: ipError } = await supabase
    .from("ai_ip_calls")
    .select("id", { count: "exact", head: true })
    .eq("ip", ip)
    .gte("created_at", ipSince);
  if (ipError) {
    console.error("checkUsageGate: ai_ip_calls query failed, denying:", ipError.message);
    return FAIL_CLOSED;
  }
  if ((ipCount ?? 0) >= IP_HOURLY_CAP) {
    return {
      allowed: false,
      reason: "Too many requests from this network. Try again later.",
    };
  }

  const { error: insertError } = await supabase.from("ai_ip_calls").insert({ ip });
  if (insertError) {
    console.error("checkUsageGate: ai_ip_calls insert failed, denying:", insertError.message);
    return FAIL_CLOSED;
  }

  return { allowed: true };
}

// Billing Build Order Step 5 — the ONE consistent entitlement gate used by
// every Pro tool. Two variants, both returning the identical
// {allowed, reason?} shape so every calling route stays uniform, matching
// the approved pricing model's own two-tier tool classification exactly:
//
// checkAiAccess — Policy Decoder, Loss-Count Auditor, Estimate Gap
// Analyzer, Decision Assistant, Letter Builder. Pro (active subscription,
// lifetime entitlement for this claim, or past_due grace) bypasses
// checkUsageGate entirely — unlimited, never blocked. Free falls through
// to checkUsageGate exactly as before (now claim-scoped, Decision #32).
export async function checkAiAccess(
  supabase: SupabaseClient,
  userId: string,
  claimId: string,
  ip: string,
): Promise<{ allowed: boolean; reason?: string }> {
  const pro = await isPro(supabase, claimId, userId);
  if (pro) return { allowed: true };
  return checkUsageGate(supabase, userId, claimId, ip);
}

// requireProAiAccess — Mold Coverage Timeline, Supplement Assistant. Both
// are AI-powered but explicitly classified as Pro-tier homeowner features
// with NO free allowance at all (unlike the five tools above) — a free
// user gets zero analyses, not three. Never calls checkUsageGate; never
// writes ai_ip_calls for a blocked attempt either, since it's not a
// cost-attack-shaped check, it's a flat entitlement requirement.
export async function requireProAiAccess(
  supabase: SupabaseClient,
  claimId: string,
  userId: string,
): Promise<{ allowed: boolean; reason?: string }> {
  const pro = await isPro(supabase, claimId, userId);
  if (pro) return { allowed: true };
  return {
    allowed: false,
    reason: "This is a Pro feature. Upgrade to unlock it for this claim.",
  };
}

export async function logAiRun(
  supabase: SupabaseClient,
  params: {
    userId: string;
    claimId: string | null;
    tool: string;
    promptVersion: string;
    output: string;
    tokensIn?: number;
    tokensOut?: number;
  },
) {
  const { error } = await supabase.from("ai_runs").insert({
    user_id: params.userId,
    claim_id: params.claimId,
    tool: params.tool,
    prompt_version: params.promptVersion,
    output: params.output,
    tokens_in: params.tokensIn,
    tokens_out: params.tokensOut,
  });
  if (error) {
    // Don't throw — the AI response already succeeded and reached the
    // user; failing the request over a logging write would be worse than
    // this. But per Decision #26 (no anonymous AI outputs), a silently
    // dropped ai_runs row must be visible somewhere, not swallowed.
    console.error("logAiRun: insert failed, output was NOT recorded to ai_runs:", error.message);
  }
}
