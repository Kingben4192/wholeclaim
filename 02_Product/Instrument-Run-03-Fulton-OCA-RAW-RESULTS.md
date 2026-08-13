# Instrument Run 03 — Fulton County OCA, Blind 10-Document Sample — RAW RESULTS

**Run date:** 2026-08-13
**Field set:** **v2** (Decision #119) — first run using `Parent Finding ID`, `Evidence Span`, `Asset Lifecycle State` and the decomposition rule. Frozen at v2 before the run; unchanged during it.
**Invariant applied:** one row = one failure = one root-cause code = one quoted evidence span.
**Authorization:** research half of #117. No jurisdiction contacted.

**Selection rule, confirmed before any document was opened:**
Population = Fulton OCA listing retrieved in Run 02 (~150 reports, 2011–2026). Sort = **year bucket descending, then listing position within bucket** — an approved deterministic *proxy* for date order, since the listing carries year groupings, not dates. Exclude the 2 documents opened in Run 02 (both 2015/2019 — a no-op at this position). Take the next 10. **Open all 10 in full regardless of title.** Zero-yield documents recorded as zero, not omitted.

> **Raw results. Instrument verdict still withheld.**

---

## The 10 documents opened

| # | Document | Year | Result |
|---|---|---|---|
| D1 | Registration & Elections — Absentee Voting Process | 2026 | opened, no qualifying finding |
| D2 | HOME Program Audit | 2026 | opened, **zero keyword hits** |
| D3 | **Hammonds House Museum Audit** | 2026 | **qualifying — 2 findings** |
| D4 | Travel and Training Audit | 2025 | opened, **zero keyword hits** |
| D5 | Fuel Card Follow-Up Audit | 2025 | opened, no qualifying finding |
| D6 | Passport Audit | 2025 | opened, no qualifying finding |
| D7 | **Fulton County Executive Airport Audit** | 2025 | **qualifying — 3 findings** |
| D8 | GSICA Audit | 2025 | opened, **zero keyword hits** |
| D9 | Purchase Card Audit | 2025 | opened, no qualifying finding |
| D10 | Treasury Gift Card Audit | 2025 | opened, no qualifying finding |

**Rule consequence recorded:** the 2025 bucket's 8th entry — **Water Billing Audit** — falls at position 11 and was therefore *not* opened. Its title is plausibly relevant. This is a direct consequence of the approved rule and is recorded rather than quietly overridden.

### Non-qualifying documents with keyword hits — exclusion reasons

- **D1 Registration & Elections** — "custody" ×2 refers to **ballot chain of custody**, not asset custody. Excluded. *(Aside: this is a real, functioning chain-of-custody process in a Georgia county — tangentially relevant to the chain-of-custody question raised against the Incident & Loss kit, but not an asset finding.)*
- **D5 Fuel Card** — "custody of assets" appears inside a **prior-year recommendation** on segregation of duties, not a current finding. Excluded.
- **D6 Passport** — "safeguards court records" is background description. Excluded.
- **D9 Purchase Card** — "equipment" appears in a purchasing-threshold context (Finding 4, Unauthorized Purchases). Not asset accountability. Excluded.
- **D10 Treasury Gift Card** — gift-card inventory is a **cash equivalent**, and the finding concerns SOPs not reflecting current operations. Excluded as procedure documentation, not asset recordkeeping. *Borderline; recorded so the call is auditable.*
- **D7 Finding 7 "Inadequate Record Keeping"** — concerns **fuel flowage fee** documentation, i.e. financial records. Excluded from the qualifying set despite the title.

---

## Qualifying entries 14–19 (6 failure-rows from 5 source findings)

### Source A — Hammonds House Museum Audit, Fulton County OCA, 2026. Audit scope 2025-01-01 to 2025-12-31.
[PDF](https://www.fultoncountyga.gov/-/media/Departments/Office-of-the-County-Auditor/Audit-Reports-and-Management-Responses/2026-Audit-Reports/Hammonds-House-Museum-Audit-Report-F.pdf) · 7 findings total, 2 qualifying. Auditors sampled **186 pieces** of art including paintings, sculptures and furniture.

#### Entry 14
| Field | Entry |
|---|---|
| Jurisdiction | Fulton County, GA |
| Audit year | 2026 |
| **Parent Finding ID** | HHM-F6 (*Lack of Ownership Identification for Art Inventory*) |
| **Evidence Span** | "Available records and labeling did not clearly distinguish between pieces owned by Fulton County and those owned by the museum." |
| Asset / inventory issue | YES — ownership not determinable from records or labels |
| Root cause | **R2** incomplete identification |
| **Asset Lifecycle State** | in storage / on display (mixed) |
| Kit section | Asset & Inventory Kit §2 Register (ownership + identification fields); prototype **P1** |
| PA / IA / neither | — *(FEMA lookup outside run scope)* |

#### Entry 15
| Field | Entry |
|---|---|
| Jurisdiction | Fulton County, GA |
| Audit year | 2026 |
| **Parent Finding ID** | HHM-F6 (same source finding as entry 14) |
| **Evidence Span** | "HHM leadership expressed concerns with the management of the artwork and was unaware of any inventory listing." |
| Asset / inventory issue | YES — no inventory listing known to exist |
| Root cause | **R1** origination failure |
| **Asset Lifecycle State** | in storage / on display (mixed) |
| Kit section | Asset & Inventory Kit §2 Register; prototype **P1** |
| PA / IA / neither | — |

> **Decomposition note.** HHM-F6 also contains the clause *"an inventory control framework had not been established."* Under guard rail 2 (conservative decomposition) this was **not** split into a third row — it restates the absence recorded in entry 15 rather than stating a distinct failure. **R3 was specifically NOT coded**: R3 requires a record that exists but is never verified; where no record exists, R3 cannot apply. The recommendation text mentions periodic verification, but recommendations are not findings and were not coded from.

#### Entry 16
| Field | Entry |
|---|---|
| Jurisdiction | Fulton County, GA |
| Audit year | 2026 |
| **Parent Finding ID** | HHM-F7 (*Inadequate Art Storage*) |
| **Evidence Span** | "art pieces, not on public display, are stored in a closet using shelving units referred to as 'bins'. This shelving arrangement does not prevent pieces from resting on or near the floor… Additionally, the area lacks climate monitoring, and there was no evidence of temperature or humidity tracking." |
| Asset / inventory issue | YES — inadequate physical safeguarding of County-funded assets |
| Root cause | **UNMAPPABLE under R1–R5 as defined — see Break 12** |
| **Asset Lifecycle State** | in storage |
| Kit section | **None in the current kit set.** Nearest is Property Documentation Kit §3/§5 condition recording, which records condition but does not address storage adequacy |
| PA / IA / neither | — |

### Source B — Fulton County Executive Airport Audit, Fulton County OCA, 2025.
[PDF](https://www.fultoncountyga.gov/-/media/Departments/Office-of-the-County-Auditor/Audit-Reports-and-Management-Responses/2025-Audit-Reports/Fulton-County-Executive-Airport-Audit-F.pdf) · 8 findings + 4 concerns; 3 qualifying. **This is a facility audit, not an equipment audit.**

#### Entry 17
| Field | Entry |
|---|---|
| Jurisdiction | Fulton County, GA |
| Audit year | 2025 |
| **Parent Finding ID** | FTY-F3 (*Lack of Hanger Inspection Policy*) |
| **Evidence Span** | "During the audit, we were informed that there was no hangar inspection policy." |
| Asset / inventory issue | YES — facility class: no inspection regime for airport facilities |
| Root cause | **UNMAPPABLE under R1–R5 — facility inspection, not equipment recordkeeping (Break 13)** |
| **Asset Lifecycle State** | in service |
| Kit section | Maintenance & Inspection Kit §8 Facility Inspection Record; Property Documentation Kit §7 |
| PA / IA / neither | — |

#### Entry 18
| Field | Entry |
|---|---|
| Jurisdiction | Fulton County, GA |
| Audit year | 2025 |
| **Parent Finding ID** | FTY-F4 (*Current Tenant Lease Agreements Not on File*) |
| **Evidence Span** | "the Airport had fifteen (15) tenants leasing directly with the County in 2023. A review of lease records revealed that only twelve (12) leases were provided." |
| Asset / inventory issue | YES — real-property document set incomplete (3 of 15 missing) |
| Root cause | **R1-analogous** (record not created or not retained) — **flagged: R1 is defined for equipment records, not real-property documents (Break 13)** |
| **Asset Lifecycle State** | in service |
| Kit section | Property Documentation Kit §12 Supporting Documentation Index; §2 ownership/tenure fields |
| PA / IA / neither | — |

#### Entry 19
| Field | Entry |
|---|---|
| Jurisdiction | Fulton County, GA |
| Audit year | 2025 |
| **Parent Finding ID** | FTY-C2 (*Failure to Resolve FAA Inquiry Regarding Nonaeronautical Use of Airport Property Timely*) |
| **Evidence Span** | "the County may have converted approximately 340-355 acres of the FTY aeronautical land, which was purchased with Airport Improvement Program (AIP) funds, to nonaeronautical use, without requesting the required release of obligations from the FAA… While some information was provided by the department, other information could not be located." |
| Asset / inventory issue | YES — federally-funded real property, use converted without required release; supporting documentation not locatable |
| Root cause | **R5-analogous** (asset changes status without the required closing authorization/record) — **flagged: R5 is defined for equipment disposal, not real-property release of obligations (Break 13)** |
| **Asset Lifecycle State** | in service — status change unauthorised |
| Kit section | Property Documentation Kit §2 (ownership/tenure), §10 Property Change Record, §12 Supporting Documentation Index |
| PA / IA / neither | — |

---

## Raw tallies — Run 03

| Measure | Count |
|---|---|
| Documents opened | **10** |
| Documents with zero keyword hits | 3 (D2, D4, D8) |
| Documents with keyword hits but no qualifying finding | 5 (D1, D5, D6, D9, D10) |
| Documents with qualifying findings | **2** (D3, D7) |
| **Qualifying source findings** | **5** |
| **Failure-rows produced** | **6** |
| Rows cleanly mappable to R1–R5 as defined | **2 of 6** (entries 14, 15) |
| Rows coded "analogous" with flag | 2 of 6 (entries 18, 19) |
| Rows unmappable | 2 of 6 (entries 16, 17) |
| Rows involving a **partial** physical inventory count | **0** |

### Running totals

| Measure | Value |
|---|---|
| **Source findings toward the 30** | **18** (Run 01: 10 · Run 02: 3 · Run 03: 5) |
| **Failure-rows, tracked separately** | 19 (Run 01: 10 · Run 02: 3 · Run 03: 6) |
| Documents opened, cumulative | 17 (Run 01: 5 county reports · Run 02: 2 · Run 03: 10) |
| Jurisdictions | 5 counties |

**Yield rate, blind sample:** 2 of 10 documents produced qualifying findings; 5 of ~150-report population sampled blind.

---

## Instrument break log — Run 03

**Break 11 — partially answered.** Run 02 warned the 1-of-150 title-filter rate was a floor, not a measurement. Confirmed: **both qualifying documents in Run 03 would have been invisible to title filtering.** "Hammonds House Museum Audit" and "Fulton County Executive Airport Audit" contain no asset/inventory keyword in their titles, yet between them produced 5 qualifying findings. Title filtering materially understates prevalence.

**Break 12 — NEW. R4's definition does not match how R4 has been applied.**
R4 is defined as *custody and location failure — no record of who holds it or where*, i.e. a **recordkeeping** failure. But Run 02 entries 11 and 12 coded **physical security** failures to R4 (unsecured warehouse, equipment in open areas), and the MBPO source finding ("did not store unissued equipment in a secured area") is likewise physical, not documentary. Hammonds F7 (entry 16) makes the mismatch unavoidable: inadequate shelving and absent climate monitoring is a **physical preservation** failure with no recordkeeping component at all. **Recorded, not fixed** — R1–R5 is untouched per #119. Flagging that Run 02 entries 11–12 are affected by the same ambiguity and may warrant re-examination when the taxonomy is next opened.

**Break 13 — NEW. The taxonomy is movable-equipment-only; three other asset classes appeared.**
Run 03 surfaced findings in classes R1–R5 was never built for:
1. **Physical preservation / storage conditions** (entry 16)
2. **Facility inspection regime** (entry 17)
3. **Real-property documents and disposition authorization** (entries 18, 19)

Entries 18 and 19 were coded "R1-analogous" and "R5-analogous" **with flags** rather than coded cleanly, because forcing them into equipment codes would be the exact loosening #119 prohibits. This is Break 9's sampling-scope problem widening — the population contains more asset classes than the instrument was designed to code.

**Break 2 — persists across three runs.** Still no partial-scope physical inventory count anywhere in the sample. **P3's scope field remains untested against real data.**

**Break 3 — persists.** PA/IA unpopulated, 0 of 6.

**Break 6 — improved by v2.** The `Evidence Span` field resolved the extraction-boundary ambiguity: the span *is* the boundary, and it is now visible per row. This is the first break that v2 measurably fixed.

**Break 14 — NEW. `Kit section` has no null-with-reason value.** Entry 16 has no addressing kit section, which is a **product gap** — arguably the most valuable output a row can produce. The field currently allows recording it only as prose. A finder could equally leave it blank, making product gaps indistinguishable from unfilled fields.

---

## Notable, recorded without interpretation

**Entry 19 is the first finding in any run involving federally-funded real property where documentation could not be located.** It concerns FAA/AIP funds, **not FEMA Public Assistance.** It is structurally analogous to the PA documentation case — federal funding, real property, a documentation requirement, and a locatable-records failure — but it is a different federal program and **does not close the PA thesis gap** (#118). Recorded precisely so it is not later cited as PA evidence.

---

## Open issues carried

1. **Partial-count handling** — undefined, unexercised across three runs.
2. **Unresolved PA thesis** — still open. See the note above; entry 19 is adjacent, not on point.
