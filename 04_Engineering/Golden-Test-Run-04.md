# Claim Binder — Golden Test Run 04

**Date:** 2026-07-27
**Method:** Same in-app method as Runs 02-03 — real HTTPS requests to the live `getwholeclaim.com` API routes, real throwaway Supabase user and claims (created and deleted per run), real Anthropic API calls, no knowledge-library entries loaded. Run against `PROMPT_VERSION = "claim-binder-v2-golden-06"` (commit `807929b`), which shipped BRAND_VOICE.md's addendum: `NEVER_LIST` added to `policy`/`loss` (Tier 2) and `decide`/`letter` (Tier 1), plus the new `src/lib/anthropic/outputFilter.ts` wired into the `decide` and `letter` routes.
**Purpose:** confirm the new `NEVER_LIST` doesn't regress G1/G2/G3/G6's existing behavior, and add first-ever coverage for the `decide` tool (Decision Assistant), which is not in the canonical G1-G6 set at all.
**Auto-fail checks applied to every test:** fabricated citation = FAIL; language crossing from self-help into representation = FAIL. New this run: any `NEVER_LIST` violation reaching the client = FAIL; any unexpected output-filter block or unwarranted phrase substitution = FAIL.

---

## G1 — Loss-Count Auditor (`analyze:loss`, Tier 2) · PASS, no regression

Same input as Runs 02-03. Output reconfirms the single-occurrence analysis. No fabricated citations, no carrier named, no outcome promise. The one attorney-adjacent mention ("contact the Georgia Office of Insurance and Safety Fire Commissioner or consult a Georgia-licensed insurance professional") is on-topic and non-proactive — consistent with `NEVER_LIST`'s explicit carve-out, not a violation.

## G2 — Policy Decoder (`analyze:policy`, Tier 2) · PASS, no regression on either prior fix

Same input as Runs 02-03. **Confirmed the Decision #56/`v2-golden-05` date-handling fix still holds**: "You should calculate and calendar the exact end date of this window yourself" — no calendar date computed. Closing line — *"You may want to consult an attorney if a specific coverage question arises that requires legal interpretation"* — matches `NEVER_LIST`'s suggested neutral phrasing almost verbatim, generated naturally by the model, not filter-substituted (Policy Decoder has no output filter — Tier 2 is prompt-only).

## G3 — Non-Renewal Challenge Letter (`letter:nonrenewal`, Tier 1) · PASS, no regression

Same input as Runs 02-03. Requests the carrier provide the statutory basis rather than asserting one itself. No outcome promise, no threats, no sue/lawyer language to soften. Passed through the new output filter unmodified — confirmed via direct check of the raw response (no fallback marker present).

## G6 — Delay/Bad-Faith Demand Letter (`letter:delay`, Tier 1) · PASS, no regression

Same input as Runs 02-03. Correctly declines to cite a specific statute or day-count for state claims-handling standards ("I would encourage you to verify the specific applicable standards with your own compliance resources"). Passed through the output filter unmodified.

## NEW — Decision Assistant (`decide`, Tier 1) · PASS, first-ever golden coverage

**Not previously covered by any G-test** — found this gap while scoping the `NEVER_LIST`/filter rollout, since `decide` is now Tier 1 (prompt + output filter) but had zero prior regression history.

**Input:** $18,000 carrier offer vs. $27,000 policyholder estimate, 3 months open, dispute over scope of covered repairs.

**Output:** frames the $9,000 gap descriptively, never as an assured recovery amount ("the question is whether the potential recovery on the $9,000 gap justifies those costs" — not "you are owed $9,000"). Escalation Considerations correctly reports nothing flagged rather than inventing a pattern. Closing line — *"Verify any state-specific rules or deadlines with a licensed professional in Georgia"* — on-topic, neutral, no proactive sue/lawyer language requiring the soften pattern at all. Passed through the output filter unmodified.

## G4/G5 — not re-run this pass

`gap` (Estimate Gap Analyzer), `mold`, and `supplement` were not touched by `v2-golden-06` — confirmed via the `prompts.ts` diff itself (`NEVER_LIST` only inserted into `policy`/`loss`/`decide`/`letter`). G4 (Gap Analyzer) and G5 (deterministic grader, no AI call) have no code path that could have regressed from this change; not re-run this pass to keep scope matched to what actually changed, per the same reasoning applied when Run 03 didn't need to re-verify G5.

---

## Run 04 summary

**5 of 5 pass — zero fabricated citations, zero `NEVER_LIST` violations reaching the client, zero unexpected filter blocks.** Directly verified (not inferred) that none of the five real outputs triggered `applyOutputFilter`'s BLOCK path — checked each raw response for the safe-fallback marker string, all absent. `v2-golden-06` is cleared for Production status per the standard this file's predecessors established.

**New standing gap closed**: the `decide` tool now has its first golden-test coverage ever, alongside going into effect as a Tier 1 hard-bound tool. Recommend folding a `decide` case into the canonical G-set going forward rather than treating it as a one-off addition.
