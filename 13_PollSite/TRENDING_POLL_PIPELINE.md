# Trending Poll Pipeline

A repeatable process for keeping "What Do People Think?" current, without
compromising the curated-poll-only model or the safety filter. This is a
**process**, not automation — deciding what's poll-worthy still requires a
human judgment call every time, the same way it did for every poll added
so far.

## Why this isn't automated

An automated feed (auto-pull trending topics → auto-publish as polls) would
break two things that are load-bearing for this product:

1. **The safety filter requires judgment, not pattern-matching.** "No polls
   anchored to real minors or copycat-sensitive incidents" isn't a keyword
   list you can grep for — it requires reading a story and deciding whether
   it's abstractable. A bad automated pass could publish something genuinely
   harmful before anyone notices.
2. **Curated-only is a stated product promise**, not just a technical
   choice. Auto-publishing from a trend feed is functionally the same as
   letting an algorithm create polls — the thing Phase 1 explicitly rejected.

So: humans (or an assistant, closely supervised) check trends on a cadence,
apply the filter below, and only then does anything become a poll — staged
as `draft` first, published as a deliberate second step.

## Cadence

Check for new poll material **weekly**, or ad hoc when something obviously
poll-worthy is happening (a major, dated cultural event — award shows,
World Cup, election day, etc.). Don't check more often than that; the goal
is a steady trickle of fresh evergreen-leaning content, not a live news
feed disguised as a polling site.

## Where to look

- Cross-platform social trend roundups (what's moving on TikTok/Instagram
  this week) — good source for **Social Media** and **Trending** category
  material.
- Sports/entertainment calendars — dated events (World Cup, award shows,
  fashion weeks) for **Sports & Entertainment**/**Social Media**, always
  with a real `expiresAt`.
- General news, scanned specifically for **abstractable, evergreen
  underlying questions** — not for the news event itself. See filter below.

## The filter (same standing rule, applied every time)

Before anything becomes a `draft` poll, check all of these:

1. **No polls anchored to specific real minors or incidents involving
   them, even indirectly.** Automatic skip, no exception, regardless of
   how "safe" the abstraction seems.
2. **Do not amplify a real-world event when the topic's traction depends
   on participation, imitation, or copycat behavior.**
3. **Abstract the legitimate underlying question and remove identifying
   incident details** before it's eligible. If it can't be abstracted
   cleanly, it's not eligible — don't force it.
4. **No tragedies with identifiable victims** — deaths, violence, active
   conflict casualties. This includes disasters when framed around the
   specific event; a general "have you experienced X" question about the
   same broad phenomenon (weather, cost of living, etc.) can be fine if it
   doesn't reference the specific incident.
5. **Active war/conflict topics**: default to skip unless there's a clean,
   long-standing, non-partisan-coded angle with no casualties in the frame
   (e.g. the deployment-length question already in the poll set — a policy
   question, not "who's right in this war").
6. **When uncertain, skip.** Lost traffic from a skipped topic is trivial;
   the downside of publishing something copycat-prone or exploitative isn't.
7. **Freshness**: if it's tied to a real event, does it have a genuine,
   checkable date to set `expiresAt` against? If it's tied to a vague
   "this week" news cycle with no fixed endpoint, prefer the evergreen
   version of the question instead (see p18's history — this exact
   situation already happened once).
8. **No invented sources.** If a `source` field would be added, it must be
   a real, general pattern, not a fabricated citation.

## Process

1. **Scan** — weekly, or event-triggered. Note candidate topics.
2. **Filter** — run each candidate through the checklist above. Discard
   anything that doesn't clearly pass; don't rationalize a borderline case
   into passing.
3. **Draft** — write the poll (question + 3–4 choices, category, optional
   `source`/`expiresAt`), insert into `polls` with `status = 'draft'`. This
   makes it visible in the admin dashboard's "needs review" section (see
   below) but never shown to voters.
4. **Review** — the operator reviews drafted polls before publishing.
   This is the actual governance checkpoint — draft status is not
   publication, it's a staging area for a human decision.
5. **Publish** — flip `status` to `'published'` (with `expiresAt` set if
   the topic is genuinely time-bound) via a direct SQL update in the
   Supabase SQL editor, the same way any other poll-data change happens.
   There is still no `/admin` poll-editing UI (out of scope per Step 7) —
   this keeps the dashboard read-only as specified.
6. **Retire** — when a dated poll's `expiresAt` passes, or a poll's
   content goes stale on substance (not just past its date — see the p19
   World Cup case), archive it (`status = 'archived'`) rather than leaving
   it live-but-wrong.

## Keeping the six-category base primary

Per the earlier product decision: timely/trending polls are **optional
rotation**, not the core strategy. A healthy mix over time looks like
mostly evergreen questions across all six categories, with a handful of
timely ones layered in — not a feed that chases whatever's hot this week.
If a review pass finds nothing worth adding, that's a fine outcome; don't
lower the filter bar just to produce something.
