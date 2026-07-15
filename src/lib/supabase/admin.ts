import { createClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS. Use ONLY for the Stripe webhook route,
// which runs server-to-server with no user session to authenticate as.
// Never import this into any user-request code path or client bundle.
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
