// =============================================================================
// Ticket 3, Stage 4/5 — candidate persistence and hero rotation.
//
// Server-only. Uses the service-role client, so it must never be imported
// from a "use client" component.
//
// The three review outcomes, and why "park" exists:
//
//   approve  -> a new row in `polls`, status='published', featured=true.
//               The outgoing Top Story keeps status='published' and simply
//               loses featured -- it retains its votes, its URL, and its
//               place in its category. That satisfies "rotates into the
//               archive, not deleted" with no new status value and no schema
//               change.
//
//   park     -> a new row in `polls`, status='draft'. This is the Flock
//               multi-angle fix: one story yields four good questions, only
//               one can hold the hero, and the other three are tomorrow's
//               material rather than waste. Parking drops them into the
//               same draft review flow used for every other batch.
//
//   reject   -> nothing enters `polls`. The candidate row records the
//               decision so the audit trail shows what was proposed and
//               declined, not just what shipped.
// =============================================================================

import { getSupabaseAdminClient } from "../supabaseAdmin";

// Decision 3: a Top Story is due for review after 72 hours. This is a
// freshness *safeguard*, not an expiry -- nothing is unpublished automatically
// and no replacement is forced. It only surfaces the poll as due for a look.
export const TOP_STORY_MAX_AGE_HOURS = 72;

/** Next free poll id, e.g. "p52". Ids are pN by convention across the table. */
async function nextPollId(supabase) {
  const { data, error } = await supabase.from("polls").select("id");
  if (error) throw error;
  const max = (data || []).reduce((m, r) => {
    const n = parseInt(String(r.id).replace(/^p/, ""), 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `p${max + 1}`;
}

/**
 * Persist a drafting run. Passed candidates land as 'pending'; filter-rejected
 * ones land as 'rejected' with their reasons, so a later bad approval can be
 * traced to what the filter did or didn't catch at the time.
 */
export async function saveRun({ candidates = [], rejected = [] }) {
  const supabase = getSupabaseAdminClient();
  const rows = [
    ...candidates.map((s) => ({ ...toRow(s), status: "pending" })),
    ...rejected.map((s) => ({ ...toRow(s), status: "rejected", reviewed_at: new Date().toISOString() })),
  ];
  if (rows.length === 0) return { inserted: 0 };
  const { data, error } = await supabase.from("top_story_candidates").insert(rows).select("id");
  if (error) throw error;
  return { inserted: data.length };
}

function toRow(screened) {
  const c = screened.candidate || {};
  return {
    question: c.question || "",
    choices: c.choices || [],
    category: c.category || "trending",
    source_label: c.sourceHeadline || null,
    source_url: c.sourceUrl || null,
    rationale: c.rationale || null,
    hard_fails: screened.hardFails || [],
    soft_flags: screened.softFlags || [],
  };
}

/**
 * Pending candidates, grouped by source story.
 *
 * Grouping is the point, not a nicety. Four cards reading "Flock… Flock…
 * Flock… Flock…" is a different review task from four unrelated candidates:
 * the reviewer is choosing between framings of one story, and only one of
 * them can hold the hero.
 */
export async function listPendingGrouped() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("top_story_candidates")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const groups = new Map();
  for (const row of data || []) {
    const key = `${row.run_date}::${row.source_url || row.source_label || row.id}`;
    if (!groups.has(key)) {
      groups.set(key, { key, runDate: row.run_date, sourceLabel: row.source_label, sourceUrl: row.source_url, candidates: [] });
    }
    groups.get(key).candidates.push(row);
  }
  return [...groups.values()];
}

/** The current hero, plus whether it has passed the 72-hour safeguard. */
export async function getCurrentTopStory() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("polls")
    .select("id, question, publish_at, status, featured")
    .eq("featured", true)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const ageHours = data.publish_at
    ? (Date.now() - new Date(data.publish_at).getTime()) / 3600000
    : null;
  return {
    ...data,
    ageHours,
    dueForReview: ageHours !== null && ageHours > TOP_STORY_MAX_AGE_HOURS,
  };
}

/**
 * Apply a review decision.
 *
 * @param {number} candidateId
 * @param {"approve"|"park"|"reject"} action
 * @param {{question?:string, choices?:string[], category?:string, expiresAt?:string|null}} [edits]
 *        Inline corrections from the review screen. Editing is a first-class
 *        outcome: a candidate that only needs a word changed shouldn't have to
 *        be rejected and redrafted.
 *
 *        `expiresAt` matters more than it looks. Prediction-framed candidates
 *        routinely carry a built-in resolution date ("...by the end of 2026",
 *        "...this cycle"). Published without an expiry, such a poll keeps
 *        rendering as votable after it resolves while submit_vote() rejects
 *        every vote -- the p19 failure exactly. isLive() and submit_vote()
 *        both honour expires_at, so setting it here is the whole fix.
 */
export async function decide(candidateId, action, edits = {}) {
  const supabase = getSupabaseAdminClient();

  const { data: cand, error: readErr } = await supabase
    .from("top_story_candidates")
    .select("*")
    .eq("id", candidateId)
    .maybeSingle();
  if (readErr) throw readErr;
  if (!cand) throw new Error(`candidate ${candidateId} not found`);
  if (cand.status !== "pending") throw new Error(`candidate ${candidateId} already ${cand.status}`);

  const now = new Date().toISOString();

  if (action === "reject") {
    const { error } = await supabase
      .from("top_story_candidates")
      .update({ status: "rejected", reviewed_at: now })
      .eq("id", candidateId);
    if (error) throw error;
    return { action, publishedPollId: null };
  }

  const question = edits.question ?? cand.question;
  const choices = edits.choices ?? cand.choices;
  const category = edits.category ?? cand.category;
  const publishing = action === "approve";

  const pollId = await nextPollId(supabase);
  const { error: insErr } = await supabase.from("polls").insert({
    id: pollId,
    category,
    question,
    choices,
    status: publishing ? "published" : "draft",
    featured: publishing,
    source_label: cand.source_label,
    source_url: cand.source_url,
    promotion: null,
    // publish_at doubles as "went live at" -- it drives Newest Polls ordering
    // and the 72-hour freshness check. Only set when actually publishing.
    publish_at: publishing ? now : null,
    expires_at: edits.expiresAt ?? null,
  });
  if (insErr) throw insErr;

  if (publishing) {
    // Demote the outgoing hero. It stays published -- keeps its votes, its
    // URL, and its category placement. Only the hero flag moves.
    const { error: demoteErr } = await supabase
      .from("polls")
      .update({ featured: false })
      .eq("featured", true)
      .neq("id", pollId);
    if (demoteErr) throw demoteErr;
  }

  const { error: updErr } = await supabase
    .from("top_story_candidates")
    .update({
      status: publishing ? "approved" : "parked",
      published_poll_id: pollId,
      reviewed_at: now,
      question,
      choices,
      category,
    })
    .eq("id", candidateId);
  if (updErr) throw updErr;

  return { action, publishedPollId: pollId };
}
