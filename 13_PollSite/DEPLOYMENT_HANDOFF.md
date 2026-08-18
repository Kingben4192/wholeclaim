# What Do People Think? — Deployment Handoff for Claude Code

## Non-negotiable boundary
Build and deploy this as a **standalone polling product**.
- Do NOT modify, redeploy, or connect the existing WholeClaim production app.
- Do NOT touch WholeClaim's Vercel project or Supabase project.
- Do NOT begin Facebook promotion or any public outreach.
- Report exact remaining blockers before any public promotion — do not
  declare this "ready" until every item below is actually verified, not
  just implemented.

## Phase 1 product scope

The entire Phase 1 user experience is: **see question → choose answer →
see live percentage → optionally share.** Nothing else.

Do NOT add any of the following in Phase 1, even in a minimal or private
form, even if it seems like an easy addition while building something
adjacent:
- ❌ Comments or public replies
- ❌ A "why did you choose this?" field — public OR private/unpublished.
  A private free-text field creates the same moderation/legal-review
  problem at smaller scale without helping answer the Phase 1 question.
- ❌ User-created polls
- ❌ A social feed
- ❌ Likes/reactions
- ❌ Profiles or followers
- ❌ Messaging
- ❌ A public moderation system (not needed if none of the above exist)

This is the same boundary already stated in the artifact's governance
comment ("No user-created polls, comments, or a social feed in this phase
— every poll here is curated") — carry it forward unchanged into the
production build, don't relax it because a real backend now makes some of
these technically easier to add.

The Phase 1 question is narrower than "do people want to discuss this" —
it's "will people voluntarily vote at all." The measurement queries in
`supabase/queries.sql` (total votes, votes per poll/category, votes over
time, duplicate-vote attempts, which questions attract participation) are
sufficient to answer that. If real usage surfaces demand for people to
explain their answer, that's evidence for a deliberately-scoped Phase 2
feature with real moderation tooling — not something to pre-build now.

Starting files (already written, in this handoff):
- `supabase/schema.sql` — votes table, RLS, `submit_vote` / `get_poll_results` / `get_poll_choice_count` functions, `vote_attempt_log` for rejected-attempt tracking, `admin_poll_vote_totals` / `admin_poll_recent_activity` (service-role-only, power the dashboard)
- `supabase/seed.sql` — the current 23 curated polls, extracted verbatim from the artifact source (poll-prototype.jsx `POLLS` array), not reconstructed from memory. Run after `schema.sql`. `p18` seeds as `status: 'draft'` intentionally — see its comment.
- `supabase/queries.sql` — read-only Phase 1 measurement queries (Supabase SQL editor) — now the fallback/debugging tool now that Step 7 adds a proper dashboard, still useful for anything not covered on the dashboard
- `lib/votingService.supabase.js` — production adapter matching the existing `votingService` interface
- `app/api/polls/vote/route.js` — server-side vote endpoint (voter cookie, rate limit, validation, rejection logging)
- `app/poll/[pollId]/page.js` — real per-poll route with `generateMetadata` for OG tags
- `lib/supabaseAdmin.js`, `lib/adminAuth.js`, `lib/adminQueries.js`, `middleware.js`, `app/admin/**`, `app/api/admin/**` — the private owner dashboard (Step 7)
- `components/artifact-source-reference.jsx` — the exact, current artifact source (one dead duplicate `HomeView` found and removed, `p19` corrected to `archived` to match `seed.sql` — see `components/WIRING_NOTES.md`)
- `components/shared.js`, `FeaturedCard.js`, `HomeView.js`, `CategoryView.js`, `PollView.js` — the actual UI components, extracted verbatim as five separate files (split specifically to avoid transmission truncation on a single large file)
- `components/WIRING_NOTES.md` — how to wire those components to `lib/polls.js`'s real API and the Supabase voting adapter; deliberately does not guess at unconfirmed function names
- `TRENDING_POLL_PIPELINE.md` — the ongoing, repeatable process for adding timely poll content without breaking the curated-only model or the safety filter. This is a process document, not automation — read it before treating "keeping the poll set current" as something the code alone handles.

### Fixes applied after review (do not re-flag these — they're resolved)
A review pass on the original four files found seven real defects, two of them coupled. All are fixed in the versions of these files included in this handoff:
1. `votes` had a `using (true)` SELECT policy exposing `voter_token` and `ip_hash` to the anon key. Removed; replaced with an explicit `revoke select on votes from anon, authenticated`. Results are exposed only through `get_poll_results()`.
2. Because (1) closes direct table access, `get_poll_results()` is now `security definer` with a pinned `search_path` — otherwise it would silently return zero rows for every poll instead of erroring.
3. `submit_vote` now also has `set search_path = public` pinned (Supabase's linter flags a `security definer` function without one — search_path hijacking risk).
4. `route.js` no longer sizes the `counts` array from the highest voted choice index (which under-reported choice count on polls with votes only on a middle index). Added `get_poll_choice_count()` and route.js now sizes the array from the poll's actual choice count.
5. `page.js` now awaits `params` before using it (this Next.js version resolves `params` as a Promise).
6. `page.js` now calls `notFound()` when a poll doesn't exist/isn't published, instead of rendering `PollClient` with `initialPoll={null}`.
7. `page.js` now throws a clear build/boot-time error if `NEXT_PUBLIC_SITE_URL` is unset, instead of silently producing `undefined/og-default.png` in the OG tags.

If re-reviewing, focus on the files not yet written (below) and on confirming these fixes actually behave correctly once deployed — a static read of the fix isn't the same as testing it against a live RLS policy.

### Fixes applied after second review pass (rev. 5 — do not re-flag these, they're resolved)
1. **`schema.sql` truncation**: the version you received cut off mid-`submit_vote`. Not a file problem on the authoring side — the complete file (`admin_poll_vote_totals`, `admin_poll_recent_activity`, and a new `admin_poll_choice_totals`, described below) is included in full in this handoff. If it arrives truncated again, that's a transmission issue on this end — flag it immediately rather than guessing at the missing content.
2. **`p19` (World Cup) was stale in both date and substance**: seeded as `published` with `expires_at` in the past relative to today's date, meaning it would have rendered as a normal votable poll while `submit_vote` silently rejected every vote with `poll_expired` — exactly the "looks votable, isn't" trap Phase 1 can't afford. Re-seeded as `status: 'archived'`. If a World Cup poll is wanted again, write a new past-tense question rather than reviving this one.
3. **`middleware.js` used Node's `crypto` module** (`createHmac`, `timingSafeEqual`, `Buffer`), which doesn't exist on the Edge runtime middleware runs on by default. Rewrote `lib/adminAuth.js` entirely on the Web Crypto API (`crypto.subtle`), which is standard and available on both Edge and Node — no runtime declaration needed. `isValidSession` and `checkAdminPassword` are now async; all three call sites (`middleware.js`, the login route, `app/admin/page.js`) updated to await them.
4. **`checkAdminPassword` wasn't actually constant-time** — it short-circuited on a raw length mismatch before reaching `timingSafeEqual`, leaking the real password's length via response timing. Fixed by hashing both the candidate and the real password to fixed-length SHA-256 digests *before* comparing, so there's no length to leak in the first place, then comparing every character of the two digests regardless of where a mismatch occurs.
5. **`getAllPollResults()` pulled every individual vote row into JS** and counted client-side — silently capped at PostgREST's default 1,000-row response limit, meaning every per-poll total, percentage, and the category totals derived from them would have quietly under-reported once total votes across all polls passed 1,000, with no error shown. Added `admin_poll_choice_totals()`, a Postgres-side `GROUP BY poll_id, choice_index` — bounded by (polls × choices per poll), not by vote volume. `getAllPollResults()` now calls that instead.
6. **Several Supabase query results were unwrapped without checking `.error`** (e.g. `.then((r) => r.count)`), which matters because supabase-js does not throw on a failed query — it resolves normally with `{ data: null, error: {...} }`. A failed query would silently become `null`/`undefined`, and `ScorecardCell` rendering `result.data ?? 0` turned that into a fabricated "0 total votes" with no visible error — precisely the fallback this dashboard was built to avoid. Added a `checkAndUnwrap()` helper used on every raw query result in `lib/adminQueries.js`; a failed query now always surfaces as a real error state, never a silent zero.
7. **`getActivityByDay()` has the same row-cap exposure** as #5 did, not yet fixed — flagged in a comment in the file rather than silently left. Acceptable at Phase 1 volumes (14 days × realistic vote counts won't approach 1,000 soon), but convert it to a `date_trunc`-based server-side aggregate before it would, the same pattern used for `admin_poll_choice_totals`.
8. **Session revocation**: sessions are stateless (HMAC-signed cookie, no server-side session store), so there's no per-session revoke. Documented in `lib/adminAuth.js`: rotating `ADMIN_SESSION_SECRET` in the environment and redeploying invalidates every existing session cookie at once. That's the actual answer if "kick out an active session" comes up — not an unaddressed gap.

### Fixes applied after third review pass (rev. 6)
1. **`p19` disagreed between the artifact and `seed.sql`**: the artifact still had it `published` while `seed.sql` (correctly) archived it. This was my own inconsistency — the seed file's copy was fixed when the World Cup staleness issue was caught, but the canonical artifact, which is supposed to be the single source of truth, wasn't updated to match. Fixed: the artifact now also has `p19` as `archived`. **If re-exporting poll data from the artifact in the future, both files should always agree — a mismatch here means one of them wasn't actually updated.**
2. **`schema.sql` and the component reference arrived truncated/spliced in transit** (again) — verified locally that both source files were complete and correctly ordered (schema.sql: 12.6KB, balanced braces/parens throughout). The corruption happened during transmission, not in the authored content. Resent both directly as files this round, and split the previous single large component-reference dump into five separate, smaller files (below) specifically to avoid hitting whatever size limit caused the truncation.
3. **Three specific "possibly broken" call-sites flagged as unverified** (unawaited `checkAdminPassword` in the login route, unawaited `isValidSession` in `app/admin/page.js`, the scorecard's `?? 0` fabricated-zero pattern) — checked directly against the actual source files: all three were already correctly fixed in rev. 5 (`await` present in all three places, `checkAndUnwrap()` used throughout `adminQueries.js`). These were speculative concerns based on incomplete transmission, not confirmed bugs — flagging them as "haven't seen the file" was the right instinct rather than assuming broken. No code change needed for these three; noted here so they aren't re-flagged as still-open.

### Components — five separate real files now, not one dump
`components/` contains:
- `shared.js`, `FeaturedCard.js`, `HomeView.js`, `CategoryView.js`, `PollView.js` — each extracted verbatim from the current artifact, each independently small (under 13KB), each marked `"use client"` with explicit imports pointing at `lib/polls.js`'s exports (`CATEGORIES`, `getCategoryMeta`, `getLivePollsByCategory`, `getFeaturedPoll`) and a `lib/votingService.js` singleton that may still need a one-line factory call to actually exist (flagged honestly in `WIRING_NOTES.md` as a possible remaining small gap, not assumed to already be there).
- `artifact-source-reference.jsx` — the full corrected artifact, kept for cross-reference.
- `WIRING_NOTES.md` — updated for the five-file split and which import names are assumed vs. confirmed.

### Two decisions, not defects — need the operator's call, not a silent fix
- **`p9`/`p10` link to `getwholeclaim.com`** (the promotion metadata on those two Home & Money polls). This makes an otherwise-standalone product carry a WholeClaim funnel. This was a deliberate, explicit choice (`promotion` is opt-in poll metadata, never inferred from category — see the artifact's governance comment), not an oversight. Keep as-is unless the operator wants it removed for this deployment.

Note on cleanup: `useSessionId()`, `visitedPolls`, and the unused `ready` flag flagged in earlier review passes have already been removed from the current artifact source — no action needed on those specifically. Still confirm nothing equivalent was reintroduced while porting the artifact's components into the Next.js app structure.

Not yet written (Claude Code should build these as part of this task):
- `lib/polls.js` — server-side poll lookup, migrating the `POLLS` array from the artifact into either Postgres (a `polls` table row per poll, matching `schema.sql`) or a versioned config module read at build/request time
- `app/poll/[pollId]/PollClient.js` — the client component wrapping the existing `PollView`/`FeaturedCard` UI logic from the artifact, wired to `votingService.supabase.js`
- `app/page.js` — the homepage (`HomeView` from the artifact), server component shell + client interactivity
- `public/og-default.png` — one static branded share image (1200×630) as a fallback until a per-poll dynamic OG image exists

## Step 1 — Vercel hosting
1. Create a **new, separate Vercel project for this app using the polling product's own repository/project scope.** Do not import or reuse WholeClaim environment variables, Supabase credentials, domains, deployment hooks, or production resources.
2. Confirm the project builds and deploys to a Vercel-issued preview URL (`*.vercel.app`) before touching a custom domain.
3. Set `git.deploymentEnabled` deliberately (mirror the WholeClaim pattern of explicit `--prod` deploys rather than deploy-on-push, if that's still your preference — confirm with the operator).
4. Report the resulting staging URL back before proceeding.

## Step 2 — Supabase voting backend
1. Create a **new, dedicated Supabase project** — not a schema inside the WholeClaim project. Separate credentials, separate risk surface.
2. Run `supabase/schema.sql` against it.
3. Run `supabase/seed.sql` against it — this seeds the actual 23 curated polls (verbatim from the artifact source, see note above). Do not hand-reconstruct poll content from memory or write new seed data; use this file as-is unless the operator has since changed the poll set, in which case re-export from the current artifact source the same way this file was produced.
4. Set environment variables in Vercel (server-only where noted):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only, never `NEXT_PUBLIC_*`)
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (for client-side `get_poll_results` reads only)
   - `WDPT_IP_HASH_SALT` (long random string, server-only)
   - `NEXT_PUBLIC_SITE_URL` (the real deployed URL, used for OG tags)
5. Swap the artifact's `votingService = DemoVotingAdapter` for `votingService = createSupabaseVotingAdapter(...)`. UI components should require no changes — if they do, that's a signal the interface contract slipped and needs fixing before proceeding, not patching around.

## Step 3 — Server-side vote protection
1. Confirm votes are written only through `/api/polls/vote`, never a direct client → Supabase write.
2. Confirm the voter-token cookie is `httpOnly`, `Secure`, `SameSite=Lax` — verify in browser devtools that client-side JS cannot read it.
3. Confirm a second vote attempt (same browser, same poll) is rejected with `already_voted`, sourced from the `(poll_id, voter_token)` unique constraint — not from a client-side check.
4. Confirm rate limiting rejects rapid repeated votes from the same IP hash (test with >20 requests in under 60 seconds against a test poll).
5. Confirm invalid `pollId` and out-of-range `choiceIndex` are rejected with 400s, and an unpublished/expired/draft poll (e.g. `p18`) is rejected with 400, not silently accepted.
6. Confirm the RLS fix actually holds: using the **anon key** (not the service role key), attempt `select * from votes` directly against Supabase (e.g. via `supabase.from('votes').select('*')` in a scratch script, or the API docs' "Try it" panel). This must return an empty/denied result, not vote rows containing `voter_token` or `ip_hash`. Then confirm `select * from get_poll_results(...)`-equivalent (the RPC call) with the same anon key *does* return correct counts — both halves matter, since fixing one without confirming the other is exactly how this kind of regression ships silently.

## Step 4 — Production result experience
Carry over from the artifact, backed by real Supabase data instead of the demo adapter:
- 🔥 Today's Question featured card with hero percentage
- Percentage-forward result rows (large %, bar, vote count underneath)
- "Most answered" / "People are answering" sections — only populate these once real `get_poll_results` data exists per poll; do not fall back to placeholder or fabricated numbers if a query fails, show the existing loading/error states instead
- Voluntary-participation disclaimer, unchanged, still visible on every result view

### Visual/result treatment
- The 🔥 Today's Question card should be the dominant homepage attention element.
- On the poll result page, make the winning/leading percentage visually prominent immediately after voting.
- Each answer should use a horizontal percentage bar with the percentage large and easy to scan, with the raw vote count secondary underneath.
- The result should feel like a live public tally rather than a survey form.
- Keep the site's existing editorial identity: Fraunces for questions, Inter for UI, JetBrains Mono for percentages/counts, the Paper/Ink/Signal Yellow palette.
- Do not copy Kalshi, Polymarket, or any other site's branding, wording, layout, or proprietary visual identity. Borrow only the general UX principle of making the current result immediately legible — nothing pixel- or asset-level.
- Do not display percentages before the user votes unless the product decision explicitly changes. The first interaction remains: choose an answer → immediately reveal the live tally.
- The 🔥 graphic is an attention/featured indicator, not an assertion that the poll is statistically important or scientifically representative.

## Step 5 — Facebook sharing
1. Confirm every poll resolves at `yourdomain.com/poll/p16` (real Next.js route, not `#/poll/p16` hash routing) and renders correctly on a fresh page load with JS disabled (test via curl or "view source" — the question text and OG tags should be present in the raw HTML, since Facebook's crawler doesn't execute JS).
2. Use Facebook's Sharing Debugger (developers.facebook.com/tools/debug/) against the real deployed URL to confirm title, description, and image resolve correctly. Screenshot/report the result.
3. Confirm the share button in the app (`navigator.share` / clipboard fallback) produces this real URL, not a hash-route or localhost URL.

## Step 6 — Final testing before posting
Do not mark this complete without actually performing each of these, and reporting the result of each:
1. Open the public URL from an iPhone Safari.
2. Open it from a second device/browser (different network if possible).
3. Vote from both devices on the same poll.
4. Confirm the total updates correctly and matches on both devices after refresh.
5. Confirm duplicate-vote protection: try to vote twice from the same device on the same poll.
6. Confirm a shared poll link opens directly to that poll on a cold load (no prior visit to the homepage).
7. Confirm the Facebook Sharing Debugger preview looks right (Step 5.2).
8. Grep the **entire repository** (not just the deployed/built bundle) for `window.storage`, `DemoVotingAdapter`, "Prototype note," "demo," or any language implying this is not production infrastructure — remove all of it from the production code path. Confirm this with an actual repo-wide search command and report the result (e.g. "grep found zero matches outside of a deleted/excluded dev-only file"), not just a visual check of the running site. The disclaimer that stays is the voluntary-participation one; the "this is a demo, not production" language should not ship anywhere in the codebase, including comments.

## Step 7 — Private Owner Results Dashboard

Build/verify the private `/admin` owner dashboard for the polling product. Files for this are already written in this handoff (see list below) — confirm they work end-to-end rather than rebuilding from scratch.

**Purpose:** give the operator a single place to monitor whether Phase 1 is working without opening Supabase manually. This is an internal tool, not a public or Phase 1 product feature — the "no comments/profiles/social feed" boundary above does not apply to this dashboard, since it isn't part of the voter-facing experience.

**Security requirements — verify each of these explicitly:**
- `/admin` must not be publicly accessible without authentication. `middleware.js` gates every `/admin*` and `/api/admin*` route (except `/admin/login` and `/api/admin/login`) behind a signed session cookie.
- Do not rely on hiding the URL as security — confirmed by the middleware gate above, not by obscurity.
- `SUPABASE_SERVICE_ROLE_KEY` is never exposed to the browser — `lib/supabaseAdmin.js` and `lib/adminQueries.js` are server-only files; confirm neither is imported from any `"use client"` component.
- All admin queries run server-side (`app/admin/page.js` is a server component; all data fetching happens in `lib/adminQueries.js`).
- No individual voter identities or raw IP addresses are displayed anywhere in the dashboard — `adminQueries.js` never selects `voter_token` or `ip_hash` for display, only aggregate counts.
- Not indexable by search engines — `app/admin/layout.js` sets `robots: { index: false, follow: false, nocache: true }`. Also add a `Disallow: /admin` line to `public/robots.txt` (create this file if it doesn't exist) as a second layer.

**Files already written for this step:**
- `lib/supabaseAdmin.js` — server-only Supabase client using the service role key
- `lib/adminAuth.js` — password check + signed session cookie helpers (constant-time comparison, HMAC-signed session)
- `middleware.js` — the actual access gate for `/admin*`
- `app/api/admin/login/route.js`, `app/api/admin/logout/route.js`
- `app/admin/login/page.js` — simple password form
- `app/admin/layout.js` — noindex metadata
- `lib/adminQueries.js` — one function per dashboard metric, every function returns `{ data, error }`, never a fabricated fallback
- `app/admin/page.js` — the dashboard itself

**New environment variables required (server-only, do not prefix with `NEXT_PUBLIC_`):**
- `ADMIN_PASSWORD` — the owner's login password. Pick something long and unique to this product, not reused from WholeClaim.
- `ADMIN_SESSION_SECRET` — a long random string used to sign session cookies. Generate independently; do not reuse `WDPT_IP_HASH_SALT` or any WholeClaim secret.

**Dashboard covers (verify each renders real data, not a placeholder):**
1. Total votes
2. Votes today
3. Votes in the last 7 days
4. Total live/published polls
5. Polls ranked by total votes ("Most answered")
6. Polls ranked by recent (24h) activity
7. Full results for every poll — question, category, status badge (LIVE/DRAFT/EXPIRED/ARCHIVED), total votes, each choice's label/percentage/raw count
8. Category totals, across all six categories
9. Voting activity by day (last 14 days)
10. Duplicate-vote / rejected-attempt counts, from `vote_attempt_log`
11. Content freshness ("Needs a look"): drafts awaiting review, polls expiring within 7 days, and any published poll whose `expires_at` has already passed but is still live — the exact class of bug `p19` was. See `TRENDING_POLL_PIPELINE.md` for the process this feeds. All read-only, same as the rest of the dashboard.

**Verify, don't assume:**
- Every number on the page traces back to a real query result — if a section shows an error box instead of data, that's correct behavior when a query genuinely fails, not a bug to "fix" by adding a fallback number.
- Log in with the wrong password and confirm it's rejected with a generic error (not "wrong password" specifically, and not revealing anything about the real password).
- Confirm `/admin` redirects to `/admin/login` when visited with no session cookie at all (test in a fresh/incognito browser).
- Confirm the status badge is correct for at least one poll in each state — a currently live poll should show LIVE, `p18` should show DRAFT, and (once any poll's `expires_at` has passed, e.g. by temporarily editing one in a test) EXPIRED should render correctly too.

**Explicitly out of scope for this step** (do not add without separate authorization): poll creation/editing, comments, user management, or any other CMS functionality. This dashboard is read-only.

## Report back
After Steps 1–7, report:
- The live URL
- Confirmation of each test in Step 6, individually
- Confirmation of each Step 7 security requirement, individually
- Any remaining blocker, however small, before Facebook promotion begins

## Internal measurement — Phase 1

The private `/admin` dashboard (Step 7) is now the primary way to check Phase 1 participation without opening Supabase manually. `supabase/queries.sql` remains available as a fallback/debugging tool for anything not surfaced on the dashboard, or for spot-checking a dashboard number against the raw data — it covers:
- total votes by poll
- votes by choice
- votes in the last 24 hours / 7 days
- activity by category
- duplicate-vote attempts/rejections (via the `vote_attempt_log` table added in `supabase/schema.sql` — logs rejected attempts only: duplicate, rate-limited, invalid poll/choice, expired/unpublished; successful votes remain in `votes`)
- approximate distinct-voter participation per poll, using `count(distinct voter_token)`
- a one-query "Phase 1 scorecard" (total votes, distinct voters, polls with ≥1 vote, duplicate attempts blocked)

Claude Code should run these against the deployed schema once Step 2 is complete, confirm each returns sensible results (not just that the query executes without error), and report back that the measurement layer works before Step 6 final testing.

Do not expose `supabase/queries.sql`, Supabase credentials, service-role keys, or any administrative data through the public (non-`/admin`) application. `vote_attempt_log` has no RLS policies granted to `anon`/`authenticated` — confirm this in the RLS policy list, don't just assume the SQL file did it correctly.

**Important distinction on "repeat voters":** `voter_token` and `ip_hash` are abuse controls (enforcing one vote per poll, rate limiting), not an identity system. This applies equally to the `/admin` dashboard — do not report or imply that these mechanisms can identify a specific person, track them across polls as "the same person," or build any profile, anywhere in the dashboard or the SQL queries. Report only aggregate signals:
- votes per poll
- duplicate attempts rejected
- distinct voter tokens participating in a poll (an approximate participation count, read the same way you'd read "unique visitors" on basic analytics — not a claim about who anyone is)
- voting activity over time

Do not build any *additional* public or application-level surface beyond `/admin` in this phase — no separate analytics product, no CMS functionality on top of the dashboard beyond what Step 7 specifies (no poll creation/editing, comments, or user management).

Do not proceed to Facebook outreach until the Step 7 report (as part of the combined Step 1–7 report above) is delivered and the operator explicitly authorizes it.
