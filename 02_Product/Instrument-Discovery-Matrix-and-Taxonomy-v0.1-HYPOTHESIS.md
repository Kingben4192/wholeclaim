# Discovery Matrix (Runs 01–04) and Taxonomy v0.1 — HYPOTHESIS

**Built:** 2026-08-13 from Runs 01–04.
**Status:** **v0.1 is a hypothesis, not a taxonomy.** Nothing here is adopted. R1–R5 remains the standing taxonomy until separately and explicitly changed (#120).
**Coverage:** 19 source findings → 20 rows. 5 counties. 27 documents opened.

---

## ⚠ Read this before any claim below is quoted

**The asset-relevant sample is 9 source findings, not 19.**

Ten of the 19 findings (Run 01, entries 1–10) come from external financial audits and contain **no asset, equipment, inventory, property or custody content whatsoever**. They are in the matrix because zero-yield must be recorded, not because they inform the taxonomy.

**Of the 9 asset-relevant source findings, all 9 come from one county — Fulton — and all from its internal audit office**, across four documents spanning 2015–2026.

Every recurrence figure below is therefore stated as `n = X rows / Y independent sources / Z counties`. **No claim in this document rests on more than 3 rows or more than 2 independent sources.** "Appeared twice" means appeared twice.

---

## 1. Discovery Matrix

### 1a. Rows 1–10 — Run 01, external financial audits (zero asset content)

Recorded for completeness. All ten share the same matrix values.

| Row | Parent Finding ID | County / Source | Actual failure | R1–R5 fit | Mismatch reason |
|---|---|---|---|---|---|
| 1 | DeKalb 2024-001 | DeKalb, FY2024 single audit | Internal controls insufficient to prevent material misstatement of intergovernmental receivables/revenues | **none** | Not an asset failure |
| 2 | DeKalb 2024-002 | DeKalb, FY2024 | Original budgets not adopted for two funds | **none** | Not an asset failure |
| 3 | Jasper 2023-001 | Jasper, FY2023 | Beginning fund balances did not reconcile to prior year | **none** | Not an asset failure |
| 4 | Jasper 2023-002 | Jasper, FY2023 | Expenditures not posted in proper fiscal period | **none** | Not an asset failure |
| 5 | Jasper 2023-003 | Jasper, FY2023 | Intergovernmental revenue understated | **none** | Not an asset failure |
| 6 | Jasper 2023-004 | Jasper, FY2023 | General Fund expenditures exceeded appropriations | **none** | Not an asset failure |
| 7 | Jasper 2023-005 | Jasper, FY2023 | SEFA not prepared per Uniform Guidance | **none** | Federal-scope but reporting, not inventory |
| 8 | Fannin 2023-001 | Fannin, FY2023 | Segregation of duties absent across cash functions | **none** | Not an asset failure |
| 9 | Fannin 2023-005 | Fannin, FY2023 | Deposits untimely — 38 of 40 receipts held >7 days | **none** | Not an asset failure |
| 10 | Habersham 2023-001 | Habersham, FY2023 | Segregation of duties absent in disbursement/void process | **none** | Not an asset failure |

**Lifecycle state / provisional category / repeat occurrence: not applicable to any of rows 1–10.**

### 1b. Rows 11–20 — the asset-relevant evidence

| Row | Parent Finding ID | County / Source | Evidence Span (abridged — full text in run files) | Actual failure | Asset Lifecycle State | Provisional Category | R1–R5 fit | Mismatch reason | Repeat occurrence |
|---|---|---|---|---|---|---|---|---|---|
| 11 | FUL-2015-WS | Fulton, 2015 Water Services Equipment Mgmt Review | "warehouse that lacked the use of a security system and required minimal access control with only a key for entry… not equipped with adequate surveillance" | ~250 surplus water meters stolen from unsecured storage | surplus awaiting disposal | **Physical safeguarding inadequate** | R4 (as applied) | **R4 is *defined* as a records failure; this is physical security** (Break 12) | Same pattern as rows 12, 16 |
| 12 | FUL-2015-WS | Fulton, 2015 (same source finding set) | "Some equipment was located in open areas that are easily accessible to unauthorized individuals." | Equipment unprotected during relocation | in transfer | **Physical safeguarding inadequate** | R4 (as applied) | Same as row 11 | Same source as row 11 — **not an independent occurrence** |
| 13 | FUL-2015-WS | Fulton, 2015 | "Annual inventory of equipment or physical count has not been performed for the current year" | Required periodic count not performed | in transfer | **Verification not performed** | **R3 — clean fit** | none | Same source as rows 11–12 |
| 14 | HHM-F6 | Fulton, 2026 Hammonds House Museum | "Available records and labeling did not clearly distinguish between pieces owned by Fulton County and those owned by the museum." | Ownership not determinable from records or labels | in storage / on display | **Identification insufficient** | **R2 — clean fit** | none | **n=1** — no other instance in the sample |
| 15 | HHM-F6 | Fulton, 2026 (same source finding, decomposed) | "HHM leadership… was unaware of any inventory listing." | No inventory record exists at all | in storage / on display | **Record does not exist** | **R1 — clean fit** | none | Same pattern as row 18 |
| 16 | HHM-F7 | Fulton, 2026 | "shelving arrangement does not prevent pieces from resting on or near the floor… the area lacks climate monitoring, and there was no evidence of temperature or humidity tracking" | Storage conditions inadequate to prevent deterioration | in storage | **Physical preservation / environmental** | **none** | No recordkeeping component at all (Break 13) | Partially overlaps rows 11–12 (physical), but preservation ≠ security |
| 17 | FTY-F3 | Fulton, 2025 Executive Airport | "we were informed that there was no hangar inspection policy" | No inspection regime for facility use/safety | in service | **Inspection regime absent** | none / R3-adjacent | R3 is inventory verification; this is facility inspection, different object (Break 13) | Adjacent to row 13, different object |
| 18 | FTY-F4 | Fulton, 2025 Airport | "the Airport had fifteen (15) tenants… only twelve (12) leases were provided" | Real-property document set incomplete (3 of 15) | in service | **Record does not exist / incomplete** | R1-analogous | R1 defined for equipment records; these are real-property lease documents | Same pattern as row 15, **different asset class** |
| 19 | FTY-C2 | Fulton, 2025 Airport | "may have converted approximately 340-355 acres… to nonaeronautical use, without requesting the required release of obligations… other information could not be located" | Federally-funded land status changed without required authorization; records not locatable | in service — status changed without authorisation | **Status change without required authorisation** | R5-analogous | R5 is equipment disposal; this is real-property release of obligations | Opposite direction to row 20 |
| 20 | JUV-F5 | Fulton, 2024 Juvenile Court | "checks were continuously carried over each month… had not been filed as unclaimed property with the Georgia Department of Revenue for proper escheatment… does not have a process to account for and write off" | Custodial property retained past statutory disposition deadline; no detection process | **held past required disposition** *(state not in v2 enumeration — Break 15)* | **Required disposition not performed** | R5 attempted | **Directionality inverted** — R5 is exit-without-record; this is failure-to-exit (Break 16). Also custodial financial property, not equipment | Opposite direction to row 19 |

### 1c. Independent-source correction

Rows 11, 12 and 13 all come from **one document and one incident** (the 2015 water meter theft review). Counting them as three occurrences would triple-count a single event.

**Independent asset-relevant sources: four.**
FUL-2015 Water Services · FTY-2025 Airport · HHM-2026 Museum · JUV-2024 Juvenile Court. All Fulton County.

---

## 2. Taxonomy v0.1 — HYPOTHESIS

Answering the four questions in order. **The answer is messy, and I have not tidied it.**

### Q1 — What repeats?

**Almost nothing, at this sample size.** Stated precisely:

| Pattern | Rows | Independent sources | Counties |
|---|---|---|---|
| Physical safeguarding inadequate | 3 (11, 12, 16) | **2** | 1 |
| Record does not exist / incomplete | 2 (15, 18) | **2** | 1 |
| Verification / inspection not performed | 2 (13, 17) | **2** | 1 |
| Disposition control failure (either direction) | 2 (19, 20) | **2** | 1 |
| Identification insufficient | 1 (14) | **1** | 1 |

**No pattern in this sample exceeds 2 independent sources, and every one is confined to a single county.** Nothing here establishes recurrence. The strongest honest statement is: *four patterns each appeared in two separate Fulton County documents.*

**Note on external evidence, deliberately kept out of the counts:** the verified NYC set (#116) shows record-absence, count-absence and unsecured-storage recurring across four agencies and two Comptroller administrations six years apart. That is genuinely stronger recurrence evidence — **but it is not in this matrix**, it was not gathered under the instrument, and mixing it in would silently inflate what the runs support.

### Q2 — What survives?

Judged only on evidence in the matrix, not on being already built.

| Code | Verdict | Basis |
|---|---|---|
| **R1** — origination failure | **Survives, weakly** | 2 clean-ish rows (15, 18), but 18 is real-property documents, not equipment. n=2 sources. |
| **R2** — incomplete identification | **Survives on n=1** | Row 14 only. One instance is not a category. Cannot be distinguished from a sub-case of R1 at this sample size. |
| **R3** — no periodic verification | **Survives, narrowly** | Row 13 is a clean fit. Row 17 is adjacent but a different object. n=1 clean. |
| **R4** — custody/location record failure | **Does NOT survive as defined** | **Zero rows support R4 as written.** Both rows coded R4 (11, 12) are physical-security failures, not record failures. The definition has no supporting evidence in this sample. |
| **R5** — disposal record failure | **Does NOT survive as defined** | **Zero clean instances.** Row 19 is real-property authorisation; row 20 inverts the direction. Both were coded "analogous" with flags. |

**Two of five codes have no supporting evidence in their defined form.** Per instruction, they are not preserved on the grounds of already existing.

### Q3 — What splits?

- **R4 splits.** Into *physical safeguarding* (rows 11, 12, 16 — evidenced here) and *custody-record failure* (**zero instances in the runs**; present in the NYC set but not here). The runs support only the first, which is not what R4 currently means.
- **R3 splits by object.** *Inventory verification* (row 13) vs *facility inspection regime* (row 17). Same shape — a required periodic check not happening — applied to different things, with different remedies.
- **R5 splits by direction.** *Status change without authorisation* (row 19) vs *required disposition not performed* (row 20). These are opposites. One is uncontrolled exit; the other is failure to exit.
- **R1 splits by asset class.** Equipment records (row 15) vs real-property documents (row 18).

### Q4 — What is genuinely separate?

- **Physical preservation / environmental conditions** (row 16, second clause — climate and humidity). This is **conservation, not accountability**. No record would prevent it. It does not belong in a documentation taxonomy, and its presence suggests the sampled population is broader than the instrument's domain.
- **Custodial property under statutory deadline** (row 20). Different legal regime, defined clock, holder is custodian not owner, failure is inaction. Structurally unlike anything else in the sample.
- **Facility inspection regime** (row 17). About use control and safety compliance, not asset accountability.

---

## 3. v0.1 hypothesis — proposed shape

**Not adopted. Every category carries its sample size inline.**

| Provisional | Description | Evidence |
|---|---|---|
| **A. Record absent or incomplete** | No record exists, or the record set is missing members | `n = 2 rows / 2 sources / 1 county` |
| **B. Identification insufficient** | Record exists but cannot identify or attribute the item | `n = 1 row / 1 source / 1 county` — **too thin to stand; may be a sub-case of A** |
| **C. Required check not performed** | A mandated periodic verification did not happen | `n = 2 rows / 2 sources / 1 county` — **splits by object (inventory vs facility)** |
| **D. Disposition control failure** | Status changed without required authorisation, **or** required disposition not performed | `n = 2 rows / 2 sources / 1 county` — **the two directions may be one category or two; the sample cannot tell** |
| **E. Physical safeguarding inadequate** | Item not physically protected from theft or unauthorised access | `n = 3 rows / 2 sources / 1 county` — **not a recordkeeping failure; may not belong in this taxonomy at all** |
| **UNPLACED. Physical preservation** | Environmental conditions inadequate | `n = 1 row / 1 source` — **conservation, not accountability** |

**What v0.1 deliberately does not do:** name these permanently, assign codes, claim completeness, or carry forward R4 and R5 in their current form.

---

## 4. What this matrix cannot support

Stated so nothing downstream overreaches:

1. **No prevalence claim.** 9 asset-relevant findings from 4 documents in 1 county is not a base rate for Georgia counties, let alone for government generally.
2. **No claim that external financial audits are a bad source** — only that these four produced no asset findings. Four counties is not a sample.
3. **No cross-county recurrence claim of any kind.** Every asset finding is Fulton.
4. **No claim about which categories are most common.** Separations of 1 versus 2 sources are noise at this size.
5. **Break 2 is still unexercised after four runs** — no partial-scope physical count anywhere, so the P3 field remains untested.
6. **The PA thesis is untouched.** No facility-condition or FEMA-PA finding appeared in any run.

**Running total: 19 source findings of 30. Eleven remain. The stopping rule has not been reached, and v0.1 should be treated as an interim reading of an incomplete sample.**
