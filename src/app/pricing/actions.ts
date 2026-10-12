"use server";

import { headers } from "next/headers";
import { isServiceRoleConfigured, getAdminClient } from "@/lib/supabase/admin";
import { validateWaitlistInput } from "@/lib/waitlist";

export type JoinWaitlistResult = { ok: true; alreadyJoined: boolean } | { ok: false; error: string };

const SAVE_FAILED = "Couldn't save that. Check the email and try again.";
// Shares lead_ip_calls with the grader's limiter (src/lib/leadRateLimit.ts)
// but keeps its own cap and message, since that one talks about grading.
const WAITLIST_IP_HOURLY_CAP = 10;

// Waitlist capture for the "Coming soon" plans (Decision #133). Saved with
// the service role into waitlist_signups, which has no public policies --
// no anon insert permission to break (see the repeated `leads` repairs,
// migrations 0008/0020/0030). Errors are returned, not thrown, so the
// message reaches the visitor in production.
export async function joinWaitlist(input: {
  email: string;
  plan: string;
  units?: string;
  website?: string;
}): Promise<JoinWaitlistResult> {
  // Hidden field a person never fills in; a bot that does gets a quiet success.
  if (input.website) return { ok: true, alreadyJoined: false };

  const valid = validateWaitlistInput(input);
  if (!valid.ok) return valid;

  if (!isServiceRoleConfigured()) {
    console.error("joinWaitlist: service role not configured");
    return { ok: false, error: SAVE_FAILED };
  }
  const admin = getAdminClient();

  try {
    const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await admin
      .from("lead_ip_calls")
      .select("id", { count: "exact", head: true })
      .eq("ip", ip)
      .gte("created_at", since);
    if (countError) {
      console.error("joinWaitlist: rate-limit query failed:", countError.message);
      return { ok: false, error: SAVE_FAILED };
    }
    if ((count ?? 0) >= WAITLIST_IP_HOURLY_CAP) {
      return { ok: false, error: "Too many sign-ups from this network. Try again later." };
    }
    await admin.from("lead_ip_calls").insert({ ip });

    const { error } = await admin.from("waitlist_signups").insert({
      email: valid.email,
      plan: valid.plan,
      unit_count: valid.unitCount,
      source_path: "/pricing",
    });
    if (error) {
      if (error.code === "23505") return { ok: true, alreadyJoined: true };
      console.error("joinWaitlist: insert failed:", error.message);
      return { ok: false, error: SAVE_FAILED };
    }
    return { ok: true, alreadyJoined: false };
  } catch (err) {
    console.error("joinWaitlist failed:", err instanceof Error ? err.message : err);
    return { ok: false, error: SAVE_FAILED };
  }
}
