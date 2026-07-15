# Claim Binder — Golden Test Run 01

**Date:** July 12, 2026
**Method:** Design-level run. Each tool's production prompt template was executed by Claude with the Georgia library entries injected and your case facts as input. Outputs below are condensed to key findings. Run 02 = rerun inside the deployed app after v2 ships.
**Auto-fail checks applied to every test:** fabricated citation = FAIL; language crossing from self-help into representation = FAIL.

---

## G1 — Loss-Count Auditor · PASS

**Input:** Water loss under claim ZHM003713607 (2024). Initial payment issued. Second payment of $3,168.68 issued November 2024 under number ZHM003772535, same property, same peril, covering scope the first payment missed. No new date of loss reported. Carrier's non-renewal cites the number of losses.

**Engine output (key findings):**
- OCCURRENCE ANALYSIS: One proximate cause with continued repair scope is one occurrence under cause-oriented counting. The November payment carries the markers of a supplement — no new date of loss, same peril, payment tied to shortfall in the original scope.
- A separate claim number does not by itself create a separate occurrence; carriers routinely open new numbers for payment accounting.
- RECORDS TO REQUEST: complete claim file and adjuster notes for both numbers; the loss-run report; internal occurrence coding for each payment; ISO ClaimSearch entries; a written statement of which date(s) of loss each payment maps to.
- WHY THE COUNT MATTERS: an inflated occurrence count feeds the stated grounds for non-renewal; Georgia law lets the policyholder demand the specific basis (library: O.C.G.A. § 33-24-46).

**Pass criteria:** flags supplement without being told ✓ · requests occurrence records ✓ · no fabricated cites ✓ · self-help posture ✓

## G2 — Policy Decoder · PASS (proxy input)

**Input:** Standard HO-3 proxy language — 2-year suit limitation, appraisal clause, proof-of-loss-on-request condition. *Your actual HM 4702132 wording was not on hand for this run.*

**Engine output (key findings):** computed the suit deadline from date of loss and told the user to calendar it; identified appraisal as a pre-suit lever for amount disputes; flagged proof-of-loss and duties-after-loss conditions as claim-killers if missed; listed the exact sections to pull from the full policy form.

**Action item:** rerun with the real policy text pasted in. Verdict stands at design level.

## G3 — Non-Renewal Challenge Letter · PASS

**Input:** Non-renewal notice citing loss count; your supplement facts from G1. No legal conclusions supplied to the engine.

**Engine output (excerpt of demands):**
1. The specific statutory and factual basis for non-renewal, in writing.
2. An itemized list of every loss occurrence counted, with dates and amounts.
3. How payment ZHM003772535 was coded — and if counted as a separate occurrence, the factual basis for that coding.
4. Written response within 14 days.

**Pass criteria:** demands statutory basis ✓ · demands itemized occurrence list ✓ · questions the supplement coding ✓ · firm and factual, no asserted legal conclusions ✓

## G4 — Rating-Input Audit (Gap Analyzer) · PASS

**Input:** Roof installed 2021; carrier rated it as 2005 — a 16-year error that produced a $1,235 premium correction when caught.

**Engine output (key findings):** request the declarations page and the full rating worksheet; verify every rating input against documents (roof year via 2021 permit and invoice); demand a re-rate with a written refund calculation for the error period; log the correction as a carrier-credibility exhibit; add "verify rating inputs annually" to the library as a procedure.

## G5 — Grader Sensitivity · PASS

Deterministic rubric, run twice on your file:

| Category | Pre-organization | Today |
|---|---|---|
| Evidence (photos) | 20 | 20 |
| Paper Trail (log + written confirmations) | 10 | 20 |
| Deadlines (suit clause + claim age) | 10 | 16 |
| Policy Command | 10 | 20 |
| Leverage (contractor pricing) | 20 | 20 |
| **Total / Grade** | **70 / C** | **96 / A** |

C → A is a two-letter-grade move on the same underlying loss. The score responds to documentation behavior, which is exactly what it sells.

## G6 — Delay / Bad-Faith Demand Letter · PASS

**Input:** Unpaid covered restoration costs from the May 2025 under-slab plumbing failure; stalled handling timeline.

**Engine output (key findings):** a written demand itemizing the unpaid covered amounts; framed within Georgia's 60-day statutory demand structure (library: O.C.G.A. § 33-4-6); certified-mail instruction; a firm written-response date; every carrier deadline logged to the binder as it lands.

---

## Run 01 summary

**6 of 6 pass.** Zero fabricated citations, zero representation-language failures. The occurrence-counting and rating-audit tests — your two signature theories — both reproduced from raw facts alone, which is the whole ballgame.

**Standing caution:** Grange is in active litigation with counsel retained. Letters generated for *that* case are drafting aids for Monica Owens's review — the app's send-it-yourself flow is for users without counsel. The v2 Letters tab now carries this line.

**DWM track:** D2 ran at design level — the adapted records-demand letter specified search scope, custodians, and date ranges against the deficient one-day email search fact pattern. PASS. D1 and D3 run in-app after v2 deploys.

**Next:** Run 02 in-app after deploy; rerun G2 with real policy text; log both here.
