// =============================================================================
// POST /api/polls/vote
// Body: { pollId: string, choiceIndex: number }
//
// This route is the ONLY place a vote gets written. The browser never talks
// to Supabase's submit_vote RPC directly -- it always goes through here, so
// this server can:
//   1. Read/set an httpOnly, Secure voter-token cookie the client JS can't
//      read or edit (unlike window.storage/localStorage in the prototype).
//   2. Compute a salted hash of the request IP for rate limiting, without
//      ever storing or exposing the raw IP.
//   3. Validate the request shape before it reaches Postgres.
//
// Uses the Supabase SERVICE ROLE key (server-only env var), not the anon
// key -- this route runs on the server, never in the browser bundle.
// =============================================================================

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID, createHash } from "crypto";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // server-only -- never NEXT_PUBLIC_*
);

const VOTER_COOKIE = "wdpt_voter";
const IP_SALT = process.env.WDPT_IP_HASH_SALT; // set a random long string in env; rotate if ever leaked

if (!IP_SALT) {
  // hashIp() below returns null whenever IP_SALT is falsy, which means
  // EVERY rate limiter in this file -- the Postgres-side check inside
  // submit_vote (keyed on ip_hash) and isIpOverAttemptLimit() below --
  // silently no-ops instead of erroring. A forgotten env var would
  // quietly turn off abuse protection with zero indication anything was
  // wrong, discoverable only after the fact by an actual abuse incident.
  // Fail loudly at boot instead, matching the pattern already used for
  // ADMIN_PASSWORD/ADMIN_SESSION_SECRET/NEXT_PUBLIC_SITE_URL.
  throw new Error(
    "WDPT_IP_HASH_SALT is not set -- both rate limiters in this route " +
      "depend on it and will silently do nothing without it. Set it in " +
      "the Vercel project's environment variables before deploying."
  );
}

function hashIp(ip) {
  if (!ip) return null; // no IP available (e.g. local dev without x-forwarded-for) -- IP_SALT itself is guaranteed present past the check above
  return createHash("sha256").update(`${IP_SALT}:${ip}`).digest("hex");
}

function getClientIp(req) {
  // Vercel sets x-forwarded-for; take the first (client) address.
  const fwd = req.headers.get("x-forwarded-for");
  return fwd ? fwd.split(",")[0].trim() : null;
}

// Logs a REJECTED attempt for Phase 1 internal measurement only (Step 6 of
// the deployment handoff). Never surfaced to the client, never used to
// identify an individual person -- see supabase/queries.sql for how this
// is read.
async function logRejectedAttempt(pollId, reason, ipHash) {
  try {
    await supabase.from("vote_attempt_log").insert({ poll_id: pollId, reason, ip_hash: ipHash });
  } catch (e) {
    // Logging failure should never block the response to the client.
    console.error("failed to log rejected vote attempt:", e);
  }
}

const LOG_RATE_LIMIT_MAX = 20;
const LOG_RATE_LIMIT_WINDOW_SECONDS = 60;

// Real vulnerability fixed here (found in review, not by me): the previous
// version logged every request-level rejection (malformed JSON, invalid
// pollId, invalid choiceIndex) with NO rate limit ahead of it, because the
// only rate limit in this system lives inside the submit_vote Postgres
// function -- which malformed requests never reach. That meant anyone
// could POST garbage JSON to this route indefinitely and each one would
// write a free, unrate-limited row to vote_attempt_log: unbounded storage
// growth, and it directly pollutes the exact dashboard metric
// (getRejectionStats / getPipelineStatus) that table exists to measure.
//
// This checks, BEFORE logging or doing any other work, whether this IP has
// already logged too many attempts recently. If so, the request is
// rejected immediately with no further log write -- so an attacker gets
// logged up to the cap once, then silently stops costing us storage,
// mirroring the same per-IP budget submit_vote already enforces for real
// vote attempts.
async function isIpOverAttemptLimit(ipHash) {
  if (!ipHash) return false; // no IP available (e.g. local dev) -- can't rate-limit what we can't identify
  const since = new Date(Date.now() - LOG_RATE_LIMIT_WINDOW_SECONDS * 1000).toISOString();
  const { count, error } = await supabase
    .from("vote_attempt_log")
    .select("*", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", since);
  if (error) {
    // If we can't check, fail open on rate limiting but the request still
    // goes through normal validation below -- don't let a measurement
    // check itself become an outage vector.
    console.error("failed to check attempt rate limit:", error);
    return false;
  }
  return (count || 0) >= LOG_RATE_LIMIT_MAX;
}

export async function POST(req) {
  const ipHashEarly = hashIp(getClientIp(req));

  // Rate-limit check happens before ANYTHING else, including JSON parsing
  // -- this is what closes the free-write vulnerability described above.
  // A request that's already over the per-IP attempt budget gets a plain
  // 429 with no log write, no matter how malformed the body is.
  if (await isIpOverAttemptLimit(ipHashEarly)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body;
  try {
    body = await req.json();
  } catch (e) {
    // Request-level rejections (malformed JSON, missing/wrong-typed
    // fields) previously returned early without ever touching
    // vote_attempt_log -- meaning malformed-input probing left no trace
    // in the same table that's supposed to surface abuse patterns. Every
    // rejection path, not just the ones Postgres itself raises, now logs
    // -- but only up to the per-IP cap checked above.
    await logRejectedAttempt(null, "invalid_request_body", ipHashEarly);
    return NextResponse.json({ error: "invalid_request_body" }, { status: 400 });
  }

  const { pollId, choiceIndex } = body || {};

  if (typeof pollId !== "string" || !pollId.trim()) {
    await logRejectedAttempt(typeof pollId === "string" ? pollId : null, "invalid_poll_id", ipHashEarly);
    return NextResponse.json({ error: "invalid_poll_id" }, { status: 400 });
  }
  if (!Number.isInteger(choiceIndex) || choiceIndex < 0) {
    await logRejectedAttempt(pollId, "invalid_choice_index", ipHashEarly);
    return NextResponse.json({ error: "invalid_choice_index" }, { status: 400 });
  }

  // Get or create the anonymous voter token from an httpOnly cookie.
  const existingToken = req.cookies.get(VOTER_COOKIE)?.value;
  const voterToken = existingToken || randomUUID();

  const ipHash = ipHashEarly;

  const { data, error } = await supabase.rpc("submit_vote", {
    p_poll_id: pollId,
    p_choice_index: choiceIndex,
    p_voter_token: voterToken,
    p_ip_hash: ipHash,
  });

  if (error) {
    // Postgres unique_violation from the (poll_id, voter_token) constraint
    // means this voter already voted on this poll.
    if (error.code === "23505") {
      await logRejectedAttempt(pollId, "already_voted", ipHash);
      return NextResponse.json({ error: "already_voted" }, { status: 409 });
    }
    const knownErrors = [
      "poll_not_found",
      "poll_not_published",
      "poll_not_yet_live",
      "poll_expired",
      "invalid_choice_index",
      "rate_limited",
    ];
    const message = error.message || "";
    const matched = knownErrors.find((code) => message.includes(code));
    if (matched === "rate_limited") {
      await logRejectedAttempt(pollId, "rate_limited", ipHash);
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
    if (matched) {
      await logRejectedAttempt(pollId, matched, ipHash);
      return NextResponse.json({ error: matched }, { status: 400 });
    }
    // Unrecognized DB error -- don't leak internals to the client.
    console.error("submit_vote error:", error);
    return NextResponse.json({ error: "vote_failed" }, { status: 500 });
  }

  const choiceCountResult = await supabase.rpc("get_poll_choice_count", { p_poll_id: pollId });
  // This poll was already validated to exist inside submit_vote above, so a
  // missing count here would indicate a real problem rather than a normal
  // case -- fall back to inferring from returned rows only as a last
  // resort, never silently truncate below what submit_vote itself
  // validated the choiceIndex against.
  const choiceCount =
    choiceCountResult.data ??
    Math.max(...(data || []).map((r) => r.choice_index), choiceIndex) + 1;

  const counts = new Array(choiceCount).fill(0);
  (data || []).forEach((r) => {
    if (r.choice_index < counts.length) counts[r.choice_index] = Number(r.vote_count);
  });
  const total = counts.reduce((a, b) => a + b, 0);

  const res = NextResponse.json({ counts, total });
  res.cookies.set(VOTER_COOKIE, voterToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
  });
  return res;
}
