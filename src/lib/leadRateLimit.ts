import { getAdminClient, isServiceRoleConfigured } from "./supabase/admin";

// Lightweight per-IP protection for the public Claim Grade signup form
// (security review LOW finding, 2026-07-24) — mirrors the ai_ip_calls
// pattern in anthropic/rateLimit.ts, but as its own table: leads aren't an
// AI-cost concern, they're a spam/abuse concern, and keeping the counter
// separate means an AI-cost change to one cap never accidentally changes
// the other's behavior. Reachable only through the service-role client, so
// the same "authenticated read/write" mistake ai_ip_calls originally had
// isn't repeated here.
const LEAD_IP_HOURLY_CAP = 10;

export async function checkLeadRateLimit(ip: string): Promise<{ allowed: boolean; reason?: string }> {
  if (!isServiceRoleConfigured()) {
    console.error("checkLeadRateLimit: service role not configured, denying");
    return { allowed: false, reason: "Grading is temporarily unavailable. Try again shortly." };
  }
  const admin = getAdminClient();

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error } = await admin
    .from("lead_ip_calls")
    .select("id", { count: "exact", head: true })
    .eq("ip", ip)
    .gte("created_at", since);
  if (error) {
    console.error("checkLeadRateLimit: query failed, denying:", error.message);
    return { allowed: false, reason: "Grading is temporarily unavailable. Try again shortly." };
  }
  if ((count ?? 0) >= LEAD_IP_HOURLY_CAP) {
    return { allowed: false, reason: "Too many requests from this network. Try again later." };
  }

  const { error: insertError } = await admin.from("lead_ip_calls").insert({ ip });
  if (insertError) {
    console.error("checkLeadRateLimit: insert failed, denying:", insertError.message);
    return { allowed: false, reason: "Grading is temporarily unavailable. Try again shortly." };
  }

  return { allowed: true };
}
