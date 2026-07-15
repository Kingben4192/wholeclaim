# WholeClaim — Product Bible

One purpose sentence per feature, plus the invariants that keep engineers, marketers, and future AI assistants from accidentally changing what the product *is*. If a proposed change violates a **Never**, the change is wrong — not the Bible.

## Product-wide invariants

- **Never** contacts a carrier, negotiates, adjusts, predicts outcomes, or gives legal advice.
- **Never** puts claim contents, letters, or AI outputs into analytics or logs.
- **Always** keeps the user in control: every AI output is reviewed by the user before use.
- **Always** carries the disclaimer on advice-adjacent surfaces: *"WholeClaim is a self-help documentation tool, not legal or insurance advice."*
- **Always** ships changes to AI behavior through the Test Run gate (G1–G6).

## Features

**Claim Health Score** — Purpose: help users know the condition of their documentation.
Never predicts claim outcomes. Never estimates settlement values. Always explainable (every component visible with points and maximum). Always deterministic (identical inputs → identical score, unit-tested).

**Next Recommended Action** — Purpose: every login tells the user exactly one thing to do next.
Never shows more than one action. Always ordered by the fixed rule priority (deadlines → evidence → freshness → library → analysis).

**The Binder (Log)** — Purpose: a 30-second habit that turns memory into record.
Never auto-generates entries the user didn't make. Always timestamps and types every entry.

**Evidence Vault** — Purpose: nothing important lives only in a camera roll.
Never exposes files without signed, user-scoped access. Always preserves original filenames and capture timestamps.

**Timeline** — Purpose: the claim as a chronology, because insurance claims are timelines.
Always renders from real entries; never invents interpolated events.

**Deadline Tracker** — Purpose: no legitimate claim dies to a missed date.
Never presents a computed date as policy-authoritative — quick-adds always carry "verify in policy." Always escalates color by urgency (red means due, nothing else).

**Policy Decoder** — Purpose: make the user's own policy understandable.
Never asserts coverage conclusions as fact. Always points to the exact section to verify.

**Estimate Gap Analyzer** — Purpose: contractor-grade scrutiny of the carrier's scope.
Never fabricates prices; uses library benchmarks or says how to get real numbers. Always ends with documentation steps, not arguments.

**Loss-Count Auditor** — Purpose: verify how losses were counted, because the count drives non-renewals.
Never accuses; always frames as records to request and questions to put in writing.

**Letter Builder** — Purpose: professional drafts from the user's own file, for the user's own review.
Never sends anything. Never asserts legal conclusions as fact. Always closes with the self-help preparation line and shows the active-litigation counsel notice.

**Decide (Sign-or-Fight)** — Purpose: a framework for the release decision, applied by the user.
Never a directive. Always explains what a release permanently ends.

**Knowledge Library** — Purpose: analysis grounded in facts the owner verified.
Never activates an entry without explicit owner approval. Never lets AI-drafted entries influence analysis while in draft. Always stamps a verification date and prefers library entries over model memory, with a final-verification instruction.

**Claim Grade (public)** — Purpose: a two-minute mirror that shows a stranger their file the way a carrier sees it.
Never scores client-side. Never emails without consent. Always deterministic on the grade; AI writes only the narrative.

**Account & Billing** — Purpose: the data belongs to the user, provably.
Always self-serve export (JSON + files) and deletion. Never a support ticket required to leave.
