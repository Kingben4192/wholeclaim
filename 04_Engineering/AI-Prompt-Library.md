# Appendix A — AI Prompt Library & Prompt Governance v1.1

**Position in the Operating Manual:** between Volume IV (Engineering Architecture) and Volume X (Legal & Compliance). This appendix is the behavioral contract of every AI system WholeClaim runs — prompts and agents alike.
**Classification: trade secret.** Templates and agent charters live server-side (or in the private repo) only. Any template change bumps its version and triggers full golden-test regression.

## A.1 Registry

| ID | Prompt / Agent | Version | Owner | Status | Tests | Budget |
|---|---|---|---|---|---|---|
| PD | Policy Decoder | 1.0 | Founder | Production* | G2 | <1,200 words |
| GA | Estimate Gap Analyzer | 1.0 | Founder | Production* | G4 | <1,200 |
| LC | Loss-Count Auditor | 1.0 | Founder | Production* | G1 | <1,000 |
| LB | Letter Builder (4 types) | 1.0 | Founder | Production* | G3, G6, D2 | <1,500 |
| DA | Decision Assistant | 1.0 | Founder | Production* | — | <900 |
| MC | Mold Coverage Timeline | 1.0 | Founder | **Not yet Production** — pending Test Run 02 | — | <900 |
| SU | Supplement Assistant | 1.0 | Founder | **Not yet Production** — pending Test Run 02 | — | <1,300 |
| LI | Library Ingestion | 1.0 | Founder | Production* | invalid-JSON case | <600 |
| CG | Claim Grade narrative | 1.0 | Founder | Production* | G5 | <700 |
| FA | Founder Assistant (agent) | 1.0 | Founder | **Active** — charter in 00_Founder | manual review | <1,200 |
| WA | WholeClaim Assistant (in-app agent) | 1.0 | Founder | **Spec** — build at v1.1 | G1–G6 + action tests | <1,500 |
| SA | Site Assistant (website agent) | 1.0 | Founder | **Spec** — build at launch+ | FAQ-grounding tests | <800 |

*Production status is confirmed at Test Run 02 in the deployed app. Budgets are template word counts — they control API cost, latency, and consistency.

## A.2 Universal rules (all prompts and agents)

1. **Deterministic first.** Scores, grades, deadlines, and rule-based outputs are computed by code. AI explains results; it never determines them.
2. **Fabrication is a release blocker.** No invented citations, prices, dates, statutes, or factual conclusions — ever.
3. **Confidence routing — uncertainty beats hallucination.** When the provided documentation cannot support a finding, the required behavior is the standard line — *"This can't be determined from the documentation provided."* — plus exactly what is missing and which document would resolve it. Analysis contracts gain a WHAT COULD NOT BE DETERMINED section. (Implemented as template revision 1.1 at milestone M2, with full regression.)
4. **Self-help boundary.** No representation language, no legal conclusions asserted as fact, no outcome predictions — in prompts, agents, or their tool descriptions.
5. **Injection blocks:** CLAIM CONTEXT + OWNER-APPROVED KNOWLEDGE LIBRARY (active entries, cap 12), preferring library entries over model memory, always instructing final verification.

## A.3 Traceability — no anonymous AI outputs

Every AI execution writes to `ai_runs`:

| Field | Meaning |
|---|---|
| prompt_version | e.g. LC-1.1 — the exact template that ran |
| model_version | e.g. claude-sonnet-4-6 — model changes explain drift that prompt diffs can't |
| library_rev | Integer bumped on every library approve/edit/deactivate — the knowledge state at run time |
| tokens_in / tokens_out / latency | Cost and performance per run |
| tool / agent_id, user, claim, timestamp | Who, what, where, when |

Any output in the wild traces to its template, model, and knowledge state. "I think we updated the prompt around then" is not an acceptable sentence at this company.

## A.4 Prompt specifications (unchanged from v1.0, summarized)

**PD** — coverage / exclusions / deadlines / written questions from pasted policy language; silent sections route to the standard HO-3 section to check. **GA** — missing trades, code items, underpaid items, documentation steps; prices come from library `price` entries or instructions to obtain real numbers. **LC** — occurrence analysis, supplement flags, records to request; the signature prompt (reproduced the founder's litigation theory from raw facts, G1). **LB** — four letter types; [DATE]→signature-block structure; supplement-not-new-occurrence assertion; 14-day response deadline; self-help closing line. **DA** — sign-or-fight framework, never a directive. **MC** — auto-detected water/mold timeline (date of loss + keyword-matched entries/evidence, `buildMoldSignals`) narrated into timeline summary, general mold-risk timing education, mitigation documentation to gather, and a pointer to verify policy/state specifics — never states a specific reporting deadline as fact unless it is sourced from an owner-approved library entry. **SU** — takes a carrier estimate and a contractor estimate (or the policyholder's own scope description) separately, explains what a supplement is generally, itemizes gaps between the two, and ends in a ready-to-copy supplement letter (same shape rules as LB's supplement type: not-a-new-occurrence, 14-day response deadline, self-help closing line). Distinct from GA (single-blob analysis only, no letter) and from LB's supplement type (freeform facts only, no two-estimate comparison). **LI** — JSON-only draft entries with confidence + verify_note; nothing influences analysis until owner-approved. **CG** — narrative only; the deterministic layer computes every number first.

## A.5 Agent architecture — three tiers

Agents are prompts with memory, tools, and turns. They enter production the same way prompts do: registered above, versioned, tested, and bound by every rule in A.2. The product's own philosophy governs its agents: **AI drafts and explains; the human decides.**

**Tier 1 — FA, the Founder Assistant (active today, zero build).**
Runs in Claude Code or Claude Cowork with the company repository as its working directory — the repo *is* its brain (Decisions, Metrics Bible, Cadence, Product Bible). Charter: `00_Founder/Founder-Agent-Charter.md`. Permissions: read everything; draft anything; **send nothing, decide nothing, purchase nothing.** Weekly duties: Sunday review prep from the Metrics Bible, decision-log drafting, content batches from the Messaging Guide, golden-test regression runs, milestone driving per the Build Brief.

**Tier 2 — WA, the WholeClaim Assistant (in-app, ships v1.1).**
A chat surface inside the app that operates the user's own binder through registered tools: `read_claim`, `read_entries`, `read_deadlines`, `add_entry`, `add_deadline`, `run_analysis`, `draft_letter`. Permission model: **reads are free; writes require explicit user confirmation** rendered as a confirm card ("Add this entry? [text]"). It answers "what's my next deadline," logs a call from dictation, and routes to the right tool — it never contacts anyone, never predicts outcomes, and refuses out-of-scope requests with the confidence-routing line. Acceptance: passes G1–G6 through conversation plus write-confirmation tests (no unconfirmed mutation, ever).

**Tier 3 — SA, the Site Assistant (website, launch+).**
Pre-sales and support agent grounded exclusively in the published FAQ, Features, Pricing, and Evidence Standard landing pages. It answers "are you a public adjuster?" with the We-are-NOT block, routes claim questions to the grader, and support questions to email. Hard grounding: if the answer isn't in its source pages, it says so and links the Contact page. No claim analysis, no account access, no exceptions.

**Agent registry rule:** no agent exists outside this appendix. Any new agent = a registry row + charter + permission table + test set before it touches a user or the founder's operations.

## A.6 Change control

1. Edit a template or charter → bump version → record diff and reason here.
2. Full regression: G1–G6, LI invalid-input, and (once live) WA write-confirmation tests — in the deployed app.
3. Two consecutive clean runs; any universal-rule violation = rollback.
4. `ai_runs` makes every output traceable to template + model + library revision.

### Change log

**2026-07-17 — PROMPT_VERSION bumped to `claim-binder-v2-golden-02` (LC, DA).**
- CLAIM CONTEXT (shared by all five prompts) now includes real recent entries (up to 15, not just a count), the full evidence checklist with per-item status (on file / checked-no-file / not started), and all tracked deadlines with overdue flagged — previously only a claim summary + entry count.
- LC (loss) and DA (decide) gained a new deterministic ESCALATION PATTERN CHECK block, computed in code (`buildEscalationSignals`, `src/lib/anthropic/context.ts`) from the claim's own rows — never inferred by the model. Three patterns detected: blown deadline (overdue `deadlines` rows), repeated same-peril payments (2+ `entries` of type `payment`), non-renewal dispute (a `letter:nonrenewal` row exists in `ai_runs` for this claim). **Denied claim is deliberately not detected** — there is no status field anywhere in the schema to support it; the grader asks this exact question but the answer is currently discarded rather than stored on `claims`, a separate open gap.
- Both prompts gained an ESCALATION CONSIDERATIONS heading instructing the model to name the pattern category and explain why it's typically worth attention, framed as a decision aid the user applies themselves — never a directive, never a conclusion about the specific case (per A.2 rule #4). LC also gained a WHAT COULD NOT BE DETERMINED heading, implementing A.2 rule #3 explicitly in the template text (previously documented as implemented at M2 but not actually present in the shipped prompt).
- **Status: not yet Production per A.6** — requires Test Run 02 (G1, G5-adjacent) in the deployed app, two consecutive clean runs, before this counts as confirmed. Not yet run as of this entry.

**2026-07-17 — PROMPT_VERSION bumped to `claim-binder-v2-golden-03` (new tool: MC, Mold Coverage Timeline).**
- New registry entry, not an edit to an existing template — bumped per A.6 rule 1 regardless, since the shared `prompts.ts` file changed. Roadmap Phase 1, tagged Pro (real AI cost, shares the existing `checkUsageGate` cap unchanged per Decision #30 — no new gating mechanism).
- New deterministic layer `buildMoldSignals` / `formatMoldSignals` (`src/lib/anthropic/context.ts`): reads `claims.date_of_loss` and `damage_category` directly, keyword-matches `entries.summary` and `evidence_items.label` against a fixed water/mold term list (water, leak, pipe, plumbing, flood, moisture, mold, mildew, dry-out, remediation, mitigation, humidity, sewage, dehumidif). Every date and match is a direct read of the claim's own rows — nothing inferred from free text beyond the keyword match itself, no AI involved in detection.
- Unlike PD/GA/LC, MC requires no freeform user paste — `input` is optional for this tool in `/api/ai/analyze` (`NO_INPUT_REQUIRED`), since the timeline is fully auto-detected. UI (`MoldTimelineCard.tsx`) is a single Run button on the shared `AIToolCard` shell.
- Prompt explicitly forbids asserting any specific reporting-window day-count as fact unless it is directly sourced from an owner-approved Knowledge Library entry (A.2 rule #2, #4) — mold/water reporting deadlines and sublimits vary by policy and state and are not in this app's schema anywhere. Gained a WHAT COULD NOT BE DETERMINED heading (A.2 rule #3) for the same reason PD/GA/LC/DA have one.
- **Status: not yet Production per A.6** — requires Test Run 02 in the deployed app, two consecutive clean runs, before this counts as confirmed. Not yet run as of this entry.

**2026-07-17 — PROMPT_VERSION bumped to `claim-binder-v2-golden-04` (new tool: SU, Supplement Assistant).**
- New registry entry. Roadmap Phase 1, tagged Pro; shares the existing `checkUsageGate` cap unchanged per Decision #30 — no new gating mechanism.
- New route `src/app/api/ai/supplement/route.ts`, mirroring the DA (`/api/ai/decide`) pattern (structured multi-field body, not the single-`input` shape used by PD/GA/LC/MC) since this tool takes two separate estimates rather than one freeform paste. New prompt fn `supplementPrompt(carrierEstimate, contractorEstimate, ctx, lib)` in `prompts.ts`.
- Deliberately distinct from two existing tools it could be confused with: GA analyzes a single estimate blob and never drafts a letter; LB's `supplement` letter type drafts from freeform facts but does no estimate comparison. SU does both — WHAT A SUPPLEMENT IS / GAP ANALYSIS / WHAT COULD NOT BE DETERMINED / DRAFT SUPPLEMENT REQUEST — as one AI call, ending in a ready-to-copy letter with the same not-a-new-occurrence and 14-day-deadline shape rules LB already uses, gained a WHAT COULD NOT BE DETERMINED heading per A.2 rule #3.
- **Status: not yet Production per A.6** — requires Test Run 02 in the deployed app, two consecutive clean runs, before this counts as confirmed. Not yet run as of this entry.
