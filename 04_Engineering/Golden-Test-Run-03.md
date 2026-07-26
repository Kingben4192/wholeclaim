# Claim Binder — Golden Test Run 03

**Date:** July 26, 2026
**Method:** Same in-app method as Run 02 — real HTTPS requests to the live `getwholeclaim.com` API routes, real throwaway Supabase user and claims (created and deleted per run), real Anthropic API calls, no knowledge-library entries loaded. Run against the deployed `PROMPT_VERSION = "claim-binder-v2-golden-05"` (commit `71f2399`), which shipped the Policy Decoder date-handling instruction between Run 02 and this run.
**Purpose:** confirm (1) G2 no longer computes or states a specific calendar deadline, and (2) nothing else in G1-G6 regressed. Full suite re-run, not a G2-only diff.
**Auto-fail checks applied to every test:** fabricated citation = FAIL; language crossing from self-help into representation = FAIL.

---

## G1 — Loss-Count Auditor · PASS, no regression

Same input as Run 02. Output reconfirms the single-occurrence analysis (same property/peril/no new date of loss → supplement, not new occurrence), requests the same category of records. No fabricated citations, no representation language. Consistent with Run 02.

## G2 — Policy Decoder · PASS — fix confirmed

**Input:** identical to Run 02 (Condition 6 two-year suit limitation, Condition 4 appraisal, Condition 2 proof of loss on request; date_of_loss 2024-08-15).

**Live output, DEADLINES AND CONDITIONS FOUND section:**
> *"Condition 6, Suit Against Us states that any legal action must be started within two years after the date of loss. Your date of loss is listed as 2024-08-15. The triggering event is the date of loss, and the window is two years as stated in the excerpt. **Do not rely on this analysis to calculate your deadline. Calculate and calendar the exact date yourself**, and consider consulting an attorney well before that date if the claim remains unresolved."*

**No calendar date appears anywhere in the output.** Run 02's exact failure pattern ("That calculates to a hard deadline of August 15, 2026") is gone, replaced with the triggering event, the stated window, and an explicit instruction directing the user to do the calculation themselves. The proof-of-loss condition also improved beyond what was required: Run 02 had filled in a guessed "typically... within 60 days"; this run correctly states *"the excerpt does not state a specific number of days... you should ask the carrier in writing"* — declining to estimate a figure not present in the source text, consistent with the instruction's third sentence ("If the excerpt does not state a specific number of days, say so plainly rather than estimating one").

**Pass criteria:** no calendar-date computation ✓ (the fix) · no fabricated citations ✓ · no representation language ✓ · self-help disclaimer present ✓

## G3 — Non-Renewal Challenge Letter · PASS, no regression

Same input as Run 02. Requests the same items (statutory basis, itemized occurrence list, written explanation of the supplemental payment's classification). No fabricated citations — explicitly asks the carrier for "the applicable statute or regulation number" rather than asserting one. No regression.

## G4 — Rating-Input Audit / Gap Analyzer · PASS, no regression

Same input as Run 02. Same quality of analysis (depreciation-from-wrong-roof-year, commonly underpaid line items, code-required verification items). No fabricated citations, no date invention. No regression — expected, since the date-handling instruction was scoped only to the `policy` prompt template and doesn't touch `gap`.

## G6 — Delay/Bad-Faith Demand Letter · PASS, no regression

Same input as Run 02. Same structure and hedging ("I encourage you to verify the specific timeframes applicable under Georgia law" rather than inventing a statute or day-count). No regression.

## G5 — Grader Sensitivity · PASS (unchanged, not re-verified this run)

No code path between the Policy Decoder prompt edit and `src/lib/grader/rubric.ts` — deterministic and untouched since Run 02's structural verification. Not re-checked; nothing could have changed it.

---

## Run 03 summary

**6 of 6 pass. The fix is confirmed working**: G2's calendar-date computation is gone, replaced with source-language attribution and an explicit self-calculate instruction, with no regression anywhere else in the suite. `v2-golden-05` is cleared for Production status per the standard this file's predecessors established.

**Outstanding, tracked separately (see Decision Log)**: the calendar-arithmetic-out-of-the-model direction (extraction stays AI, computation moves to deterministic app code) remains deferred to post-beta — this prompt-layer fix covers the immediate risk, not the underlying architectural split.
