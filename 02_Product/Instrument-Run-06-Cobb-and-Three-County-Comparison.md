# Instrument Run 06 — Cobb County + Three-County Comparison

**Date:** 2026-08-13. **Run 06 complete — all 10 documents opened.**
**Hypothesis under test:** *failure shape* is the taxonomy; *asset class* is an attribute determining which document closes the failure.
**Guard rails:** primary sources · evidence span required · one row = one failure · Parent Finding ID · Asset Lifecycle State · zero-yield recorded · no forcing into R1–R5 · **NYC excluded** · no invented sampling rules.
**Counting:** hypothesis-testing, **not** part of the 30-finding discovery stop. **The 30-count remains 19.**

---

## Cobb's source structure — third county, third rule

| County | Listing structure | Deterministic key available | Rule used |
|---|---|---|---|
| **Fulton** | Year-grouped list, **no dates** | none | Year bucket desc, then listing position (**proxy**) |
| **DeKalb** | Dated narrative entries + JS table | **Explicit issue dates** | True date sort desc |
| **Cobb** | Next.js SPA; catalogue only in RSC flight payload | **Native report number `YYYY-NNN`** | Report number desc |

**Cobb specifics:** the advertised URL **308-redirects** to `/internal-audit/audit-alerts-reports`. 134 PDFs on `assets.cobbcounty.gov`. Two document classes — **10 Audit Alerts**, **118 Audit Reports**, of which **115 carry `YYYY-NNN`**. Years 2010–2026 (numbered-report gaps at 2019, 2023, 2024). Dates appear in filenames in **four inconsistent formats**, making the report number the more reliable key.

**Rule executed:** sort by report number descending; take top 10. Excluded: 10 Audit Alerts (different document class), 3 unnumbered reports.

### Rule consequence — recorded, not ruled around

Cobb has the **richest accountable-equipment audit line of any county sampled**, and the deterministic rule **excluded all of it**:

- 2011-008 *Countywide Departmental Accountable Equipment Audit*
- 2012-004 *FIRST Follow-up — Countywide Accountable Equipment Audit*
- **2016-010 *FINAL REPORT — Review of Department Controls over Accountable Equipment***
- 2017-007 *FIRST Follow-up — Review of Department Controls over Accountable Equipment*
- 2017-004 *Survey of Operational Risks — Fleet Management*
- *Audit Alert — Accountable Equipment* (2014)

None falls in the top 10 by report number. **Retargeting the rule to capture them would be cherry-picking**, so the rule ran as stated. A separate, explicitly-labelled targeted pull of that line would be a different exercise and is worth considering on its own terms.

---

## The 10 documents

| Tag | Report | Qualifying |
|---|---|---|
| C01 | 2026-002 Review of PCard Purchases | 0 — monitoring-note retention, not asset records |
| C02 | 2026-001 Monitoring Controls over Identification of Deceased Retirees | **0 — zero keyword hits** |
| C03 | 2025-009 Summary of CY2024 Follow-up Status Reviews | **0 — zero keyword hits** |
| **C04** | **2025-008 State Court Clerk Accounting Division** | **1** |
| C05 | 2025-007 Hotel-Motel Tax Compliance | 0 |
| C06 | 2025-006 Tax Commissioner's Office Errors | 0 |
| **C07** | **2025-005 Animal Services (Shelter) Operations** | **2** |
| C08 | 2025-004 Solid Waste Department Operational Audit | 0 — "disposal" refers to waste disposal, not asset disposition |
| **C09** | **2022-002 Contract Agreement Oversight** | **1** |
| C10 | 2022-001 | 0 |

**3 of 10 documents qualifying · 4 qualifying source findings.**

---

## Qualifying findings

### Row E1 — Parent: COBB-2022-002
| Field | Entry |
|---|---|
| Evidence Span | "a physical inventory of goods, materials, accountable equipment, and capital assets were not updated per the **Cobb County Accountable Equipment policy**." |
| Actual failure | Required physical inventory not performed/updated against a named county policy |
| Asset Lifecycle State | in service |
| Asset class | Movable equipment + capital assets |
| **Failure shape** | **Required check not performed** |
| Closing document | Updated physical inventory record |

### Row E2 — Parent: COBB-2025-005 (Animal Services)
| Field | Entry |
|---|---|
| Evidence Span | "Although we were able to verify the existence of equipment sampled, we noted that **the accountable equipment inventory list was inaccurate as it included duplicate items.**" |
| Actual failure | Record exists and identifies items, but contains erroneous duplicate entries |
| Asset Lifecycle State | in service |
| Asset class | Movable equipment |
| **Failure shape** | **Record inaccurate — NEW variant, see below** |
| Closing document | Corrected inventory list |

### Row E3 — Parent: COBB-2025-005
| Field | Entry |
|---|---|
| Evidence Span | "Animal Services **lacks a formal inventory tracking system**" |
| Actual failure | No formal tracking system exists |
| Asset Lifecycle State | in service |
| Asset class | Movable equipment |
| **Failure shape** | **Record absent** |
| Closing document | Inventory tracking system of record |

### Row E4 — Parent: COBB-2025-008 (State Court Clerk)
| Field | Entry |
|---|---|
| Evidence Span | "There is **inadequate dual custody** during the daily morning cash count… there was no meaningful dual review observed. On one occasion, the lead clerk left the newly hired clerk alone… **in the room with the safe open.**" |
| Actual failure | Dual-custody control not effective; held value left unsecured |
| Asset Lifecycle State | in custody |
| Asset class | Cash |
| **Failure shape** | **Physical safeguarding** |
| Closing document | Dual-signature count attestation |

---

## Three-county comparison — does the pattern hold?

### Shape recurrence across counties

| Failure shape | Fulton | DeKalb | Cobb | Counties |
|---|---|---|---|---|
| **Record absent** | HHM no inventory listing; FTY 3 of 15 leases | K05 no comprehensive inventory; K04 no receipt log | C07 no formal tracking system | **3 of 3** |
| **Physical safeguarding** | Unsecured warehouse; art storage | K04 cash in desk drawer | C04 safe left open, dual custody | **3 of 3** |
| **Required check not performed** | 2015 annual count; FTY no hangar inspection policy | — | C09 physical inventory not updated | **2 of 3** |
| **Disposition control failure** | FTY land release; JUV escheatment | K05 disposal records; K06 dormant cards | — | **2 of 3** |
| **Identification insufficient** | HHM ownership indeterminate | K05 no asset tags/serials | — | **2 of 3** |
| **Custody-termination control absent** | — | K05 device return; K06 P-card cancellation | C09 turnover handover absent | **2 of 3** |
| **Record inaccurate** *(new)* | — | — | C07 duplicate entries | **1 of 3** |

**Two shapes now appear in all three counties.** Four appear in two. That is materially stronger than v0.1, which was confined to a single county with nothing above 2 independent sources.

### The hypothesis holds across three counties

**Asset class never changed the failure — only the closing document.**

| Asset class | Closing document |
|---|---|
| IT equipment | Certificate of Destruction, asset tag |
| Cash | Bank deposit, dual-signature count attestation |
| Payment instrument | Cancellation record |
| Real property | FAA release of obligations; lease file |
| Custodial funds | DOR escheatment filing |
| Capital assets | Updated physical inventory per county policy |

### A seventh shape candidate — *record inaccurate*

Cobb C07 is the first instance where a record **exists, identifies its items, and is still wrong** — duplicate entries inflating the inventory. This is distinct from *record absent* (nothing exists) and from *identification insufficient* (exists but can't identify). **Flagged as a candidate, not named or adopted**, per the standing rule that consolidation happens after collection.

### Institutional finding worth noting

Cobb operates a named **"Cobb County Accountable Equipment policy"**, audits departments against it, and has run a recurring accountable-equipment audit line since at least 2011. **This is the first evidence in any run of a standing countywide asset-accountability regime with its own policy instrument.** It suggests the product would slot into existing policy infrastructure rather than create it — recorded, not acted on.

---

## What this still does not establish

1. **No prevalence claim.** Cobb's rule excluded its own accountable-equipment line; DeKalb's richest document was titled an inventory audit. Both are selection effects.
2. **Real property remains Fulton-only.** Neither DeKalb nor Cobb produced a real-property finding. The class-as-attribute claim is well-supported for equipment/cash/instruments, **thin for real property**.
3. **Break 2 unexercised across six runs** — still no partial-scope physical count anywhere.
4. **PA thesis untouched** — no facility-condition or FEMA-PA finding in any run.
5. **30-count remains 19.** Runs 05 and 06 are hypothesis-testing and contribute nothing to the discovery stop.
