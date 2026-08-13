# Government Facility Documentation Validation — Workstream v0.1

**Status:** Active workstream, logged per Decision #117.
**Subject:** the Government Property Documentation Kit — the Stage 2 validation lead named in Decision #111.
**Relationship to existing decisions:** this does not change Decision #99 or Decision #111. #99 was overridden for this line in #110 and is untouched. #111 established Stage 2 as Validate and named this kit as the lead; this workstream is the validation activity #111 already pointed to, given structure.

---

## 1. Purpose

To answer one question before ~674 pages are written across five kits:

> **Does the shared record architecture survive contact with a real government recordkeeper, and does it prevent the failures that actually appear in public audits?**

Two halves, deliberately. The first is a usability question — will anyone fill this in, follow the conventions, and sign it. The second is a *sufficiency* question — even if they fill it in perfectly, does the resulting record close the gaps auditors keep finding? A kit can be pleasant to use and still fail to prevent the thing it exists to prevent.

Most product validation only asks the first. The audit dataset lets this workstream ask the second, which is the more valuable one and the reason the two workstreams are paired rather than sequential.

**Explicitly not in scope:** whether anyone will buy it, at what price, through what procurement path. Those are Stage 3 questions and are gated.

---

## 2. Evidence base

Three sources, each doing a different job. Full detail and per-claim verification marks live in `Government-Kits-Audit-Dataset-Research-v0.1.md`; this section states what each source contributes.

**A. Statutory substrate — O.C.G.A. § 36-81-7 (verified).** Georgia local governments are audited on a recurring basis, reports go to the Department of Audits and Accounts within 180 days of fiscal year close, deficiencies have a defined mechanism, and reports are publicly inspectable. This is what makes the evidence base *systematic* rather than anecdotal — a standing, searchable, state-collected trail. Note the requirement is threshold-based, and covers municipalities as well as the 159 counties.

**B. Failure pattern — public audit findings.** The NYC Board of Elections audit (verified) is the anchor: 1,450+ items untracked, of which **1,176 were never properly tagged at all**. That ratio is the single most useful number in the evidence base, because it says the dominant failure is *record origination*, not theft or security. Three further NYC audits and the Montana and Santa Fe findings are reported but **unverified**, and the pattern claim — independent audits, years apart, same findings — does not stand until they are checked.

**C. Buyer segmentation — FEMA PA/IA designations (verified).** Public Assistance jurisdictions document damage to public facilities for federal reimbursement; that is this line's buyer. Individual Assistance-only jurisdictions are the existing consumer product's buyer. Mississippi DR-4922 shows the mismatch cleanly — Wilkinson County has IA without PA. Louisiana DR-4927 is Public Assistance Only, a pure institutional event. Designations amend after declaration, so this dimension is time-varying.

---

## 3. Audit-finding table — structure

The research instrument. Its job is not to catalogue findings but to convert them into product requirements, which is what the root-cause and kit-section fields do.

| Field | Purpose |
|---|---|
| **Jurisdiction** | County or municipality. Scope decision pending — see §5. |
| **Audit year** | Establishes independence and recurrence across time. |
| **Finding (as written)** | Verbatim from the audit. Not paraphrased — paraphrase is where evidence quietly becomes assertion. |
| **Asset / inventory issue** | The concrete recordkeeping defect. |
| **Root cause** | *The analytical field.* Which underlying failure produced the defect — see taxonomy below. |
| **Kit section that addresses it** | Maps the root cause to a specific section of a specific kit, or records that nothing addresses it. |
| **PA / IA / neither** | Buyer segment. |
| **Designation as-of date** | Because PA/IA changes after declaration; a boolean would go stale silently. |

### FIELD SET v2 — effective Run 03 (Decision #119)

> **🔒 Frozen at v2 for Run 03.** Runs 01 and 02 were executed under v1 and stand as recorded, unedited. v2 is **not** applied retroactively.

**Governing invariant:**

> **One row = one failure = one root-cause code = one quoted evidence span.**

A source finding containing several separately-stated failures is **decomposed into several rows**, not given several codes. Multi-value root-cause fields are rejected — a weak second code reads as thoroughness, which makes coding stretch easier to smuggle past review rather than harder.

**Three fields added to the v1 set:**

| New field | Purpose |
|---|---|
| **Parent Finding ID** | Links decomposed rows back to the single source finding they came from. Preserves the audit trail from row to document. |
| **Evidence Span** | The verbatim clause justifying *this row's* code. **No span, no code** — this is the load-bearing guard, converting coding from judgment into citation. |
| **Asset Lifecycle State** | in service / in transfer / in storage / surplus awaiting disposal / disposed / unknown. Records the state that made a failure consequential, **without** miscasting it as a second failure. |

**Guard rails, mandatory:**

1. **No span, no code.**
2. **Conservative decomposition.** Split only where the source states separate failures in separate clauses. Never split on inference. If unsure whether text describes one failure or two, record **one** row and flag it.
3. **Lifecycle state never substitutes for a root cause.** A row carrying only a state is not coded at all.

**Counting, per #119:** the **30-finding stopping rule counts source findings.** Failure-rows are tracked and reported as a separate number. Counting rows would reach the stop 2–3× sooner on materially less jurisdictional diversity — the MBPO finding alone yields four rows.

**Why this field exists — worked example.** Run 02 entry 11 was coded `R4` plus an "R5 adjacency" because the stolen meters were surplus awaiting disposal. R5 means *item leaves without a closing record*; the source states only that the meters were **waiting** to be disposed. That is a state, not a failure. Corrected coding is `R4` + `Asset Lifecycle State = surplus awaiting disposal`. The mis-code was made by the same person who had written Break 1 warning against exactly that stretch, one run earlier.

### Root-cause taxonomy (initial, expected to grow from the data)

| Code | Root cause | Evidence anchor |
|---|---|---|
| **R1** | **Origination failure** — the record was never created. Item never tagged, never entered. | 1,176 of 1,450 NYC items |
| **R2** | **Incomplete identification** — record exists but lacks the fields needed to identify the item. | Missing serial numbers |
| **R3** | **No periodic verification** — record exists but is never checked against reality. | No periodic counts |
| **R4** | **Custody and location failure** — no record of who holds it or where. | No secured storage |
| **R5** | **Disposal record failure** — item leaves without a closing record. | Montana federally-funded equipment *(unverified)* |

**Why the root-cause field carries the workstream.** A finding says *what went wrong*. A root cause says *what would have prevented it*. Only the second can be checked against a kit section. Without this field the table is a list of bad news; with it, the table is a requirements document — and it exposes the two failure modes that matter most: a root cause with **no** kit section addressing it (a product gap), and a kit section with **no** root cause behind it (a section we are asking users to fill in for no evidenced reason).

That second one is the check nobody runs, and this kit line has ~674 pages of surface area on which to be wrong.

---

## 4. The evidence loop

The pairing with the prototype (#115, #116), stated as an actual cycle rather than an intention.

```
   Audit findings ──► Root cause ──► Kit section that should prevent it
         ▲                                        │
         │                                        ▼
   Refine what to                        Prototype tests whether
   look for next                         a real user completes
         │                               that section correctly
         │                                        │
         └────────── Gap analysis ◄───────────────┘
              (unaddressed causes; unevidenced sections)
```

**Left to right:** research produces root-caused findings, each mapped to the kit section meant to prevent it.

**Right side:** the prototype puts that section in front of a real recordkeeper and asks whether they complete it correctly and willingly — not whether they like it.

**Return path:** two gap types feed back. Root causes with no addressing section are product gaps. Sections users skip, misuse, or leave blank are *sufficiency failures* — the section exists but does not actually prevent the root cause, which is worse than a missing section because it looks like coverage.

**What each side owes the other, concretely:**

- Research → prototype: which of the prototype's sections have real evidence behind them, and which do not. Currently the prototype's §9 Emergency and §13 Certification have **no** audit-finding support at all; §4/§5 register-to-detail has strong support via R1 and R3.
- Prototype → research: which root causes are worth pursuing county by county. If a real user cannot maintain a register at all, R3 verification frequency becomes a secondary question and the table's emphasis shifts.

**One tension carried forward openly** (#116): the audit evidence maps most directly onto the **Asset & Inventory Kit's** accountability spine, not the Property Documentation Kit being prototyped. The loop is expected to surface whether the Stage 2 lead should hold. That is a legitimate output of this workstream, not a flaw in it.

---

## 5. Open items

1. **Scope — counties only, or counties plus municipalities.** The statute covers both. Municipalities are where the below-threshold biennial and agreed-upon-procedures cases sit, which may be where recordkeeping is worst and where the kit's value is highest.
2. ~~Verify the three 2022 NYC audits before the county table.~~ **DONE 2026-08-13.** All four NYC audits verified; Public Advocate corrected from 2022 to 2016. Recurrence now established across two Comptroller administrations six years apart. **New finding from the verification:** in both 2022 audits the agencies were *generally able to account for* their equipment despite the control failures — so the evidenced problem is inability to demonstrate control, not demonstrated loss. Positioning must follow the evidence on this.
3. **The root-cause taxonomy is seeded from one verified audit.** R1–R5 should be treated as provisional and allowed to change as real findings accumulate, not defended.
4. **Prototype §9 and §13 have no evidence behind them.** Either the evidence base is incomplete, or those sections are there on intuition. Worth resolving deliberately rather than assuming the former.

---

## 6. Execution gate — flagged, not resolved

**This workstream is a design, not a licence to run it.**

Validating with *real government recordkeepers* requires contacting government personnel. The outreach gate held continuously since Decision #110 — no government marketing, outreach, selling, pilot quoting, or contact with any named jurisdiction — has not been lifted and is not lifted here. **The research half (public audit records, published FEMA designations) runs entirely on public documents and needs no gate. The validation half cannot begin without one.**

Options, none chosen: validate with a non-government proxy recordkeeper first; scope a narrow contact authorization limited to validation with no commercial content; or complete the research half and defer validation until the outreach question is decided on its own merits.

Flagging this now because it is the kind of collision that otherwise surfaces halfway through execution, after effort is committed.
