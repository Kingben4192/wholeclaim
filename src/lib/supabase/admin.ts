import { createClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS. Use ONLY for:
//   1. Server-to-server routes with no user session (the Stripe webhook, the
//      deadline reminder cron).
//   2. Narrow Supabase Auth admin calls that have no anon-key equivalent
//      (generateLink for the grader's magic-link email; deleteUser for
//      self-service account deletion) — always scoped to the email/id the
//      caller already authenticated as or explicitly supplied, never used to
//      read or write another user's table rows.
// Never import this into a client bundle.
export function isServiceRoleConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
