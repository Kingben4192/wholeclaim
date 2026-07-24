# Roadmap

## Pricing tiers

- **Free** — grader, workspace (Binder, Evidence Vault, Deadline Tracker, Claim Health Score), plus lightweight/educational tools with no or near-zero marginal AI cost.
- **Pro** — the higher-value analytical/drafting tools (real API cost, real time savings) — this is where the product earns revenue.

See "Pricing model reconciliation" below — this replaces an earlier, undecided "Gold tier" idea from mid-build; there are exactly two plans, matching what's actually implemented (`profiles.plan`).

## Phase 1 — Win the Homeowner (current focus)

The core product. Practical tools answering the biggest questions homeowners have during a claim.

**Claim Education**

- **Depreciation Calculator** — Free. Explains ACV vs. RCV, shows why the initial payment is lower than the estimate, estimates recoverable depreciation after repairs. Deterministic math + static educational copy (Decision #9 pattern) — no live AI call needed for the core function.
- **Should I Hire a Public Adjuster?** — Free. Interactive decision guide (claim size, complexity, denial status, user confidence). Presents tradeoffs, never a recommendation (Decision #25).
- **Mold Coverage Timeline** — Pro. Detects water-loss dates, warns when documentation/reporting deadlines may become important, encourages prompt mitigation — never a legal conclusion.
- **Supplement Assistant** — Pro. Explains what a supplement is, identifies gaps between carrier and contractor estimates, drafts a supplement request from the user's own evidence.
- **Loss-of-Use Tracker** — Pro. Logs hotels, meals, laundry, storage, mileage, pet boarding, other reimbursable expenses; generates a reimbursement summary.

## Phase 2 — Contractor Suite (natural expansion)

Leverages the same AI/document analysis already built for Phase 1.

- **Estimate Gap Analyzer Pro** — contractor estimate vs. carrier estimate; missing line items, pricing/scope differences.
- **Supplement Builder** — upload carrier estimate + contractor estimate + photos; generates an organized supplement request tied to the uploaded documentation.
- **Photo Documentation Assistant** — prompts contractors to capture what's typically needed (wide-angle overview, moisture readings, close-ups, demolition progress, drying equipment, completion) — helps completeness, never guarantees outcomes.
- **Estimate Quality Review** — pre-submission AI check for missing rooms/measurements, documentation gaps, scope inconsistencies.
- **Carrier Scope Comparison** — side-by-side carrier vs. contractor scope differences, for clearer conversations.

## Phase 3 — Professional Platform

Only after homeowner and contractor products are mature. Focus: standardized documentation intake, file completeness checks, workflow automation.

**Explicitly avoid: fraud-detection features.** Conflicts with the homeowner-advocate positioning and every existing product invariant (Decision #2, #25 — never predicts outcomes, never asserts conclusions as fact). This applies to any future insurer/adjuster-facing surface too.

## Long-term vision

WholeClaim evolves into a platform for every participant in the property claims process:

1. **Homeowner** — organize evidence, understand the claim, track deadlines, communicate effectively.
2. **Contractor** — prepare estimates, document work, manage supplements efficiently.
3. **Public Adjuster** (future) — collaborate with clients, review claim files, streamline documentation.
4. **Attorney** (future) — receive a well-organized, searchable claim package: timelines, communications, evidence.

## Property-Problem Category Expansion (Future Direction)

*Strategic exploration, not an approved build plan — added 2026-07-24. Any engineering work stays tracked through the active roadmap and implementation plans above, not this section.*

WholeClaim may eventually expand from an insurance-claim workspace into a broader property documentation system covering multiple homeowner problems. Potential future categories: Insurance Claim, Water / Utility Dispute, Contractor / Renovation Dispute, Property Damage Record, Other Property Issue.

The underlying opportunity: many homeowner problems share the same documentation challenges — organizing evidence, maintaining timelines, preserving records, communicating clearly with third parties.

**Current thinking.** Category awareness could let WholeClaim learn where homeowner demand exists and which property problems warrant dedicated workflows: category-specific templates, evidence checklists, documentation scoring, and educational resources — all driven by validated user behavior and market signals, not assumed up front. The only category-related engineering considered separately from a specific expansion decision is foundational architecture that keeps future expansion possible (e.g. schema-level category support, forward-compatible scoring interfaces) — not the categories themselves.

**Relationship to the persona-based roadmap above.** This category lens and the existing persona-based Phase 2/3 roadmap are two different views of the same future growth, not competing plans. Persona asks *who* uses WholeClaim (homeowners, contractors, property professionals, other stakeholders); category asks *what problem* they're solving (claims, disputes, documentation, property history). Future product decisions should weigh both together.

**Long-term opportunity: Documentation Intelligence.** A future advantage could come from understanding documentation patterns across property problems — never predicting outcomes, only helping users see what documentation is commonly needed, what records are missing, and how complete their property file is. Same guardrails as everywhere else in this product: never guarantees claim outcomes, never provides legal advice, never acts as a public adjuster, never recommends litigation strategies (matches Product Bible Never-list, Decisions #2/#25).

**Validation before expansion.** Before investing in any new category: user category selection, conversion rate by category, retention by category, most-requested workflows, most common missing documentation items. Expansion follows demonstrated demand, same standing principle as the rest of this roadmap.

## Bulk Upload & Auto-Grading (Future Direction)

*Strategic exploration, not an approved build plan — added 2026-07-24. Any engineering work stays tracked through the active roadmap and implementation plans above, not this section.*

**Concept.** Let a homeowner upload an existing pile of claim-related documents and have WholeClaim automatically organize, classify, and grade the completeness of the resulting file — solving "I already have the documents, they're scattered, and I don't know what's missing." This would move WholeClaim from a tool the user manually builds into one that turns an existing document pile into an organized property record.

**Why it's a new capability, not just another grading rubric.** Current workflows generally assume the user already knows what type of document they're uploading. This would require new AI capabilities not yet built: document classification, metadata extraction, date/event recognition, timeline generation, duplicate detection, evidence categorization, and missing-document analysis (e.g. `ClaimLetter.pdf` → insurance correspondence/denial letter, `MoistureReport.pdf` → inspection report).

**Potential workflow.** Upload a folder or group of files → WholeClaim analyzes and classifies them → key dates/events are extracted → a timeline is generated → the evidence file is organized → a Documentation Grade is calculated → the user receives a missing-document checklist (e.g. "Missing original loss timeline," "No proof of payment uploaded").

**Guardrails — same standing invariants as the rest of the product.** Evaluates organization, completeness, and documentation readiness only. Does not predict claim approval, determine legal rights, interpret coverage decisions as advice, or guarantee outcomes (matches Product Bible Never-list, Decisions #2/#25 — same guardrail language as the Documentation Intelligence idea above).

**Strategic case.** Reduces the largest onboarding barrier — users don't want to manually organize hundreds of documents before seeing value. "Upload the mess → WholeClaim creates the organized file."

**Dependencies.** A stable Evidence Vault, an AI document-processing pipeline, a file classification system, extraction workflows, testing across document types, and AI cost controls — none of which exist yet. Flagged as a high-priority post-launch candidate, contingent on MVP validation, not a current build target.

## Deprioritized / not in current scope

- **Insurance companies (B2B/adjuster-facing)** — faster intake, standardized completeness checks considered; fraud/inconsistency flagging explicitly avoided, same reasoning as Phase 3.
- **Auto insurance claims** — future expansion, contingent on property-claim traction first. Would need new prompt variants, a claim-type selector, and auto-specific Knowledge Library entries (liability, diminished value, total loss valuation, PIP/med-pay, subrogation).

## Pricing model reconciliation (resolved 2026-07-17)

Three different pricing shapes surfaced in one evening: the already-built call-count gate (free = 1 lifetime AI call across PD/GA/LC/LB/DA, pro = unlimited fair-use — Build Brief §4), an undecided "Gold tier" floated mid-build, and this roadmap's per-tool free/paid split. Reconciled to two tiers, matching what's actually implemented (`profiles.plan in ('free','pro')`, no schema change):

- The five existing tools keep their current gate exactly as built — unchanged.
- New tools tagged **Free** above are available to free-plan users, priced by their own nature (deterministic/static tools like the Depreciation Calculator carry no AI cost and no cap at all; any that do call AI get their own lightweight cap, decided per tool).
- New tools tagged **Pro** above require `plan = 'pro'` — no separate tier, no new column.

The "Gold tier" idea from earlier is retired — never built, never confirmed, superseded by this.

## Prior version (superseded)

v1.0 (beta): production web PWA — binder, vault, score, analyze, letters, decide, library, grader. Gate: Test Run 02 (G1–G6).
v1.1: PDF ingestion (policy/estimate upload), binder export to PDF exhibit package, evidence strengthener flags.
v2.0: native wrappers (Capacitor) + app-store listings.
v3.0: landlord multi-property workflows; contractor documentation module — now superseded by Phase 2 above.
