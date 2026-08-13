# Instrument Run 02 — Fulton County Office of the County Auditor — RAW RESULTS

**Run date:** 2026-08-13
**Instrument:** same field set, **still frozen** from Run 01. No field added, removed, renamed or reordered.
**Authorization:** research half of #117 (public records, no gate). Scope confirmed with the founder before execution. No jurisdiction contacted.

**Scope as approved, and as executed:**
- Source: `fultoncountyga.gov` → Office of the County Auditor → Audit Report listing. **That page only.**
- Retrieved: report titles, dates, PDF links from that listing.
- Then: full text of any report whose **title** indicates assets, equipment, inventory, property, fixed assets, or capital assets.
- **Not touched:** Fulton's ACFR, single audit, audit committee minutes, DOAA-collected filings, any other county.

> **Raw results. No conclusion drawn here about whether the instrument works.**

---

## Listing retrieved

**~150 internal audit reports spanning 2011–2026.** This is a different document class from Run 01: these are internal operational and performance audits, not external financial audits.

**Title filter applied to all ~150 titles. Two candidates:**

| # | Report | Year | Result |
|---|---|---|---|
| 1 | **Water Services Equipment Management Review** | 2015 | **Direct hit** — full text retrieved, entered below |
| 2 | Tax Assessors' Office Review of Commercial Properties | 2019 | **False positive** — retrieved and verified, excluded |

**False-positive verification (entry 2).** Matched the filter on "Properties." Full text retrieved (15 pp.) and keyword-scanned: `inventory` 0 · `equipment` 0 · `physical count` 0 · `custody` 0 · `fixed asset` 0 · `capital asset` 0 · `safeguard` 0. The report concerns commercial property **valuation for tax assessment**, not county-owned asset management. Excluded on evidence, not assumption.

**Titles considered and not pulled** (keyword-adjacent, judged out of scope): "Tax Assessors' Office – Follow-Up Review Audit" (2024, follow-up to the excluded report), "Hurricane Katrina Evacuee Assistance Commodity Code Audit Report" (2013), "Fulton County District Attorney Confiscated Funds Report" (2012). **Recorded so the exclusion is auditable.**

---

## Source for entries 11–13

**Fulton County, Georgia — Office of the County Auditor — Interoffice Memorandum**
**"Water Services Equipment Management Review," dated January 27, 2015.**
[PDF](https://www.fultoncountyga.gov/-/media/Departments/Office-of-the-County-Auditor/Audit-Reports-and-Management-Responses/2015-Audit-Reports/Water_Services_Equipment_Management_Review.pdf)

Context, verbatim: *"As a result of the theft that was reported on July 21, 2014, the County Auditor's Office conducted a review of the Water Services Division in the Department of Public Works and General Services. The review included determining compliance with the Standard Operating Procedures related to equipment management as well as evaluating controls that exist to prevent loss, theft, or misuse of equipment."*

---

## Entries 11–13

Continuing the numbering from Run 01.

### 11
| Field | Entry |
|---|---|
| Jurisdiction | Fulton County, GA |
| Audit year | 2015 (memo dated 2015-01-27; incident 2014-07-21) |
| Finding (as written) | "The equipment stolen during the theft included approximately 250 obsolete water meters that were surplus and were waiting to be properly disposed. The water meters were located in a warehouse that lacked the use of a security system and required minimal access control with only a key for entry. Furthermore, the area was not equipped with adequate surveillance or monitoring." |
| Asset / inventory issue | **YES** — surplus equipment awaiting disposal, held in unsecured warehouse, stolen |
| Root cause | **R4** custody and location failure. **R5 adjacency** — items were surplus awaiting disposal, i.e. in accountability limbo between in-service and disposed |
| Kit section that addresses it | Asset & Inventory Kit **§5 Location & Assignment**, **§6 Custody** (prototype **P2**, including the unissued-storage-secured field); **§12 Disposition & Disposal** for the awaiting-disposal state |
| PA / IA / neither | — *(FEMA lookup outside this run's approved scope; Break 3 persists)* |
| Designation as-of date | — |

### 12
| Field | Entry |
|---|---|
| Jurisdiction | Fulton County, GA |
| Audit year | 2015 |
| Finding (as written) | "Some equipment was located in open areas that are easily accessible to unauthorized individuals. This is a result of the Water Services Division preparing equipment to be relocated to a warehouse in the new Operations Center." |
| Asset / inventory issue | **YES** — equipment in open, unsecured areas during relocation |
| Root cause | **R4** custody and location failure |
| Kit section that addresses it | Asset & Inventory Kit **§5 Location & Assignment**; **§7 Transfer Record** for the in-relocation state |
| PA / IA / neither | — |
| Designation as-of date | — |

### 13
| Field | Entry |
|---|---|
| Jurisdiction | Fulton County, GA |
| Audit year | 2015 |
| Finding (as written) | "Annual inventory of equipment or physical count has not been performed for the current year which is also a result of the preparation for the relocation." |
| Asset / inventory issue | **YES** — required annual physical count not performed |
| Root cause | **R3** no periodic verification |
| Kit section that addresses it | Asset & Inventory Kit **§9 Inventory Review & Reconciliation** (prototype **P3**) |
| PA / IA / neither | — |
| Designation as-of date | — |

**Recommendation as written:** *"we encourage Water Services Division to strengthen controls related to properly safeguarding equipment and managing inventory. Water Services Division should ensure access to equipment is limited to authorized personnel. Additionally, an inventory of equipment should be conducted to verify the equipment amounts and location."*

---

## Raw tallies — Run 02

| Measure | Count |
|---|---|
| Reports in listing | ~150 (2011–2026) |
| Reports whose title matched the asset/equipment/inventory/property filter | 2 |
| Of those, confirmed relevant on full text | **1** |
| Confirmed false positives | 1 (verified by keyword scan, not assumed) |
| Findings entered | 3 |
| Findings mappable to root-cause codes R1–R5 | **3 of 3** |
| Findings mapping to a kit section | **3 of 3** |
| `PA / IA / neither` populated | 0 of 3 |
| Findings involving a **partial** physical inventory count scope | **0** |

### Combined, Runs 01 + 02

| Measure | Count |
|---|---|
| Findings entered total | 13 |
| Asset/inventory findings | 3 (all Fulton, all from one 2015 memo) |
| Mappable to R1–R5 | 3 of 13 |
| Jurisdictions sampled | 5 counties (DeKalb, Jasper, Fannin, Habersham, Fulton) + Dade retrieved without findings located |

---

## Instrument break log — Run 02

**Break 1 — status changed.** Run 01 recorded that the root-cause field had no valid value for any row. In Run 02 it had a valid value for **every** row (3 of 3). The variable is document class: external financial audits produced 0 of 10 mappable; the internal operational audit produced 3 of 3. **Break 1 is not resolved — it is now conditional on source type**, which the instrument does not record.

**Break 9 — NEW. The instrument has no field for document class.** Nothing distinguishes an external financial audit from an internal operational audit, yet that distinction predicted mappability perfectly across 13 entries. A finder cannot record it, and a reader of the table cannot see it.

**Break 2 — persists, unchanged.** No partial-scope physical count in this sample either. Fulton entry 13 is a count **not performed at all**, not a partial count. **P3's scope field remains untested against real data across both runs.**

**Break 3 — persists.** PA/IA still unpopulated, 0 of 3. FEMA lookup was outside this run's approved scope.

**Break 4 — persists.** The Fulton memo carries no severity classification at all — it is an interoffice memorandum, not a formal audit report with material-weakness/significant-deficiency labels. The instrument's implicit assumption that findings carry a severity grade does not hold for this document class.

**Break 5 — partially exercised.** The memo states a follow-up review was planned: *"The Office of the County Auditor will perform a follow-up review upon completion of the relocation."* The instrument has no field to record that a follow-up was promised, nor to link to it. Whether it occurred is unknown and untracked.

**Break 6 — persists and worsened.** Run 01 had structured CRITERIA/CONDITION fields to select from. This memo is continuous prose with bulleted observations. **I selected the bullet text as the finding.** That is a different extraction rule than the one I used in Run 01, applied to a different document class, and neither rule is written down. Two finders would diverge, and so would the same finder across document classes.

**Break 10 — NEW. One finding maps to multiple root causes and the field is singular.** Entry 11 is primarily R4 but is materially also R5 — the items were surplus awaiting disposal, which is the specific state where accountability is weakest. I recorded R5 as an "adjacency" in prose because **the frozen field set has no way to express a secondary root cause.** A finder without that latitude would have dropped the R5 signal entirely.

**Break 11 — NEW. Title-based filtering is the actual bottleneck, and it is lossy.** Only titles were filterable; full text of ~150 reports was not retrieved. An asset or inventory finding sitting inside a report titled, say, "Juvenile Court Audit" or "Airport Audit" would be invisible to this method. **The 1-of-150 rate is a floor, not a measurement.**

---

## Open issues carried

1. **Partial-count handling** — still undefined, still unexercised by real data after two runs (Break 2).
2. **Unresolved PA thesis** — unchanged. Both runs produced zero PA/IA data. Note the Fulton finding concerns *movable equipment*, not facility condition, so it does not bear on the PA thesis either.

---
---

# CORRECTION RECORD — appended 2026-08-13, per Decision #119

**Entry 11 was mis-coded by me. The entry above is left exactly as originally recorded; this correction is appended rather than applied, so the original coding and its error remain visible.**

**What I recorded:** root cause `R4` with an "R5 adjacency," on the reasoning that the meters were surplus awaiting disposal.

**What the source actually states:** *"approximately 250 obsolete water meters that were **surplus and were waiting to be properly disposed**."*

**Why that is not R5.** R5 is defined as *disposal record failure — item leaves without a closing record*. The Fulton memo does not state that any disposal record was missing, late, or defective. It states the meters were **waiting** to be disposed — a lifecycle state, and arguably a correct-if-slow process, not a failure.

**Corrected coding:** `R4` only. Under field set v2 the disposal-queue fact is captured as `Asset Lifecycle State = surplus awaiting disposal`, which is what the source supports.

**Classification of the error.** I coded from context rather than from evidence — precisely the one-step stretch recorded in Break 1 as the instrument's primary mis-entry risk. Break 1 was written as a risk to *a future finder*; it was realised by the author of the break log, one run later. That is worth more than the correction itself: the guard rail is needed even by someone who has just finished writing down why it is needed.

**Effect on Run 02 tallies:** none. Entry 11 remains one row with one code; only the code's justification changes. `Findings mappable to R1–R5: 3 of 3` stands.

**Effect on the dual-classification question:** entry 11 is **not** evidence for dual classification and should not be cited as such. The proof case is the MBPO finding (see `Instrument-Dual-Root-Cause-PROPOSAL.md` §2).
