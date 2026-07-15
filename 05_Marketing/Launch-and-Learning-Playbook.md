# Claim Grade — Launch & Learning Playbook

Four jobs in one document: put the brand on social, put the grader on the web, make the system "learn" codes/statutes/prices the right way, and prove it all against the Grange and DWM files before a single stranger touches it.

---

## Part 1 — The social page (30 minutes, today)

1. **Instagram business account first.** Create @claimbindermethod (or closest available — keep one handle everywhere). Settings → switch to Business account, category "Product/Service." Threads activates automatically from the Instagram account.
2. **Bio formula:** proof + promise + arrow. *"Contractor who audited his own insurer's math — found a $1,235 error. Free 2-min claim grade ↓"* Link goes to the grader page (Gumroad until the grader is live).
3. **Facebook Page** (your Threads traffic came through Facebook, so meet it there): Pages → Create → "Claim Binder Method," same category, same bio, same link. Crosspost Threads content manually twice a week — don't build separate content.
4. **Pinned content:** the 12-post prompt thread we drafted is your pinned anchor on Threads. On Facebook, pin a single post: the $1,235 story in 4 sentences + grader link.
5. **Cadence:** three prompt-format posts per week (the proven template) + one "receipt" post per week — a redacted document screenshot with one lesson. Every post ends the same way: *"Grade your claim free — link in bio."*
6. **Litigation guardrail:** no carrier names, no case numbers, no filings screenshots while Grange and DWM are active. Redact claim numbers on any receipt post. When in doubt, run it past Monica Owens — a viral post is discoverable.

## Part 2 — The grader page on the web (one weekend)

**Fastest path to live:**
1. Buy the domain (claimbindermethod.com or claimgrade.com if available) — Namecheap or Cloudflare, ~$10/yr.
2. Deploy the grader React component on **Vercel** (free tier): create a Next.js project, drop the component in, `vercel deploy`. It's already mobile-first, which is where all your Threads traffic lands.
3. **Wire the email capture.** The prototype stores leads locally as a demo. Production: sign up for **ConvertKit** (free to 1,000 subscribers), create a form, and replace the `saveLead` function with a POST to the ConvertKit form API. Tag each subscriber with their grade (A–F) — a person who scored F gets a different email sequence than a B.
4. **Email sequence (write once):** Day 0 = full results + one fix. Day 2 = the $1,235 story + Gumroad SKU #1. Day 5 = the occurrence-counting story + main binder product. Day 9 = last call.
5. **Legal hygiene, non-negotiable:** privacy policy and terms page (Termly's free generator is fine to start), a real unsubscribe link, and no collection beyond name/email/state/answers. You're collecting information about people's active insurance disputes — store the minimum, never sell or share it, and say so plainly. Keep the "educational assessment, not legal advice" line on the page and in every results email.
6. Swap the results-page button to your live Gumroad link, and point every social bio at the grader. The grader is now the top of the whole funnel: Threads → grade → email → Gumroad → app.

## Part 3 — How the app actually "learns" codes, statutes, and prices

Straight talk first: the model doesn't learn from conversations, and you don't want it to — a system that silently absorbs whatever users type will confidently repeat their mistakes. "Learning" is built as a **knowledge library you control**: a curated set of entries injected into every AI prompt at request time. You saw the mini version in the grader — the Georgia statute block that shapes its breakdown. Production is the same pattern, bigger and maintained.

**Library entry schema (one row per fact):**

| Field | Example |
|---|---|
| type | statute / code / price / procedure |
| jurisdiction | GA / Fulton County / national |
| cite | O.C.G.A. § 33-4-6 |
| summary | Bad-faith remedy; 60-day written demand required before suit; penalty up to 50% of loss or $5,000 + fees |
| effective / verified | verified 2026-07-12 |
| source_url | legis.ga.gov link |

**The three feeds:**
1. **Statutes:** Georgia General Assembly site + GA DOI bulletins. Review quarterly and after each legislative session. Start with the ~15 statutes you already know cold from the Grange fight — you have a library most competitors would pay a lawyer to build.
2. **Codes:** IRC/IBC sections that drive supplement arguments (drying standards, matching, code-upgrade triggers) plus local amendments. Update on adoption cycles.
3. **Prices:** your unfair advantage. Every completed A&K job feeds real line-item costs into the library — demo, drywall, flooring, roofing per square. Refresh quarterly. This is what makes the Gap Analyzer say "drywall in Atlanta runs $X–$Y installed" instead of hand-waving.

**Retrieval (MVP):** tag-match — pull every library entry matching the user's state + damage type into the prompt, capped at ~10 entries. V2: embedding search when the library passes a few hundred entries. **Rule one of the library:** every AI feature says "verify the cite" — the library makes the model specific, the user makes it final.

## Part 4 — The Grange & DWM test bench

Before launch, the system has to reproduce conclusions you already know are true. Your two cases are a golden test set no competitor can buy. Redact Camillia's personal identifiers in test inputs; the facts are what matter.

**Grange tests (insurance core):**

| # | Tool | Input (from your file) | Pass means the output... |
|---|---|---|---|
| G1 | Loss-Count Auditor | Claim history: original loss + the Nov 2024 $3,168.68 payment on the same water loss | Flags the second payment as a probable supplement, not a new occurrence; requests the carrier's occurrence ledger |
| G2 | Policy Decoder | Suit-limitation and appraisal sections of the policy | Surfaces the suit deadline and the appraisal option; flags proof-of-loss conditions |
| G3 | Letters — Non-Renewal | Non-renewal facts, no legal conclusions supplied | Demands the specific statutory basis + itemized loss list; asks how each payment was counted |
| G4 | Gap Analyzer | The rating discrepancy (roof rated 16 yrs older than actual) | Tells the user to pull and verify the carrier's rating inputs |
| G5 | Claim Grade | Your file as it stood pre-organization, then as it stands today | Grade moves at least two letter grades between the two runs (sensitivity check) |
| G6 | Letters — Delay Demand | The bad-faith timeline facts | Produces a proper written demand with a 60-day framing and response deadline |

**DWM tests (methodology transfer):** the grader is insurance-specific, but DWM proves the documentation engine generalizes — which is your v2 market (utility disputes).

| # | Tool | Input | Pass means the output... |
|---|---|---|---|
| D1 | Binder Log | The 21-month curbstop repair timeline as entries | Chronology reads clean; deadline chips track the response dates |
| D2 | Letters (adapt Delay type) | The deficient one-day email search facts | Produces a records-demand letter specifying search scope, custodians, and date range |
| D3 | Analyze (free-form) | June 2024 usage spike to 164 CCF vs. baseline | Identifies the spike as anomalous and lists the meter/repair records that explain or rebut it |

**Protocol:** run every test after any prompt change or library update (regression testing). Each test is pass/fail against its checklist — plus two automatic fails on any run: a fabricated citation, or advice that crosses from self-help into representation. Log every run: date, tool, input version, pass/fail, notes. A test that fails twice means the prompt or the library entry gets fixed — never the expected answer.

**Launch bar:** all six Grange tests passing on two consecutive runs. DWM tests gate the v2 records-demand feature, not launch.

---

## The order of operations

Social page today. Test bench this week — it costs nothing and hardens everything. Grader live next weekend with ConvertKit wired. First Threads post pointing at it the same day. Library grows one verified entry at a time, starting with the fifteen statutes already in your head.
