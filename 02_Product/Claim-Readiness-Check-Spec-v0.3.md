# Claim Readiness Check — Product Spec (v0.3 — Frozen)

**Status:** Reviewed and frozen. Approved for build AFTER homeowner MVP launches — not before.
**Author:** Drafted for Benjamin, WholeClaim
**Date:** 2026-07-27
**Changelog:** v0.3 — §8.2 resolved: the check runs fully anonymous, account only required to save results. v0.2 — naming locked (Decision #66), v1 ships without uploads, EVIDENCE scoring reworked to binary self-attested for v1 (0.25 multiplier reserved for v2), "Not sure" option added to EVIDENCE questions, results disclaimer made mandatory, weights and scoring versioned.

---

## 1. Purpose

A free, pre-loss self-assessment that tells a homeowner how well documented their property is *before* anything goes wrong, and what is missing.

It exists to solve one specific GTM problem: WholeClaim currently has no reason for a homeowner to sign up before a disaster. SEO content, agent partnerships, and new-homeowner outreach have nowhere to send people. This is that destination.

**It is not a claim.** It does not create a claim record. It does not score a claim. It scores the completeness of a homeowner's property documentation at rest.

---

## 2. Naming — read this before writing any code

Decision #59 established two scoring systems that must never be conflated:

| Name | What it is |
|---|---|
| **Claim Grade** | The free front-door quiz on an active claim |
| **WholeClaim Documentation Score** | The engine that scores documentation on a claim |

This is a **third** system. It must not inherit either name, and its output must not be a letter grade — letter grades are Claim Grade's visual language, and reusing them will re-conflate what #59 separated.

**Decision #66 (Invariant) — LOCKED 2026-07-27:** The pre-loss homeowner assessment is named **Claim Readiness Check**. It produces a **Readiness Score** (0–100) and a **Readiness Band** (text label) only. It must never display letter grades, and must never reuse "Claim Grade" or "WholeClaim Documentation Score" terminology in UI, code identifiers, or copy.

> Numbering note: review proposed #64, but Decisions.md already holds #46–65 from the 2026-07-26 session. This logs as **#66**. Claude Code: verify the next free number against Decisions.md before committing the entry, and carry the same Invariant marking #59 uses.

---

## 3. Scope

**In scope for v1:** a question set, a deterministic score, a results page listing gaps. No file uploads (see §8.1, resolved).

**Out of scope for v1:**
- **File uploads of any kind** — deferred to v2, contingent on v1 completion-rate data
- All of the following, which are Property History Layer and stay parked:
- Maintenance reminders or scheduled prompts
- Warranty expiration tracking
- Renovation project records
- Annual re-check automation
- Any contractor directory, recommendation, or referral surface
- Sharing or exporting the readiness record

---

## 4. Question set

Six categories, 24 questions. Every question is answerable by a homeowner in under 15 seconds without leaving the couch.

### Category A — Policy Knowledge (weight 20)

Rationale: highest weight per question. A homeowner who cannot locate their policy or state their deductible is blocked on step one of any claim, and this is the cheapest gap to close.

| ID | Question | Type |
|---|---|---|
| A1 | Do you have a copy of your current homeowner's policy saved somewhere you could find it today? | EVIDENCE |
| A2 | Do you know your deductible amount? | KNOWLEDGE |
| A3 | Do you know whether your policy pays replacement cost or actual cash value? | KNOWLEDGE |
| A4 | Do you know your carrier's claim phone number or portal login? | KNOWLEDGE |
| A5 | Do you have your policy number recorded somewhere other than the policy itself? | KNOWLEDGE |

### Category B — Property Baseline Condition (weight 25)

Rationale: highest category weight. Pre-loss condition photos are the single hardest thing to reconstruct after damage occurs — they are literally impossible to create retroactively. Everything else on this list can be assembled late; this cannot.

| ID | Question | Type |
|---|---|---|
| B1 | Do you have photos of each interior room taken within the last 12 months? | EVIDENCE |
| B2 | Do you have photos of the exterior on all four sides? | EVIDENCE |
| B3 | Do you have photos or documentation of the roof's current condition? | EVIDENCE |
| B4 | Do you have photos of the basement, crawlspace, or attic? | EVIDENCE |
| B5 | Do you have photos of flooring in each major room? | EVIDENCE |

### Category C — Major Systems & Appliances (weight 20)

Rationale: age and model drive depreciation disputes. A homeowner who can produce a water heater's install date and model number is in a materially different position than one who cannot.

| ID | Question | Type |
|---|---|---|
| C1 | Do you know the age of your roof? | KNOWLEDGE |
| C2 | Do you have the model and serial number of your HVAC system? | EVIDENCE |
| C3 | Do you have the model, serial, and install date of your water heater? | EVIDENCE |
| C4 | Do you have documentation for major appliances (fridge, washer, dryer, range)? | EVIDENCE |
| C5 | Do you have a photo of your electrical panel with the breakers legible? | EVIDENCE |

### Category D — Contents Inventory (weight 15)

| ID | Question | Type |
|---|---|---|
| D1 | Do you have a list or photos of high-value items (electronics, jewelry, tools, instruments)? | EVIDENCE |
| D2 | Do you have receipts or appraisals for any items worth more than $1,000? | EVIDENCE |
| D3 | Do you have photos of the contents of closets, garage, or storage areas? | EVIDENCE |
| D4 | Do you know roughly what your policy's contents coverage limit is? | KNOWLEDGE |

### Category E — Repair & Improvement History (weight 12)

| ID | Question | Type |
|---|---|---|
| E1 | Do you have records of major repairs done in the last 5 years? | EVIDENCE |
| E2 | Do you have before-and-after photos of any renovation work? | EVIDENCE |
| E3 | Do you have permits or inspection records for permitted work? | EVIDENCE |

### Category F — Emergency Readiness (weight 8)

Rationale: lowest weight, but these are the questions that pay off in the first hour of a loss.

| ID | Question | Type |
|---|---|---|
| F1 | Do you know where your main water shutoff is? | KNOWLEDGE |
| F2 | Do you know where your main electrical disconnect is? | KNOWLEDGE |

---

## 5. Scoring model

### 5.1 Question types

**KNOWLEDGE** — the answer is something the homeowner holds in their head. No file can prove it. Binary, two options only.
- `yes` → 1.0
- `no` → 0.0

Do NOT add "I don't know" to KNOWLEDGE questions. For "Do you know your deductible?", *I don't know* **is** No — a third option would be redundant and would muddy the data rather than enrich it.

**EVIDENCE (v1 scoring)** — the answer describes documentation the homeowner should possess. In v1 there is no upload path (§8.1), so these score **binary, self-attested**, with a third response option:
- `yes` → 1.0
- `not sure` → 0.0 (stored as a distinct answer value for analytics — see below)
- `no` → 0.0

"Not sure" belongs on EVIDENCE questions specifically because "Do you have photos of your roof?" has a genuinely different answer between *no* and *I'd have to check*. Both score 0 — unverified uncertainty earns nothing — but the distinction is stored, because a high "not sure" rate on a question signals homeowners who may have the documentation and simply need prompting, which is exactly the audience the gap list serves.

**Why v1 is not using the 0.25 multiplier.** The Documentation Score's checked-without-file multiplier (Decision #47 addendum) exists to distinguish a bare checkbox from a linked file. That distinction only carries information when linking a file is possible. With no upload path, the 0.25 cap becomes a flat penalty applied identically to every respondent — and it breaks the scale: a homeowner answering yes to all 24 questions would score approximately **49/100** ("Getting Started," the second-lowest band). A perfect respondent must be able to reach the top band, or the score is dishonest about what it measures. v1 therefore measures **self-attested readiness**, and the results page must say so plainly (§6).

**EVIDENCE (v2 scoring — when uploads ship).** Reintroduce the multiplier: `yes` without file → 0.25, `yes` with file → 1.0. That change re-anchors the scale, so v2 scores are **not comparable** to v1 scores. Every stored result must carry a `score_version` field from day one (v1 = `readiness-v1`), and v1 results must never be displayed alongside v2 results without labeling.

### 5.2 Category score

```
categoryScore = (sum of earned question values / count of questions in category) * 100
```

### 5.3 Total readiness score

```
readinessScore = round( Σ (categoryScore_i * categoryWeight_i) / 100 )
```

Weights sum to exactly 100: A=20, B=25, C=20, D=15, E=12, F=8.

### 5.4 Readiness bands

Text labels only. No letters, no colors implying pass/fail, no percentages framed as a grade.

| Score | Band |
|---|---|
| 0–24 | Not Started |
| 25–49 | Getting Started |
| 50–74 | Partially Documented |
| 75–89 | Well Documented |
| 90–100 | Thoroughly Documented |

Bands apply to `readiness-v1` scoring. When v2 scoring ships (§5.1), banding must be re-evaluated against the new scale — do not assume the same cut points remain honest.

### 5.5 Gap ranking

The results page surfaces the top 5 gaps, ranked by **points left on the table**:

```
gapValue = categoryWeight * (1 - earnedValue) / questionCountInCategory
```

This ranks a missing roof photo above a missing storage-closet photo, because Category B carries more weight — which is the correct advice to give.

---

## 6. Results page requirements

Must show:
- Readiness Score and Band
- Per-category breakdown
- Top 5 gaps as plain-language actions ("Take photos of your roof, or save an existing inspection report")
- A single primary CTA: create a free account to save the results
- **This disclaimer, verbatim, visible without scrolling past the score:** *"This assessment measures how complete your property documentation is. It does not predict claim approval, payment amount, or claim outcome."*
- A brief note that the score is based on the homeowner's own answers (v1 is self-attested; see §5.1)

Must **not** show:
- Any estimate of claim value, payout, or approval likelihood
- Any comparison to other users or properties
- Any letter grade
- Any reference to Property History Record, claim comparison, or other unbuilt features

---

## 7. Guardrails

These are non-negotiable and apply to every string in the feature:

1. **Never imply an insurance outcome.** The score measures documentation completeness. It says nothing about whether a claim will be paid, paid faster, or paid more. No "protect," "protected," "covered," "guaranteed," or "make sure your claim is approved."
2. **No public-adjuster framing.** No advice on what to claim, how to value a loss, or how to negotiate.
3. **Absolute contractor neutrality.** No recommendation logic, no referral surface, no directory — including in gap copy. "Get an inspection" is fine. "Find a contractor" that links anywhere is not.
4. **No ™ or ® on any mark** until trademark clearance is resolved.
5. **No AI in scoring.** This is deterministic. It must not consume a free-tier AI analysis, and it must not call the Anthropic API.
6. **Present-tense capability only.** Copy describes what the check does today, nothing on the roadmap.

---

## 8. Decisions — resolved and open

**8.1 Where do pre-claim files live? — RESOLVED: (a), no uploads in v1.** The storage model is built around claims (500MB per claim, 2GB per account, 25 active files per claim, `storage_used_bytes` tracked per claim), and a readiness check has no claim to attach to. Building a pre-claim container means a new data model, new RLS policies, and new storage accounting — a real security surface that is not justified before knowing whether anyone completes the assessment.

Consequence of this resolution: v1 EVIDENCE scoring is binary self-attested (§5.1), because the 0.25 no-file multiplier is meaningless when no file can be linked and would cap a perfect score at ~49.

The v2 path, if completion rates justify it, is **(b): a dedicated pre-claim container** with its own security model that converts into a claim's vault when the user files. Option (c) — requiring a claim record to upload — remains rejected: it misrepresents what the user is doing and pollutes the claims table.

**8.2 Does the check require an account? — RESOLVED: no.** The check runs fully anonymous — no sign-in, no account, no gate on taking it or seeing the result. An account is required only to *save* the result, behind a magic link — the same pattern as the grader-first onboarding flow that is already the established front door.

**8.3 What is the final name? — RESOLVED.** Decision #66 (Invariant), §2. Claude Code must log the entry in Decisions.md at build time.

**8.4 Does completing a readiness check affect free-tier limits? — RESOLVED: no.** It is deterministic, costs nothing per run, and must never consume a free-tier AI analysis. Charging against the 3-analysis budget would punish the exact behavior being encouraged.

**8.5 Weights — RESOLVED: versioned assumptions, not validated truths.** The category weights (A=20, B=25, C=20, D=15, E=12, F=8) are v1 design defaults with documented rationale but no production data behind them. They are part of the `readiness-v1` scoring version. Rebalancing later against anonymized completion and engagement data is expected — any rebalance is a new score version, never a silent change to an existing one.

---

## 9. Sequencing note

Nothing in this document should be built before the homeowner MVP ships. The pattern that kills pre-launch products is a good idea arriving before the last good idea shipped. This is the first thing after launch, not the thing that delays it.
