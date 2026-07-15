# WholeClaim — Metrics Bible v1.0

**Rule:** a metric exists here or it doesn't exist. Every number has one definition, one formula, one source, and one owner (founder, for now). No claim contents ever appear in analytics — events carry metadata only (PRD §2.7).

## North Star

**Letters generated.** The closest measurable proxy for value realized: a user who generates a letter has organized evidence, understood their situation, and acted. Everything upstream (leads, activation, entries) exists to make this number move; everything downstream (revenue, retention) follows it.

## Funnel metrics

| Metric | Definition / formula | Source | v1 target |
|---|---|---|---|
| Thread reach | Views on funnel posts, weekly | Threads analytics | trend up |
| Grade starts / completions | Grader started vs. finished | grade_completed | ≥25% completion |
| Lead capture | Consented emails / completions | lead_captured | ≥80% of completions |
| Signup rate | Accounts created / grader leads (30d) | signup | ≥15% |
| **Activation** | Claim created + 3 binder entries in week 1 | claim_created, entry_added | ≥40% of signups |
| Paywall views | First Analyze/Letter attempt on Free | paywall_viewed | — (denominator) |
| **Free→Pro conversion** | checkout_completed / paywall_viewed | Stripe + events | 3–5% at launch |

## Engagement & product health

| Metric | Definition | Target |
|---|---|---|
| Entries per active claim per week | Binder habit strength | ≥2 |
| Evidence completion | Avg. checklist % on active claims | ≥60% by day 14 |
| Health Score delta | Median score change, day 1 → day 14 | +20 points |
| Letters generated (north star) | Count weekly, by type | trend up |
| D30 claim activity | Claims with any event in days 15–30 | ≥50% (episodic product — measured per claim, not per user) |
| AI runs per Pro user/week | Usage of paid value | 3–8 healthy band |

## Money

| Metric | Definition / formula | Target |
|---|---|---|
| Revenue split | One-time $49 vs. $19/mo cohorts (pricing A/B) | decision by beta wk 2 |
| ARPU | Revenue / paying users, monthly | ≥$30 blended |
| **AI cost per active user** | Anthropic spend / monthly active users | <$1.50/mo |
| Gross margin per Pro | (price − payment fees − AI cost − infra share) / price | ≥85% |
| CAC | Paid spend / new paying users (organic = $0; track founder hours honestly) | $0 paid at launch |
| LTV (per-claim model) | Price × claims per customer lifetime + education-line attach | model after 90 days of data |
| Refund rate | Refunds / purchases (14-day policy) | <5% |
| MRR / churn | Subscription cohort only | measure, don't target yet |

## Review cadence (ties to 10_Operations/Operating-Cadence.md)

**Sunday founder review, 30 minutes, every week:** leads → grades → activation → conversion → letters → AI cost. One decision per review, logged in `00_Founder/Decisions.md`. A metric that hasn't driven a decision in 8 weeks gets demoted or deleted — dashboards are for deciding, not admiring.

## The three viability tests (launch verdicts, not dashboards)

1. **Grader converts:** ≥25% completion and holding lead capture — or the top of funnel is wrong.
2. **Strangers pay:** 10 non-acquaintance Pro purchases within 30 days of launch — or the price/promise is wrong.
3. **Acquisition stays free:** lead flow sustained 60 days on cadence alone — or the model needs paid fuel it can't yet afford.

Two of three failing after honest iteration = stop-and-rethink, per the founder's bandwidth rule. The floor remains high either way: the tool serves the founder's own cases and the education line regardless.
