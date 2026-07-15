import type { SupabaseClient } from "@supabase/supabase-js";

const PRO_DAILY_CAP = 30;
const IP_HOURLY_CAP = 20;

// Plan gate (free = 1 lifetime analysis, pro = 30/day fair use) plus a
// per-IP counter shared across accounts — cost-attack protection per the
// Production Build Brief §4/§7 (non-negotiable).
export async function checkUsageGate(
  supabase: SupabaseClient,
  userId: string,
  ip: string,
): Promise<{ allowed: boolean; reason?: string }> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .single();

  const plan = profile?.plan ?? "free";

  if (plan === "free") {
    const { count } = await supabase
      .from("ai_runs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    if ((count ?? 0) >= 1) {
      return {
        allowed: false,
        reason:
          "Free plan includes one AI analysis. Upgrade to Pro for unlimited analysis (fair use).",
      };
    }
  } else {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("ai_runs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", since);
    if ((count ?? 0) >= PRO_DAILY_CAP) {
      return {
        allowed: false,
        reason: "Daily AI analysis limit reached. Try again tomorrow.",
      };
    }
  }

  const ipSince = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: ipCount } = await supabase
    .from("ai_ip_calls")
    .select("id", { count: "exact", head: true })
    .eq("ip", ip)
    .gte("created_at", ipSince);
  if ((ipCount ?? 0) >= IP_HOURLY_CAP) {
    return {
      allowed: false,
      reason: "Too many requests from this network. Try again later.",
    };
  }

  await supabase.from("ai_ip_calls").insert({ ip });

  return { allowed: true };
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
  await supabase.from("ai_runs").insert({
    user_id: params.userId,
    claim_id: params.claimId,
    tool: params.tool,
    prompt_version: params.promptVersion,
    output: params.output,
    tokens_in: params.tokensIn,
    tokens_out: params.tokensOut,
  });
}
