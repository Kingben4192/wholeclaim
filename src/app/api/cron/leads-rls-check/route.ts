import { NextResponse, type NextRequest } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getAdminClient, isServiceRoleConfigured } from "@/lib/supabase/admin";

// Synthetic monitor for anon INSERT on `leads` (the public Claim Grade
// front door). This exact path has broken in production four times now
// (0008, 0013, 0020, and again the day after 0020 was verified fixed)
// with root cause never confirmed -- a real user hitting it live has been
// the only way we've ever found out. This periodically re-runs the same
// real anon insert src/app/grade/actions.ts's submitGrade performs, so a
// break shows up here first instead of on a real visitor.
//
// On failure, the thrown error is picked up automatically by Sentry's
// onRequestError hook (instrumentation.ts) -- no manual capture call
// needed, matching how the rest of this app already relies on Sentry.
// Same CRON_SECRET bearer-auth pattern as the other two cron routes.

const SYNTHETIC_EMAIL_DOMAIN = "@wholeclaim-internal-monitor.local";

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey || !isServiceRoleConfigured()) {
    return NextResponse.json(
      { error: "This service isn't configured yet." },
      { status: 503 },
    );
  }

  const anon = createSupabaseClient(url, anonKey);
  const email = `check-${Date.now()}${SYNTHETIC_EMAIL_DOMAIN}`;

  const { error: insertError } = await anon.from("leads").insert({
    name: "Synthetic Monitor",
    email,
    grade: "A",
    score: 0,
    answers: {},
    consent: false,
  });

  // Cleanup always runs, via the service-role client -- never depends on
  // the (possibly-broken) anon path to clean up after itself, and never
  // leaves a synthetic row behind regardless of outcome.
  const admin = getAdminClient();
  await admin.from("leads").delete().eq("email", email);

  if (insertError) {
    // Thrown, not just returned as JSON -- this is what Sentry's
    // onRequestError hook actually captures and alerts on.
    throw new Error(`Synthetic leads anon-insert check FAILED: ${insertError.message}`);
  }

  return NextResponse.json({ ok: true, checkedAt: new Date().toISOString() });
}
