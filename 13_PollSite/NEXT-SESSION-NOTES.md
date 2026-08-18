# Outstanding transfers and open items

## Files received in conversation but NOT on disk

Resend these if this session's context is lost:

- `lib/adminQueries.js` — rev. 7 version (adds `checkAndUnwrap()`, switches
  `getAllPollResults()` to `admin_poll_choice_totals()`, adds
  `getPipelineStatus()`). **Disk copy is rev. 4 and is stale.**
- `app/admin/page.js` — the dashboard, including the "Needs a look"
  pipeline section. **Never written to disk.**
- `supabase/queries.sql` — rev. 7 version with the corrected query-6 comment.
  **Disk copy is rev. 2.**

Everything else is current as of rev. 8.

## Never received in any revision

- `components/shared.js`, `FeaturedCard.js`, `HomeView.js`,
  `CategoryView.js`, `PollView.js` — **the only remaining hard blocker.**
  Send in their own message with nothing else alongside; six attempts have
  now truncated when bundled with the handoff document and SQL.
- `components/WIRING_NOTES.md`
- `TRENDING_POLL_PIPELINE.md`
- `public/og-default.png`

## One deviation from verbatim preservation

I added a `PERFORMANCE NOTE` paragraph to `isIpOverAttemptLimit()`'s comment
block in `app/api/polls/vote/route.js`, pointing at
`supabase/schema-additions.sql`. Everything else in that file is as
transmitted. Flagging because every other preserved file is untouched.

## Open, unfixed

1. **`WDPT_IP_HASH_SALT` unset silently disables all IP rate limiting.**
   `hashIp()` returns null when the salt is missing, so every `ip_hash` is
   null. `isIpOverAttemptLimit()` returns false on null, and `submit_vote`'s
   limiter is inside `if p_ip_hash is not null`. One missing env var removes
   both rate limits, logs nothing identifiable, and raises no error. Fail
   loudly at boot instead — the same pattern `page.js` already uses for
   `NEXT_PUBLIC_SITE_URL`.
2. **Shared-IP collateral.** Both limiters key on ip_hash at 20/60s. Users
   behind one NAT (office, school, mobile carrier) share a budget. Fine at
   Phase 1 volume; revisit if a legitimate cluster gets 429s.
3. **`set search_path = public` omits `pg_temp`** on all six SECURITY
   DEFINER functions. PostgreSQL's guidance is to list `pg_temp` last.
4. **`revoke select on votes`** covers SELECT only; write grants survive.
   Only matters if RLS is ever disabled.
5. **`p13` miscategorised** — award-shows/TV question filed under `sports`.
6. **`getActivityByDay()` / `getRejectionStats()`** still pull unpaginated
   rows (1,000-row cap). Acknowledged as deferred; the rejection log will
   hit it first under abuse traffic.
7. **`vote_attempt_log.reason` comment is stale** — doesn't list
   `invalid_request_body` or `invalid_poll_id`, both of which rev. 7 added.
   No CHECK constraint, so nothing enforces the list either way.

## Kits-site poll (separate product, live)

`property-record-poll.vercel.app` root serves the Kit 1 **sales page**; the
poll is at `/poll.html` and records nothing (`CAPTURE_ENABLED = false`,
capture never implemented). Verified live 2026-08-16. Any "testing demand"
post needs either a capture backend or copy that matches reality.
