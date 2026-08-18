// =============================================================================
// Server-only Supabase client for the admin dashboard, using the SERVICE
// ROLE key. This file must never be imported from a "use client" component
// or anything that ends up in the browser bundle -- it exists specifically
// so admin queries can read `votes` directly (bypassing RLS, which is fine
// here because this only ever runs on the server, with a key that never
// reaches the browser).
//
// Do not reuse the anon-key client from lib/votingService.supabase.js for
// admin queries -- that client is scoped to what the public app is allowed
// to see. This one is intentionally separate and more privileged.
// =============================================================================

import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set -- required for the admin dashboard."
    );
  }
  return createClient(url, key);
}
