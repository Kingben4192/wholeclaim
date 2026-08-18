// =============================================================================
// Admin dashboard data layer. Every function here queries Supabase directly
// with the service role client (lib/supabaseAdmin.js) and returns EITHER
// real data OR an explicit error -- never a fabricated/placeholder number.
// Callers (app/admin/page.js) are responsible for rendering an error state
// when `error` is present, not silently substituting 0 or "--".
//
// This file is server-only. It must never be imported from a client
// component.
//
// IMPORTANT: supabase-js does NOT throw on a failed query by default -- it
// resolves with { data: null, error: {...} }. Every query result in this
// file is checked for `.error` explicitly and re-thrown so wrap() below can
// catch it; a `.then((r) => r.count)` or `.then((r) => r.data)` that skips
// this check will silently turn a real failure into `null`, which then
// renders as a fabricated 0 in the UI -- exactly what this dashboard is
// not supposed to do. If you add a new query here, follow the same
// checkAndUnwrap() pattern.
// =============================================================================

import { getSupabaseAdminClient } from "./supabaseAdmin";

function wrap(promise) {
  return promise
    .then((data) => ({ data, error: null }))
    .catch((error) => ({ data: null, error: error.message || String(error) }));
}

// Every raw supabase-js call in this file should be passed through this
// helper before `.then()`-ing further -- it's the single place that turns
// a query-level `{ error }` into a thrown exception, so wrap() above can
// always catch it consistently.
function checkAndUnwrap(result) {
  if (result.error) throw result.error;
  return result;
}

// 1-4: top-line scorecard numbers
export async function getScorecard() {
  const supabase = getSupabaseAdminClient();

  const [totalVotes, votesToday, votesLast7d, activePolls] = await Promise.all([
    wrap(
      supabase
        .from("votes")
        .select("*", { count: "exact", head: true })
        .then((r) => checkAndUnwrap(r).count)
    ),
    wrap(
      supabase
        .from("votes")
        .select("*", { count: "exact", head: true })
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .then((r) => checkAndUnwrap(r).count)
    ),
    wrap(
      supabase
        .from("votes")
        .select("*", { count: "exact", head: true })
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .then((r) => checkAndUnwrap(r).count)
    ),
    wrap(
      supabase
        .from("polls")
        .select("*", { count: "exact", head: true })
        .eq("status", "published")
        .then((r) => checkAndUnwrap(r).count)
    ),
  ]);

  return { totalVotes, votesToday, votesLast7d, activePolls };
}

// 5: polls ranked by total votes ("Most answered")
export async function getPollsByTotalVotes(limit = 10) {
  const supabase = getSupabaseAdminClient();
  return wrap(
    supabase
      .rpc("admin_poll_vote_totals")
      .then((r) => {
        const { data } = checkAndUnwrap(r);
        return (data || []).sort((a, b) => b.total_votes - a.total_votes).slice(0, limit);
      })
  );
}

// 6: polls ranked by recent (last 24h) activity
export async function getPollsByRecentActivity(limit = 10) {
  const supabase = getSupabaseAdminClient();
  return wrap(
    supabase
      .rpc("admin_poll_recent_activity", { p_hours: 24 })
      .then((r) => {
        const { data } = checkAndUnwrap(r);
        return (data || []).sort((a, b) => b.recent_votes - a.recent_votes).slice(0, limit);
      })
  );
}

// 7: full per-poll breakdown -- question, category, status, total, per-choice %/count
//
// Uses admin_poll_choice_totals(), a Postgres-side GROUP BY poll_id,
// choice_index, so the result set is bounded by (number of polls x choices
// per poll) -- at most a few hundred rows even at heavy vote volume -- NOT
// by total vote count. The previous version pulled every individual vote
// row into JS and counted client-side, which silently truncated at
// PostgREST's default 1,000-row response cap once total votes across all
// polls passed 1,000; every per-poll total, percentage, and the category
// totals derived from them would have quietly under-reported with no
// error shown, right as Phase 1 started actually working.
export async function getAllPollResults() {
  const supabase = getSupabaseAdminClient();
  return wrap(
    (async () => {
      const { data: polls, error: pollsError } = await supabase
        .from("polls")
        .select("id, category, question, status, choices, publish_at, expires_at")
        .order("created_at", { ascending: true });
      if (pollsError) throw pollsError;

      const choiceTotalsResult = await supabase.rpc("admin_poll_choice_totals");
      const { data: choiceTotals } = checkAndUnwrap(choiceTotalsResult);

      const now = new Date();

      return (polls || []).map((poll) => {
        const choices = poll.choices || [];
        const counts = new Array(choices.length).fill(0);
        (choiceTotals || [])
          .filter((row) => row.poll_id === poll.id)
          .forEach((row) => {
            if (row.choice_index >= 0 && row.choice_index < counts.length) {
              counts[row.choice_index] = Number(row.vote_count);
            }
          });
        const total = counts.reduce((a, b) => a + b, 0);

        let liveStatus = "DRAFT";
        if (poll.status === "archived") liveStatus = "ARCHIVED";
        else if (poll.status === "published") {
          const notYetLive = poll.publish_at && new Date(poll.publish_at) > now;
          const expired = poll.expires_at && new Date(poll.expires_at) < now;
          liveStatus = expired ? "EXPIRED" : notYetLive ? "DRAFT" : "LIVE";
        }

        return {
          id: poll.id,
          question: poll.question,
          category: poll.category,
          status: poll.status,
          liveStatus, // LIVE | DRAFT | EXPIRED | ARCHIVED -- the display badge
          total,
          choices: choices.map((label, idx) => ({
            label,
            count: counts[idx],
            pct: total > 0 ? Math.round((counts[idx] / total) * 100) : 0,
          })),
        };
      });
    })()
  );
}

// 8: category totals
export async function getCategoryTotals() {
  const result = await getAllPollResults();
  if (result.error) return result;
  const byCategory = {};
  result.data.forEach((p) => {
    byCategory[p.category] = (byCategory[p.category] || 0) + p.total;
  });
  return { data: byCategory, error: null };
}

// 9: voting activity over time (by day, last 14 days -- enough to see a trend without a heavy query)
//
// NOTE: this still pulls individual `created_at` values rather than
// aggregating in Postgres, so it carries the same 1,000-row PostgREST cap
// risk as the old getAllPollResults() did once daily volume across a
// 14-day window exceeds ~1,000 votes. Acceptable for Phase 1 volumes;
// worth converting to a date_trunc('day', created_at) GROUP BY query
// server-side (same pattern as admin_poll_choice_totals) if/when daily
// volume approaches that range -- flagging now rather than waiting for it
// to silently under-report the same way the other bug did.
export async function getActivityByDay(days = 14) {
  const supabase = getSupabaseAdminClient();
  return wrap(
    supabase
      .from("votes")
      .select("created_at")
      .gte("created_at", new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .then((r) => {
        const { data } = checkAndUnwrap(r);
        const byDay = {};
        (data || []).forEach((row) => {
          const day = row.created_at.slice(0, 10); // YYYY-MM-DD
          byDay[day] = (byDay[day] || 0) + 1;
        });
        return byDay;
      })
  );
}

// 10: duplicate-vote rejection count (from vote_attempt_log, if populated)
//
// NOTE: same unpaginated-row-pull exposure as getActivityByDay() -- and
// arguably a sharper one. A bot/spam storm generates many MORE rejected
// attempts per unit time than legitimate distinct voters generate real
// votes (every retry, every probe, every duplicate attempt is a row here),
// so vote_attempt_log is realistically the table most likely to hit
// PostgREST's 1,000-row default cap FIRST, before votes itself ever would.
// Acceptable at current Phase 1 traffic; convert to a server-side
// `group by reason` aggregate (same pattern as admin_poll_choice_totals)
// before real abuse traffic -- not just real vote traffic -- would reach
// that volume.
export async function getRejectionStats() {
  const supabase = getSupabaseAdminClient();
  return wrap(
    supabase
      .from("vote_attempt_log")
      .select("reason")
      .then((r) => {
        const { data } = checkAndUnwrap(r);
        const byReason = {};
        (data || []).forEach((row) => {
          byReason[row.reason] = (byReason[row.reason] || 0) + 1;
        });
        return byReason;
      })
  );
}

// Content-freshness visibility for the Trending Poll Pipeline
// (TRENDING_POLL_PIPELINE.md). Read-only, same as everything else on this
// dashboard -- this does NOT let the operator edit or publish polls from
// the browser; it just surfaces what needs a look, so the pipeline's
// "review" step has somewhere concrete to start.
export async function getPipelineStatus() {
  const supabase = getSupabaseAdminClient();
  return wrap(
    (async () => {
      const now = new Date();
      const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const { data: polls, error } = await supabase
        .from("polls")
        .select("id, category, question, status, expires_at");
      if (error) throw error;

      const drafts = (polls || []).filter((p) => p.status === "draft");
      const expiringSoon = (polls || []).filter(
        (p) => p.status === "published" && p.expires_at && new Date(p.expires_at) > now && new Date(p.expires_at) < soon
      );
      const alreadyExpiredButStillPublished = (polls || []).filter(
        (p) => p.status === "published" && p.expires_at && new Date(p.expires_at) < now
      );

      return { drafts, expiringSoon, alreadyExpiredButStillPublished };
    })()
  );
}
