// =============================================================================
// SupabaseVotingAdapter -- production replacement for DemoVotingAdapter.
//
// Matches the exact interface the UI already depends on:
//   getPollResults(pollId)          -> Promise<{ counts: number[], total: number }>
//   submitVote(pollId, choiceIndex) -> Promise<{ counts: number[], total: number }>
//   hasVotedLocally(pollId)         -> Promise<number | undefined>
//   recordLocalVote(pollId, choiceIndex)
//   getAllVotedLocally()            -> Promise<Record<string, number>>
//
// The UI component (PollView, FeaturedCard, HomeView, CategoryView) should
// need ZERO changes to use this instead of the demo adapter -- only the
// `votingService = DemoVotingAdapter` line in the artifact's App section
// changes to `votingService = SupabaseVotingAdapter`.
//
// Vote submission goes through a Next.js API route (see
// app/api/polls/vote/route.js), not directly from the browser to Supabase.
// That's what lets the server:
//   - hold the real one-vote-per-voter enforcement in an httpOnly cookie
//     the client can't edit (unlike window.storage/localStorage)
//   - compute a salted IP hash for rate limiting without exposing raw IPs
//     to the client or storing them in the votes table
//   - reject invalid poll ids / choice indexes before they ever reach the DB
//
// "hasVotedLocally" here is a CLIENT-SIDE CONVENIENCE CACHE ONLY -- it lets
// the UI skip an extra round trip and show "already voted" instantly. It is
// NOT the source of truth for vote integrity; the server's voter_token
// cookie + the votes table's unique constraint are. If a user clears this
// local cache, the server will still reject a second vote (they'll just see
// a "you already voted" response instead of the choice buttons being
// pre-hidden) -- this is expected and correct.
// =============================================================================

function choiceCountsFromRows(rows, choiceCount) {
  const counts = new Array(choiceCount).fill(0);
  rows.forEach((r) => {
    if (r.choice_index >= 0 && r.choice_index < choiceCount) {
      counts[r.choice_index] = Number(r.vote_count);
    }
  });
  return counts;
}

export function createSupabaseVotingAdapter({ supabase, pollsById }) {
  // pollsById: { [pollId]: { choices: string[] } } -- needed client-side
  // only to know how many choice slots to zero-fill; not used for validation
  // (validation is the server's job, both in the API route and in the
  // submit_vote() Postgres function -- see schema.sql).

  return {
    async getPollResults(pollId) {
      const choiceCount = pollsById[pollId]?.choices?.length || 0;
      const { data, error } = await supabase.rpc("get_poll_results", { p_poll_id: pollId });
      if (error) throw error;
      const counts = choiceCountsFromRows(data || [], choiceCount);
      return { counts, total: counts.reduce((a, b) => a + b, 0) };
    },

    async submitVote(pollId, choiceIndex) {
      // Always goes through the API route -- never calls supabase.rpc('submit_vote', ...)
      // directly from the client. The route is what attaches the voter
      // token cookie and IP hash server-side.
      const res = await fetch("/api/polls/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pollId, choiceIndex }),
      });
      const body = await res.json();
      if (!res.ok) {
        const err = new Error(body.error || "vote_failed");
        err.code = body.error;
        err.status = res.status;
        throw err;
      }
      return { counts: body.counts, total: body.total };
    },

    async hasVotedLocally(pollId) {
      try {
        const raw = window.localStorage.getItem("wdpt-voted-cache");
        if (!raw) return undefined;
        const map = JSON.parse(raw);
        return map[pollId];
      } catch (e) {
        return undefined;
      }
    },

    async recordLocalVote(pollId, choiceIndex) {
      let map = {};
      try {
        const raw = window.localStorage.getItem("wdpt-voted-cache");
        if (raw) map = JSON.parse(raw);
      } catch (e) {
        // ignore corrupt cache, start fresh
      }
      map[pollId] = choiceIndex;
      window.localStorage.setItem("wdpt-voted-cache", JSON.stringify(map));
      return map;
    },

    async getAllVotedLocally() {
      try {
        const raw = window.localStorage.getItem("wdpt-voted-cache");
        return raw ? JSON.parse(raw) : {};
      } catch (e) {
        return {};
      }
    },
  };
}
