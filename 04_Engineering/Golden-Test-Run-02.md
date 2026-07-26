# Claim Binder — Golden Test Run 02

**Date:** July 26, 2026
**Method:** In-app run — the first genuine "Run 02" per Run 01's own next-step note ("Run 02 = rerun inside the deployed app after v2 ships"). Unlike Run 01's design-level walkthrough, this run made real HTTPS requests to the live `getwholeclaim.com` API routes (`/api/ai/analyze`, `/api/ai/letter`), authenticated as a real throwaway Supabase user (`@wholeclaim-test.local`, created via the Admin API, deleted after), against real seeded claim/entry data, calling the live Anthropic API through `PROMPT_VERSION = "claim-binder-v2-golden-04"` — the prompt version that has been deployed, unregressed, since 2026-07-2x. No knowledge-library entries were loaded for the test account, which is a *stricter* condition than Run 01's proxy setup: any citation appearing in output below would have to be either genuinely invented (auto-fail) or correctly withheld.
**Scope:** full G1-G6 against current deployed state, not a diff against any single change — this run covers the backlog debt from three unregressed prompt versions (`v2-golden-02`, `-03`, `-04`) as well as establishing the baseline for the upcoming Policy Decoder date-handling fix.
**Auto-fail checks applied to every test:** fabricated citation = FAIL; language crossing from self-help into representation = FAIL.

---

## G1 — Loss-Count Auditor (`analyze:loss`) · PASS

**Input:** water loss under claim ZHM003713607 (2024-03-10), initial payment issued 2024-03-15; second payment of $3,168.68 issued 2024-11-12 under claim ZHM003772535, same property/peril, no new date of loss; non-renewal notice received 2024-12-01 citing loss count.

**Live output (key findings):** correctly identifies the single-occurrence profile (one date of loss, same peril, same property, second payment described as covering missed scope); explicitly states "the existence of a new number... does not by itself make the second payment a separate occurrence"; lists concrete records to request (loss run, claim file notes, underwriting file, payment ledger); Escalation Considerations correctly flags the REPEATED SAME-PERIL PAYMENTS pattern as a decision aid, not a directive ("This is a decision aid. No conclusion is being drawn about this specific case, and this is not legal advice").

**Pass criteria:** flags supplement without being told ✓ · requests occurrence records ✓ · no fabricated citations (correctly declines to cite a specific Georgia statute with no library entry present — stricter than Run 01) ✓ · self-help posture ✓

## G2 — Policy Decoder (`analyze:policy`) · PASS, with the known finding confirmed

**Input:** HO-3 proxy language — Condition 6 (2-year suit limitation), Condition 4 (appraisal), Condition 2 (proof of loss on request); claim date_of_loss set to 2024-08-15.

**Live output (key findings):** correctly organizes coverage/exclusions/deadlines/questions; appropriately hedges where the excerpt is silent ("Go check the Perils Insured Against section... for the exact language confirming this"); correctly declines to state a specific proof-of-loss day-count not present in the excerpt ("though your excerpt does not state a specific number of days. Locate that specific time frame in your full policy").

**Confirmed finding, not a new failure — this is what Run 02 was run to check**: under DEADLINES AND CONDITIONS FOUND, the model computed and stated a specific calendar date: *"That calculates to a hard deadline of August 15, 2026."* This exactly reproduces Run 01's flagged G2 behavior ("computed the suit deadline from date of loss and told the user to calendar it"). The behavior is unchanged in the currently-deployed prompt. This is the documented baseline for the Policy Decoder date-handling instruction — Run 03 (after that instruction ships) checks specifically that this pattern no longer appears.

**Pass criteria:** no fabricated citations ✓ · no representation-language crossing ✓ · self-help disclaimer present ✓ · **date-handling gap confirmed present, tracked for Run 03**

## G3 — Non-Renewal Challenge Letter (`letter:nonrenewal`) · PASS

**Input:** non-renewal notice citing loss count; G1's supplement facts.

**Live output (key requests):** written statutory/factual basis for non-renewal; itemized loss occurrence list with dates/claim numbers/amounts; explicit written explanation of how the Nov 12 payment was recorded; 14-day response window (WholeClaim's own template convention, not a policy-derived deadline).

**Pass criteria:** demands statutory basis ✓ (correctly asks the carrier to provide it rather than asserting one itself — no library entry was available) · demands itemized occurrence list ✓ · questions the supplement coding ✓ · firm and factual, no asserted legal conclusions ✓

## G4 — Rating-Input Audit / Gap Analyzer (`analyze:gap`) · PASS

**Input:** roof installed 2021 per contractor invoice/permit; carrier rated it as 2005, a $1,235 premium correction when caught.

**Live output (key findings):** correctly ties the roof-year error to excess depreciation across every roof line item; names specific commonly-underpaid items (starter strip, hip/ridge cap, pipe boots, step flashing); asks the adjuster where the 2005 date originated and whether a revised estimate will be issued. No specific dates invented; all deadline-adjacent language ("what are the specific steps and deadlines to submit for release of those funds") is phrased as a question to the adjuster, not an asserted fact.

**Pass criteria:** identifies the rating-input error's downstream effect ✓ · requests re-rate and written refund calculation ✓ · no fabricated citations ✓

## G5 — Grader Sensitivity · PASS (structural verification, no AI call)

Deterministic rubric — no Anthropic call involved, so this isn't re-run against a specific case; verified the scoring logic itself hasn't drifted. `src/lib/grader/rubric.ts` has exactly one commit in its entire history (`886a48e`, the original M2-M6 build) — never modified since Run 01. `CATEGORIES` (`Evidence`, `Paper Trail`, `Deadlines`, `Policy Command`, `Leverage`) and per-question point weights (e.g. the photos question's 20-point max) match Run 01's documented table exactly. Deterministic and untouched — same input still produces the same score by construction.

## G6 — Delay/Bad-Faith Demand Letter (`letter:delay`) · PASS

**Input:** unpaid covered restoration costs from a May 2025 under-slab plumbing failure; handling stalled ~3 months with no written status.

**Live output (key findings):** requests written status, a specific decision date, itemized outstanding requirements, and the responsible adjuster's contact info; references "claims-handling regulations that establish time standards" without inventing a specific statute or day-count — appropriately more hedged than Run 01's version (which cited O.C.G.A. § 33-4-6 from a library entry that isn't present in this test account), correctly reflecting the absence of library data rather than fabricating a citation to fill the gap.

**Pass criteria:** written demand itemizing unpaid amounts ✓ · firm written-response date requested ✓ · no fabricated citations ✓ · no representation language ✓

---

## Run 02 summary

**6 of 6 pass — including the deliberately stricter no-library-entry condition, which surfaced zero invented citations across five real Anthropic API calls.** This closes the regression debt for `v2-golden-02`, `-03`, and `-04`, none of which had ever been tested in-app before this run (see the separate Decision Log entry logged for that process gap).

**The one confirmed, expected finding**: G2 still computes and states a specific calendar deadline ("August 15, 2026") from a stated day-count and the claim's date of loss, rather than stating the period and directing the user to calculate/confirm it themselves. This is the exact behavior the proposed Policy Decoder date-handling instruction (Decision #56 follow-up) targets. Baseline established — Run 03, after that instruction ships with a `PROMPT_VERSION` bump, checks specifically that this pattern is gone and that nothing else in G1-G6 regressed.

**Method note for future runs**: this is the first Golden Test Run actually executed against the deployed app via real API calls rather than a design-level walkthrough — a real (small) Anthropic API cost was incurred (5 live calls, well under the 20/hour IP rate cap), using disposable test claims/users cleaned up immediately after. Recommend this become the standard method for future runs given it validates the actual deployed code path (rate gates, context assembly, `ai_runs` logging) alongside the prompt output itself, not just the prompt text in isolation.
