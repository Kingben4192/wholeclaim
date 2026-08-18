// =============================================================================
// Poll lookup, in two halves.
//
// ASYNC half (server): fetchLivePolls(), getPollById(), getFeaturedPoll().
// These hit Postgres. Server components call them.
//
// SYNC half (client): getLivePolls(now), getLivePollsByCategory(catId, now),
// getCategoryMeta(catId), CATEGORIES. These read a hydrated in-memory cache
// and return arrays immediately.
//
// WHY BOTH. The artifact's helpers filtered an in-file POLLS array, so they
// were synchronous, and the ported components call them that way --
// `getLivePollsByCategory(c.id, now)[0]`, `.findIndex(...)`, `.length`.
// A database-backed async version returns a Promise, so every one of those
// call sites would break: two throw, two silently evaluate to undefined.
// Rather than rewrite five call sites inside components that are supposed to
// be a mechanical port, the async/sync boundary is resolved HERE: the server
// fetches once, hands the rows to hydratePolls(), and the sync accessors the
// components already expect keep working unchanged.
//
// HYDRATION CONTRACT. hydratePolls() must be called before any sync accessor
// reads. In practice that means calling it at the top of a client component's
// render body (see app/HomeClient.js), which runs before any child renders
// and contains no await -- so there is no window in which a child could read
// a half-populated cache, and no cross-request interleaving on the server
// during SSR. If a sync accessor is called before hydration it returns an
// empty array rather than throwing: a missing list degrades to an empty
// section, it does not take the page down.
//
// Uses the ANON key, never the service role key: these are public reads of
// public poll rows, and the `polls are publicly readable when published`
// RLS policy then does real work -- a draft poll (p18) is invisible at the
// database level, not merely filtered out in JS afterwards.
//
// WINDOW FILTERING IS NOT OPTIONAL. The RLS policy filters on
// `status = 'published'` ONLY -- it does not consider publish_at/expires_at.
// submit_vote() enforces both. Without isLive() below, an expired poll would
// render, show its choice buttons, and then reject every vote with a 400
// `poll_expired`. isLive() is a line-for-line match of the artifact's
// isPollLive() and of submit_vote()'s window checks -- keep all three in
// lockstep.
// =============================================================================

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set. " +
      "Set them in the Vercel project's environment variables before deploying."
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const POLL_COLUMNS =
  "id, category, question, choices, status, featured, source_label, source_url, promotion, publish_at, expires_at";

// Copied verbatim from the artifact source (Section 2) so the ported
// components import these rather than redeclaring them.
export const CATEGORIES = [
  { id: "politics", label: "Politics", emoji: "\u{1F5F3}️", accent: "#5B3A9E" },
  { id: "health", label: "Health", emoji: "\u{1FA7A}", accent: "#1F8A6F" },
  { id: "trending", label: "Trending", emoji: "\u{1F525}", accent: "#D9481E" },
  { id: "social", label: "Social Media", emoji: "\u{1F4F1}", accent: "#1D6FBF" },
  { id: "home", label: "Home & Money", emoji: "\u{1F3E0}", accent: "#8A6D2F" },
  { id: "sports", label: "Sports & Entertainment", emoji: "⚽", accent: "#B8281F" },
];

export function getCategoryMeta(catId) {
  return CATEGORIES.find((c) => c.id === catId);
}

// Postgres row -> the artifact's poll shape (`cat`, `q`, nested `source`).
// Absent optional fields stay `undefined` rather than null, matching the
// artifact, so the components' truthiness checks behave identically.
function toPoll(row) {
  const poll = {
    id: row.id,
    cat: row.category,
    q: row.question,
    choices: row.choices || [],
    status: row.status,
  };
  if (row.featured) poll.featured = true;
  if (row.source_label) poll.source = { label: row.source_label, url: row.source_url ?? null };
  if (row.promotion) poll.promotion = row.promotion;
  if (row.publish_at) poll.publishAt = row.publish_at;
  if (row.expires_at) poll.expiresAt = row.expires_at;
  return poll;
}

// Line-for-line equivalent of the artifact's isPollLive().
function isLive(poll, now) {
  if (poll.status !== "published") return false;
  if (poll.publishAt && new Date(poll.publishAt) > now) return false;
  if (poll.expiresAt && new Date(poll.expiresAt) < now) return false;
  return true;
}

function asDate(now) {
  if (now instanceof Date) return now;
  if (now === undefined || now === null) return new Date();
  const d = new Date(now);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

// ---------------------------------------------------------------------------
// The hydrated cache
// ---------------------------------------------------------------------------

let pollCache = [];
let hydrated = false;

/**
 * Load server-fetched polls into the sync cache. Idempotent -- safe to call
 * on every render. Accepts the array returned by fetchLivePolls().
 */
export function hydratePolls(polls) {
  if (!Array.isArray(polls)) return;
  pollCache = polls;
  hydrated = true;
}

export function isHydrated() {
  return hydrated;
}

// ---------------------------------------------------------------------------
// SYNC accessors -- what the components call
// ---------------------------------------------------------------------------

export function getLivePolls(now) {
  const t = asDate(now);
  return pollCache.filter((p) => isLive(p, t));
}

export function getLivePollsByCategory(catId, now) {
  return getLivePolls(now).filter((p) => p.cat === catId);
}

/**
 * The 🔥 Today's Question selection, over an already-fetched list. Mirrors
 * the artifact's selectFeaturedPoll() fallback chain exactly: a live
 * featured poll first, then an evergreen live poll, then whatever is live --
 * so the homepage card is never empty while any poll is live. Returns null
 * only when nothing at all is live, which the homepage renders as an absent
 * card rather than a fabricated one.
 */
export function selectFeaturedPoll(polls, now) {
  const t = asDate(now);
  const live = (polls || []).filter((p) => isLive(p, t));
  const featuredLive = live.filter((p) => p.featured);
  if (featuredLive.length > 0) return featuredLive[0];
  const evergreen = live.filter((p) => !p.expiresAt);
  if (evergreen.length > 0) return evergreen[0];
  return live[0] || null;
}

// ---------------------------------------------------------------------------
// ASYNC fetchers -- what server components (and one client bootstrap) call
// ---------------------------------------------------------------------------

/** Every currently votable poll, in curation order. */
export async function fetchLivePolls() {
  const { data, error } = await supabase
    .from("polls")
    .select(POLL_COLUMNS)
    .order("created_at", { ascending: true });

  if (error) throw error;

  const now = new Date();
  return (data || []).map(toPoll).filter((p) => isLive(p, now));
}

/**
 * Returns the poll if it exists AND is currently votable, otherwise null.
 * Callers treat null as a 404 (see app/poll/[pollId]/page.js).
 */
export async function getPollById(pollId) {
  if (typeof pollId !== "string" || !pollId.trim()) return null;

  const { data, error } = await supabase
    .from("polls")
    .select(POLL_COLUMNS)
    .eq("id", pollId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const poll = toPoll(data);
  return isLive(poll, new Date()) ? poll : null;
}

/** Server-side convenience: fetch, then pick the featured poll. */
export async function getFeaturedPoll() {
  return selectFeaturedPoll(await fetchLivePolls());
}

/** { [pollId]: Poll } -- the shape createSupabaseVotingAdapter() expects. */
export async function getPollsById() {
  const live = await fetchLivePolls();
  return Object.fromEntries(live.map((p) => [p.id, p]));
}
