# Ticket 3 — "Top Story Today": scope and estimate

**Status: scope only. Nothing built. Requires review and authorization before any code.**

Worked example throughout: the **Flock Safety license-plate camera** story supplied
2026-08-18. It is a good stress test precisely because it is *not* easy — it is a
live controversy with genuine two-sided coverage, it touches law enforcement and
federal data access, and it sits adjacent to categories the governance rules
exclude. If the pipeline handles Flock correctly it will handle most days.

---

## 1. What this actually is

Not "an AI that posts polls." It is a **drafting assistant with a mandatory human
gate**. The machine proposes; the founder disposes. Nothing reaches the public
without an explicit approve click. That distinction drives every design decision
below, and it is the reason the risky parts stay tolerable.

Five stages:

```
  news sources → candidate drafting → governance filter → review UI → hero slot
       (1)             (2)                  (3)              (4)         (5)
```

---

## 2. Stage-by-stage

### Stage 1 — Source ingestion

A morning job pulls recent headlines. Options, cheapest first:

| Option | Cost | Notes |
|---|---|---|
| RSS from 5–10 outlets | **free** | No key, no quota, no ToS friction. Headline + summary + link is all stage 2 needs. |
| NewsAPI / GNews free tier | free–$0 | Quota-limited, ToS restricts commercial redistribution. |
| Paid aggregator | $50–200/mo | Only worth it if RSS proves too thin. |

**Recommendation: RSS.** Everything downstream needs only a headline, a
one-paragraph summary and a URL, which RSS gives away. Start free; upgrade only
if the candidate quality is visibly source-limited.

*Flock:* would surface via tech/privacy feeds (Ars Technica, EFF, 404 Media) and
regional outlets covering the contract cancellations.

### Stage 2 — Candidate drafting

An LLM call turns the day's headlines into 3–5 candidate polls. Each candidate:
question text, 2–4 answer options, suggested category, source headline + URL, and
a one-line rationale for why it clears governance.

The framing rule is the hard part. Prediction- or opinion-framed, never
endorsement-framed:

- ✅ "Will more cities cancel their Flock Safety contracts this year?"
- ✅ "Should police be required to get a warrant before searching license-plate camera data?"
- ❌ "Do you support ending police surveillance?" — advocacy, not a question

The four candidates in the addendum are exactly the right shape. Note what they
have in common: each is answerable by someone on either side without feeling the
poll has already decided. That is the property to prompt for and to test against.

**Cost:** one Claude call per morning, a few thousand tokens in, under a thousand
out. Pennies per day; call it **under $2/month**. Reuses the existing Anthropic
relationship — no new vendor.

### Stage 3 — Governance filter

The artifact's curation rules, applied mechanically before anything reaches the
review screen:

1. No polls anchored to real minors, even indirectly
2. No amplifying events where traction depends on imitation or copycat behaviour
3. Abstract the underlying question; strip incident specifics
4. When uncertain, skip — a lost topic costs nothing

Belt and braces, because an LLM filter alone is not a control:

- **Deny-list pass** (deterministic): named private individuals, active criminal
  proceedings, terms indicating tragedy/violence/minors
- **LLM justification** (judgment): the model states *why* a candidate passes, and
  that sentence appears in the review UI — so the founder audits the reasoning,
  not just the verdict
- **Default deny:** filter error or ambiguity means the candidate is withheld

*Flock, worked through:* the **topic** passes — national, policy-level, genuinely
contested, no named individuals. But the **source coverage** includes camera
vandalism, which rule 2 catches: a poll about whether people should destroy
cameras would amplify copycat behaviour. The correct output is candidates about
warrants, contracts and federal access — never about the vandalism. Note the
filter must operate on the *proposed question*, not the source story, or it would
wrongly reject the whole topic. This example is worth encoding as a fixture test.

### Stage 4 — Review UI

Lives behind the existing `/admin` gate — reuses `middleware.js`, the signed
session cookie, the noindex layout. No new auth surface.

New route `/admin/top-story`: candidate cards showing question, options, category,
source link, governance rationale; **Approve / Edit / Reject** per candidate; edit
opens the same fields inline so wording can be fixed without a round trip.
Approving inserts a `polls` row and promotes it to the hero.

Read-only elsewhere in `/admin` is a stated constraint; this route is the
deliberate exception, and it is worth naming that in the ticket rather than
letting it erode by accident.

*Flock, worked through:* this is where the example bites hardest. All four
supplied candidates come from **one story** — warrants, contracts, federal
access, and the safety-vs-privacy framing. That is not four days of material; it
is one day with four angles, and it exposes a design question a single-candidate
mockup would hide:

- **Group by source, not as a flat list.** Four sibling cards reading
  "Flock… Flock… Flock… Flock…" is a different review task than four unrelated
  candidates. The screen should show *one story, four angles*, so the founder is
  choosing between framings rather than judging each in isolation.
- **Approving one must not silently kill the others.** "Should police need a
  warrant?" and "Will more cities cancel contracts?" are both good, and the
  unpicked ones are tomorrow's material. Rejecting on approval throws away real
  work. Better: a third state — approve one, **park** the rest as reusable drafts
  in `polls` with `status='draft'`, which is exactly what the existing review
  workflow already handles. That reuses machinery rather than inventing a queue.
- **Only one can hold the hero.** The slot is singular, so the UI must make
  "which of these four goes live" the actual decision, not four independent
  yes/no toggles that could all resolve to yes.

This also sharpens decision 5 below: if one strong story reliably yields three or
four candidates, a *daily* cadence may be the wrong unit. A good story could carry
several days, which removes exactly the thin-day pressure that makes the filter
most likely to fail.

### Stage 5 — Hero slot and rotation

Today `selectFeaturedPoll()` picks the first live poll with `featured: true`
(currently `p16`). Top Story needs to win that slot, then step aside cleanly.

Cleanest approach with least new machinery: on approve, set `featured = true` on
the new poll and `featured = false` on the outgoing one. The outgoing poll stays
`published` — it keeps its votes, keeps its URL, keeps working, and simply stops
being the hero. That satisfies "rotates into the archive, not deleted" with no
new status value and no schema change.

One decision needed: **should Top Story polls expire?** A "will X happen this
year" question goes stale. Setting `expires_at` on approval would handle it —
though note `p19` taught us an expired-but-published poll must never render, and
`isLive()` already enforces that correctly.

---

## 3. Schema

One new table, for candidates only. Approved polls flow into the existing `polls`
table unchanged.

```sql
create table top_story_candidates (
  id            bigint generated always as identity primary key,
  run_date      date not null,
  question      text not null,
  choices       jsonb not null,
  category      text not null,
  source_label  text,
  source_url    text,
  rationale     text,               -- why the filter passed it; shown in review
  status        text not null default 'pending'
                check (status in ('pending','approved','rejected','edited')),
  published_poll_id text references polls(id),
  created_at    timestamptz not null default now()
);
alter table top_story_candidates enable row level security;
-- no anon/authenticated policies: service-role only, same as vote_attempt_log
```

RLS on with zero policies, and grants revoked, matching the `vote_attempt_log`
pattern — candidates are internal until approved.

---

## 4. Estimate

| Stage | Effort | Risk |
|---|---|---|
| 1 · RSS ingestion | 0.5 session | low |
| 2 · Candidate drafting + prompt | 1–1.5 sessions | **medium** — framing quality is the whole product; needs iteration against real days |
| 3 · Governance filter + fixtures | 1 session | **high** — the part that can cause real harm |
| 4 · Review UI | 1–1.5 sessions | low — reuses existing auth |
| 5 · Rotation + archival | 0.5 session | low |
| Schema + migration | 0.25 session | low, but needs manual SQL-editor run |
| End-to-end testing | 0.5–1 session | medium |
| **Total** | **5–6.5 sessions** | |

**Running cost: roughly $2–5/month** — one Claude call daily, RSS free, Vercel cron
free on the current plan. No new vendor, no new subscription. Flagging it because
it is a recurring charge, however small.

Sequencing note: stage 3 should be built and tested **before** stage 4, so no
approval UI exists until the filter that protects it does.

---

## 5. Decisions needed before build

1. **News sources** — which outlets? Affects slant as much as coverage.
2. **Run time and mechanism** — Vercel cron (free, fits the existing pattern) or manual trigger from `/admin`? Manual is safer to start.
3. **Expiry** — do Top Story polls get an automatic `expires_at`?
4. **Failure mode** — if a morning run produces nothing that clears the filter, does the previous Top Story simply persist? (Recommend yes — silence beats a forced weak poll.)
5. **Volume** — one Top Story per day, or only when something genuinely warrants it? Daily cadence creates pressure to publish on thin days, which is exactly when the filter gets tested hardest.

---

## 6. Honest risks

- **The filter is the product's reputation.** One poll about the wrong story does
  more damage than a month of good ones earns. The human gate is the real control;
  the automation only decides what gets *proposed*.
- **Prediction framing is harder than it looks.** "Will more cities cancel
  contracts?" is clean. Small wording shifts turn it into advocacy. Expect prompt
  iteration across real days, not one pass.
- **Daily cadence pressure** — see decision 5.
- **This is the largest surface added so far,** on a product with zero votes to
  date. Worth asking whether Top Story earns priority over getting first real
  traffic through the door.
