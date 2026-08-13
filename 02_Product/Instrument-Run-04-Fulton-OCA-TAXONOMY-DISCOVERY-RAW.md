# Instrument Run 04 — Fulton County OCA, Taxonomy-Discovery Mode — RAW RESULTS

**Run date:** 2026-08-13
**Mode:** taxonomy-discovery (Decision #120). **Evidence-gathering against the existing taxonomy — NOT a taxonomy change.** R1–R5 remains the standing taxonomy.
**Field set:** **v3**, frozen at the run boundary. Coding step only: `Observed Failure` · `Evidence Span` · `Asset Lifecycle State` · `Provisional Category` · `Legacy R1–R5 Attempt` · `Mismatch Flag`.
**Hard constraint honoured:** no new permanent categories designed or named during this run. Provisional categories below are descriptive observations only.
**Sampling:** unchanged — Fulton OCA listing, year-bucket descending then listing position, continuing at **position 11**.
**Guard rails:** unchanged — one row = one failure = one evidence span; conservative decomposition; zero-yield documents recorded as zero; 30-source-finding stop.

> **Raw results. Instrument verdict still withheld. No taxonomy proposed.**

---

## Status against the 30-finding stop

**Entering Run 04: 18 source findings. Run 04 added 1. Total now 19.**

**Finding 30 was not reached in this run** — 11 short. Nothing was truncated.

---

## The 10 documents opened (positions 11–20)

| # | Document | Year | Result |
|---|---|---|---|
| E11 | Water Billing Audit | 2025 | opened, no qualifying finding |
| E12 | Travel and Training Audit | 2024 | opened, no qualifying finding |
| E13 | **Juvenile Court Audit** | 2024 | **qualifying — 1 finding** |
| E14 | HOME Program Audit | 2024 | opened, no qualifying finding |
| E15 | Registration & Elections — Absentee Voting Review | 2024 | opened, **1 discovery observation, not counted** |
| E16 | Purchase Card Program Audit | 2024 | opened, no qualifying finding |
| E17 | Tax Assessors' Office Follow-Up Review | 2024 | opened, no qualifying finding |
| E18 | Magistrate Court Audit | 2024 | opened, no qualifying finding |
| E19 | GSICA Audit | 2024 | opened, no qualifying finding |
| E20 | Grady Memorial MOU 2023 Compliance | 2024 | opened, **zero keyword hits** |

Position 11 was **Water Billing Audit** — the document Run 03's rule excluded at position 11 and which was flagged then as plausibly relevant. It was opened here and did **not** qualify (see below). The Run 03 flag is now resolved.

### Exclusion reasons — documents with keyword hits but no qualifying finding

- **E11 Water Billing** — Finding 2 *Untimely Water Meter Readings*: readings ran 40–95 days against 30/60-day targets because "the third-party meter reading company was not performing timely readings." This is a **billing-service timeliness** failure affecting revenue and leak detection, not meter asset accountability. Excluded.
- **E12 Travel and Training** — six findings, all documentation/per-diem/signature. Excluded.
- **E14 HOME Program** — untimely drawdown, insufficient staffing. Excluded.
- **E16 Purchase Card** — P-card control and reconciliation findings. Excluded.
- **E17 Tax Assessors Follow-Up** — confirmed as the follow-up to the July 17 2019 report already excluded in Run 02. Subject is **fair market valuation of real and personal property for property tax purposes**, not county asset accountability. Excluded on the same basis as Run 02, for consistency.
- **E18 Magistrate Court** — "property" appears as case types (Personal Property Foreclosure, Abandoned Motor Vehicle); "storage" refers to a storage room repurposed for weddings. No county asset accountability. Excluded.
- **E19 GSICA** — E-Verify compliance. Excluded.

---

## Entry 20 — the one qualifying finding

**Source:** Juvenile Court Audit, Fulton County OCA, 2024. [PDF](https://www.fultoncountyga.gov/-/media/Departments/Office-of-the-County-Auditor/Audit-Reports-and-Management-Responses/2024-Audit-Reports/Juvenile-Court-Audit-F.pdf)
**Parent Finding ID:** JUV-F5 — *Failure to Comply with State Regulated Escheatment Process*

| Field | Entry |
|---|---|
| **Observed Failure** | Property held on behalf of others was retained past its statutory dormancy period without the required remittance to the state, and no process existed to detect or act on it. |
| **Evidence Span** | "These checks were continuously carried over each month on the bank reconciliations and had not been filed as unclaimed property with the Georgia Department of Revenue for proper escheatment. We noted that the Juvenile Court does not have a process to account for and write off uncashed or outstanding checks." |
| **Asset Lifecycle State** | **held past required disposition** — *see Break 15: this value does not exist in the v2 enumeration* |
| **Provisional Category** *(what the evidence suggests, not what fits a code)* | Custodial property with a **statutory disposition deadline**, retained past that deadline because no detection process exists. Distinguishing features: the holder is a custodian, not an owner; the disposition obligation is legally mandated with a defined clock (5-year dormancy); the failure is *inaction*, not mishandling. |
| **Legacy R1–R5 Attempt** | **R5** — disposal record failure. Nearest available fit. |
| **Mismatch Flag** | **YES — two independent mismatches.** (1) **Directionality.** R5 describes an item that *leaves without a closing record*. This is the inverse: the item **fails to leave when legally required to**. R5 assumes uncontrolled exit; this is failure-to-exit. (2) **Asset class.** R5 is defined for equipment disposal; this is custodial financial property under a statutory regime. |
| Jurisdiction / Audit year | Fulton County, GA / 2024 |
| Amount at issue | $1,571 in checks issued 2017–2018, uncashed as of 2023 |
| Kit section | **None.** No kit in the current set addresses custodial property with a statutory disposition clock. |

---

## Discovery observation — recorded, explicitly NOT counted toward the 30

**Source:** Registration & Elections, Review of Absentee Voting Process, 2024 (E15).

**What was observed:** a mature custody regime for controlled non-asset items — seal manifests, sealed retention cages, a two-courier transport rule, and count-to-manifest reconciliation. One deficiency was stated: *"We were unable to verify the consistency of steps performed, given the absence of written procedures,"* covering the sealing and transport custody transfer. Separately, a physical count initially disagreed with the manifest total of 814 ballots and was resolved by recount — **the control worked**, which is why it is not recorded as a failure.

**Why this is not counted as a qualifying source finding:** ballots are controlled electoral instruments, not property or assets. The custody regime is structurally analogous — arguably more rigorous than anything in the equipment findings — but the asset class sits outside the instrument's domain. Counting it would inflate the denominator with a contested inclusion.

**Why it is recorded anyway:** discovery mode exists to capture what the source material actually contains. This is a fully-developed custody-and-reconciliation regime operating in a Georgia county, and it is evidence about what "good" looks like even though it is not evidence of failure. Recorded per guard rail — unsure, so recorded and flagged — with the count held clean by excluding it.

---

## Raw tallies — Run 04

| Measure | Count |
|---|---|
| Documents opened | **10** |
| Documents with zero keyword hits | 1 (E20) |
| Documents with hits but no qualifying finding | 8 |
| Documents with qualifying findings | **1** (E13) |
| **Qualifying source findings** | **1** |
| **Failure-rows produced** | **1** |
| Discovery observations recorded, not counted | 1 (E15) |
| Rows with **Mismatch Flag = YES** | **1 of 1** |
| Rows involving a partial physical inventory count | **0** |

### Running totals

| Measure | Value |
|---|---|
| **Source findings toward the 30** | **19** (Run 01: 10 · Run 02: 3 · Run 03: 5 · Run 04: 1) |
| **Failure-rows, tracked separately** | 20 |
| Documents opened, cumulative | 27 |
| Blind-sample yield (Runs 03–04) | **3 of 20 documents** produced qualifying findings |

---

## Break log — Run 04

**Break 15 — NEW. The `Asset Lifecycle State` enumeration is incomplete.** Entry 20's state is *held past required disposition*. The v2 enumeration offers in service / in transfer / in storage / surplus awaiting disposal / disposed / unknown. "Surplus awaiting disposal" is nearest and **wrong** — the property is not surplus, and the disposal is not discretionary but legally mandated with a clock. A finder without latitude would have coded it "surplus awaiting disposal" and destroyed the distinction. Recorded, not fixed.

**Break 16 — NEW. R5 encodes a directional assumption that the evidence contradicts.** R1–R5 assumes assets are lost *through* uncontrolled exit — never tagged, never counted, walked out, disposed without record. Entry 20 is the opposite failure: property that **should have left and did not**. Both are accountability failures with real consequences; the taxonomy only represents one direction.

**Break 13 — reinforced.** Run 03 surfaced three asset classes outside the movable-equipment taxonomy. Run 04 adds a fourth: **custodial property held on behalf of others under statutory obligation**. That is now four classes from two runs.

**Break 17 — NEW. Yield varies sharply by year bucket, and the sampling rule cannot see it.** Run 03 (2026 + early 2025) yielded 2 qualifying documents of 10; Run 04 (late 2025 + 2024) yielded 1 of 10. The 2024 bucket is dominated by financial-compliance audits — travel, purchase card, GSICA, MOU compliance. The sampling rule is position-based and has no way to weight toward document types that historically yield. **This is not an argument to change the rule mid-stream**; it is a recorded property of the sample.

**Break 2 — persists across four runs.** Still no partial-scope physical inventory count anywhere. **P3's scope field remains untested against real data.**

**Break 3 — persists.** PA/IA unpopulated.

**Break 14 — recurs.** Entry 20 has no addressing kit section, and `Kit section` still has no null-with-reason value. This is the second recorded product gap that can only be expressed in prose.

---

## Open issues carried

1. **Partial-count handling** — undefined, unexercised across four runs.
2. **Unresolved PA thesis** — unchanged. Run 04 produced no facility-condition or PA-relevant finding.
3. **Provisional categories accumulated so far** — held for post-collection analysis, deliberately unnamed and unconsolidated per #120: physical preservation / storage conditions · facility inspection regime · real-property documents and disposition authorization · custodial property with statutory disposition deadline. **Four provisional observations across Runs 03–04. Not a taxonomy. Not to be treated as one until all findings are collected.**
