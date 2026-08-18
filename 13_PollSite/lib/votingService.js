// =============================================================================
// The `votingService` singleton the UI components import.
//
// This closes the gap WIRING_NOTES.md flags as "may still need a one-line
// factory call to actually exist" -- the components import a ready-made
// `votingService`, but lib/votingService.supabase.js exports a FACTORY
// (createSupabaseVotingAdapter), not an instance. This file is the
// instantiation.
//
// Why the pollsById indirection: the adapter needs to know how many choice
// slots a poll has, so getPollResults() can zero-fill a full-length counts
// array rather than only the indexes that happen to have votes. That
// information lives in the database, and lib/polls.js reads it
// server-side. Rather than make every client component fetch it again,
// the server passes the live polls down and the client hydrates this map
// once on mount.
//
// The map is intentionally mutated in place rather than reassigned -- the
// adapter closed over this exact object reference at module load, so
// replacing the binding would leave the adapter pointing at the old empty
// object.
//
// If hydratePollsById() is never called, nothing breaks catastrophically:
// getPollResults() falls back to a zero-length counts array, and
// submitVote() is unaffected because the API route sizes its own response
// from get_poll_choice_count() server-side. But results would render with
// no bars, so call it.
// =============================================================================

"use client";

import { createClient } from "@supabase/supabase-js";
import { createSupabaseVotingAdapter } from "./votingService.supabase";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set. " +
      "The browser client needs both to read poll results via get_poll_results()."
  );
}

// Anon key only. This client can call get_poll_results() and nothing else
// that matters -- it cannot read the `votes` table directly (SELECT is
// revoked) and it cannot write a vote (submit_vote goes through
// /api/polls/vote with the service role, never from here).
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const pollsById = {};

/**
 * Populate the choice-count map from polls fetched server-side.
 * Accepts either an array of polls or an already-keyed object, so it works
 * with getLivePolls() or getPollsById() from lib/polls.js.
 */
export function hydratePollsById(polls) {
  if (!polls) return;
  const entries = Array.isArray(polls) ? polls : Object.values(polls);
  entries.forEach((poll) => {
    if (poll && poll.id) pollsById[poll.id] = poll;
  });
}

export const votingService = createSupabaseVotingAdapter({ supabase, pollsById });

export default votingService;
