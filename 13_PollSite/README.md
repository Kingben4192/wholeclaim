# 13_PollSite — "What Do People Think?" (LIVE IN PRODUCTION)

> **STATUS CORRECTED 2026-08-17.** This file previously read *"BLOCKED — NOT
> DEPLOYED"* and *"Nothing created, nothing deployed, nothing spent."* That was
> true when written and is **no longer true**. Founder-confirmed 2026-08-17:
> **Phase 1 is live in production with 22 polls.**
>
> Verified independently via the Vercel API at correction time:
> - Vercel project **`whatdopeoplethink`** exists — `prj_qGkBEF9f4OkaysbQo5QGRiCcSDTZ`,
>   created **2026-08-17 00:27**, in team `wholeclaim`, **not git-connected**
>   (so a `git push` cannot deploy it; it ships only via manual `vercel --prod`).
> - **Three deployments, all READY** — 00:54, 00:56 and 01:39 on 2026-08-17.
>
> Runs on its own track: **its own Supabase project** (explicitly not
> WholeClaim's, per `.env.local`) and its own Vercel project. It is **separate
> from and does not conflict with** `12_KitsSite` / `property-record-poll`,
> which is the Kit 1 demand test and uses WholeClaim's Supabase.
>
> The blocker notes below concern outstanding *component file transfers*, not
> deployment. Read them as an open work list for this project's own session —
> not as evidence that nothing has shipped.

Directory slot `13_` is provisional — follows the `11_GovSite` / `12_KitsSite`
convention. Rename freely; nothing references this path.

## File inventory

| File | Origin |
|---|---|
| `supabase/schema.sql` | **rev. 6, complete** — admin RPCs folded in |
| `supabase/seed.sql` | rev. 6 — p19 `archived` |
| `supabase/queries.sql` | rev. 2 |
| `lib/votingService.supabase.js` | rev. 1, unchanged since |
| `app/api/polls/vote/route.js` | rev. 3 |
| `app/poll/[pollId]/page.js` | rev. 3 |
| `lib/adminAuth.js`, `middleware.js` | rev. 5 (Web Crypto) |
| `lib/adminQueries.js` | **rev. 4 — superseded upstream, never received** |
| **`lib/polls.js`** | **written here** — artifact shape (`cat`/`q`/`source`) |
| **`lib/votingService.js`** | **written here** — the singleton `WIRING_NOTES` flags |
| **`public/robots.txt`** | **written here** |

## Blocker 1 — the five component files never arrived (HARD)

Rev. 6 split the components into `shared.js`, `FeaturedCard.js`, `HomeView.js`,
`CategoryView.js`, `PollView.js` specifically to beat the size limit. **None of
the five was transmitted.** The message was consumed by the handoff document,
`schema.sql`, `seed.sql`, and the opening of `artifact-source-reference.jsx`
before truncating — the split worked on the authoring side but all the files
still went into one message, so the limit hit anyway.

**Send the five component files in their own message, with no handoff document
and no SQL alongside them.** Two or three messages is fine. That is the only
remaining blocker on `PollClient.js` and `app/page.js`.

Also never received, across all six revisions: `lib/supabaseAdmin.js`,
`app/admin/page.js`, `app/admin/layout.js`, `app/admin/login/page.js`,
`app/api/admin/login/route.js`, `app/api/admin/logout/route.js`,
`components/WIRING_NOTES.md`, `TRENDING_POLL_PIPELINE.md`.

## Blocker 2 — account creation and spend gates (CHARTER)

Steps 1–2 need a new Vercel project and a new Supabase project. Never spend, full
stop at account creation. Founder's to perform. **No database exists**, so nothing
in Steps 2–7 has run. All review below is static.

## Blocker 3 — Step 7 cannot be signed off

The handoff asks for individual confirmation of each Step 7 security requirement.
Six of the eight files that implement it have never been received. The following
are **unverified, not verified**:

- `SUPABASE_SERVICE_ROLE_KEY` never reaching the browser — depends on
  `lib/supabaseAdmin.js`, unseen.
- `app/admin/page.js` being a server component with a correct `await isValidSession`.
- `app/admin/layout.js` noindex metadata.
- Login route awaiting `checkAdminPassword()` — a non-awaited call returns a
  truthy Promise and would authenticate any password. Rev. 6 states this is
  correct in the source; I cannot confirm it.
- Generic wrong-password error text.
- Dashboard item 11 (content freshness) — new in rev. 6, unseen. The schema
  supports it as specified: `status`, `expires_at`, and `publish_at` are all
  queryable, so drafts / expiring-soon / expired-but-live are all derivable.

What **is** verifiable and correct: `middleware.js` gates `/admin/:path*` and
`/api/admin/:path*`, exempts only `/admin/login` and `/api/admin/login`, is async,
and awaits `isValidSession`. `lib/adminAuth.js` is Web Crypto throughout with no
Node built-ins, so it runs on Edge. `public/robots.txt` carries `Disallow: /admin`.

On rev. 6's item 3: two of those three (`isValidSession` unawaited, `?? 0` in
`ScorecardCell`) were read directly in the rev. 4 `app/admin/page.js` source, and
rev. 5 shipped no replacement, so they were flagged against the newest copy I
held. Rev. 6 says corrected versions exist. Accepted — but the files still haven't
arrived, so they stay unverified rather than confirmed.

## Closed

- **p9/p10 → getwholeclaim.com** — confirmed a deliberate editorial choice. Closed.
- **`publish_at` omitted from `seed.sql`** — false alarm; no poll uses it.
- **p19 artifact/seed divergence** — fixed in rev. 6, both now `archived`.
- **Edge-runtime crash, non-constant-time password compare** — fixed, verified.
- **Rate-limited/duplicate-attempt logging, session revocation** — addressed.

## Open

- **`set search_path = public` omits `pg_temp`** on all six SECURITY DEFINER
  functions. PostgreSQL's guidance is to list `pg_temp` last; omitted entirely,
  the temp schema is searched first. Low practical risk via PostgREST, one-word fix:
  `set search_path = public, pg_temp`.
- **`revoke select on votes`** covers SELECT only; INSERT/UPDATE/DELETE grants
  survive. Only matters if RLS is ever disabled. `revoke all` is stronger.
- **`p13` miscategorised** — award-shows/TV question filed under `sports`.
- **`getActivityByDay()` 1,000-row cap** — acknowledged in rev. 6 item 7 as
  deliberately deferred. Agreed it won't bite at Phase 1 volume. `getRejectionStats()`
  has the same shape and wasn't mentioned; a bot storm would hit it before votes do.
- **`vote_attempt_log` misses route-level rejections.** `invalid_poll_id`,
  non-integer `choiceIndex`, and `invalid_request_body` are rejected before the RPC
  without calling `logRejectedAttempt`, so malformed-input probing stays invisible
  in dashboard item 10.
- **`queries.sql` query 6 is a tautology.** `unique (poll_id, voter_token)`
  guarantees `count(distinct voter_token) = count(*)` per poll, so the "mismatch
  worth investigating" it describes cannot occur. To assert what it's reaching for,
  query `pg_constraint` for the unique constraint's presence instead.
- **`p20` expires 2026-10-10, `p21` 2026-09-20** (~5 weeks). Dashboard item 11 is
  the right home for this.

## Delivered this round

`lib/votingService.js` — the singleton the components import.
`lib/votingService.supabase.js` exports a *factory*, not an instance, which is the
gap `WIRING_NOTES` flags. This instantiates it with an anon-key browser client and
a `pollsById` map hydrated from server-fetched polls via `hydratePollsById()`. The
map is mutated in place, not reassigned, because the adapter closes over that exact
object reference at module load.

## Step 6.8 grep — five hits, all in preserved-verbatim files

`route.js:9`, `votingService.supabase.js:2,13,20`, `schema.sql:44` —
`DemoVotingAdapter` / `window.storage` / "prototype" in comments. Strip at porting
time. The artifact's `DemoVotingAdapter` and its Section 4 header must not survive
the port either. `lib/polls.js` and `lib/votingService.js` are clean.

## Operator actions (founder only — not performed)

1. New Vercel project, separate from WholeClaim and from `property-record-poll`
   (`prj_LUj8aWYnKs5RZhzffcxSazf5GzDP`).
2. New dedicated Supabase project. Run `schema.sql`, then `seed.sql`.
3. `git.deploymentEnabled` — repo precedent is explicit `--prod` (root
   `vercel.json` sets `"master": false`).
4. Env: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `WDPT_IP_HASH_SALT`, `NEXT_PUBLIC_SITE_URL`,
   `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`. No secret literals in shell commands.

## Do not

- Do not touch WholeClaim's Vercel or Supabase project.
- Do not begin Facebook promotion. Steps 1–7 are unstarted or unverified.
- Do not add anything to the Phase 1 voter-facing scope (no comments, no
  "why did you choose this" field, no user polls, feed, reactions, profiles).
- Do not add CMS functionality to `/admin` — read-only by specification.
