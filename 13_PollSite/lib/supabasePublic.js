// =============================================================================
// Shared anon-key Supabase client for browser-side reads.
//
// Before this file, lib/polls.js and lib/votingService.js each created their
// own anon client, so the browser bundle carried two. HomeModules would have
// made three. One instance, imported everywhere, is both smaller and avoids
// three separate connection pools doing the same job.
//
// Anon key only. This client can read published poll rows and call the
// public aggregate RPCs. It cannot read `votes` (SELECT is revoked for anon)
// and cannot write a vote -- that goes through /api/polls/vote with the
// service role, server-side.
// =============================================================================

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set."
  );
}

export const supabasePublic = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
