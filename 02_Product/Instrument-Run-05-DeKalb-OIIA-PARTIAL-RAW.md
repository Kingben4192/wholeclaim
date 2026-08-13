# Instrument Run 05 — DeKalb County OIIA — RAW RESULTS (PARTIAL)

**Run date:** 2026-08-13
**Purpose:** second-county test of the movable-equipment / real-property hypothesis. Coded fresh against DeKalb's evidence, not toward confirming Fulton.
**Rules:** as Runs 03/04 — primary source only, evidence span required, one row = one failure, Parent Finding ID, Asset Lifecycle State, zero-yield recorded, **NYC excluded**, no forcing findings into existing categories.
**Scope:** 10 documents. **Not** a 30-finding stop — this is hypothesis-testing.

> ## ⚠ THIS RUN IS PARTIAL — READ BEFORE USING ANY NUMBER
>
> All 10 documents were downloaded and keyword-scanned. Findings were **fully extracted from one** (K05). Three are **confirmed zero keyword hits**. **Six were scanned but findings were not extracted.**
>
> **Those six are NOT recorded as zero-yield.** Recording an unread document as zero-yield would corrupt the denominator in exactly the way the zero-yield rule exists to prevent. They are recorded as **unexamined**, and Run 05's yield figures are floors, not measurements.

---

## Selection rule — stated before any document was opened

**DeKalb's listing is structurally different from Fulton's, and Fulton's rule does not transfer.**

Fulton's listing groups reports by year with no dates, forcing a year-bucket-plus-listing-position proxy. **DeKalb publishes explicit issue dates** ("December 08, 2025"), so a **true date sort** is available and no proxy is needed.

- **Population:** the 20 dated entries parseable from the static HTML of DeKalb OIIA's Audit Reports page.
  **Limitation, stated up front:** the page also carries a JavaScript-rendered searchable table containing more reports (~29 unique IA numbers detected in page source). Not retrievable without executing JS. **Outside this run's population.**
- **Exclude:** OIIA Annual Reports and Audit Work Plans — administrative publications, not audits (5 entries).
- **Sort:** explicit issue date, descending. True date sort.
- **Take:** top 10.
- **Prior-run overlap:** none. Run 01 used DeKalb's *external* single audit; these are internal OIIA reports.
- **Open all 10 regardless of title.**

Yield: exactly 10 reports, 2025-04-03 → 2026-04-29.

---

## The 10 documents

| # | Report | Issued | Status |
|---|---|---|---|
| K01 | Audit of Low Bid Procurement Process (IA-2024-0237-PC) | 2026-04-29 | **scanned, not extracted** |
| K02 | Final Audit of E911 Call Response Times (IA-2024-242-PS) | 2026-04-20 | **scanned, not extracted** |
| K03 | Audit of Emergency Procurements (IA-2024-0243-PC) | 2026-04-02 | **scanned, not extracted** |
| K04 | DeKalb-Peachtree Airport Revenue Collection (IA-2025-0268-AP) | 2025-12-18 | **scanned, not extracted** |
| K05 | **Audit of Mobile Devices Inventory and Management (IA-2025-0275-IT)** | 2025-12-08 | **FULLY EXTRACTED — qualifying** |
| K06 | Purchasing Card Programs, Various User Departments (2024-0223-FN) | 2025-10-29 | **scanned, not extracted** |
| K07 | 4th Follow-Up, Infor Public Sector (Hansen) IT General | 2025-10-15 | **zero keyword hits** |
| K08 | Audit of Temporary Personnel Services (IA-2023-169-HR) | 2025-09-05 | **zero keyword hits** |
| K09 | Animal Shelter Evaluation (167 pp.) | 2025-07-10 | **scanned, not extracted** |
| K10 | Application Change Management Audit (IA-2024-0208-IT) | 2025-04-03 | **zero keyword hits** |

Keyword profile of unextracted documents, recorded so the gap is visible: K01 (equipment 1, custody 2, safeguard 3, storage 3) · K03 (equipment 3, asset 1) · K04 (**safeguard 17**, asset 3, storage 2) · K06 (equipment 7) · K09 (**inventory 17, equipment 16, storage 17, disposal 7**). **K04 and K09 are the most likely to contain further qualifying findings and remain unread.**

---

## Qualifying findings — Source K05

**Audit of Mobile Devices Inventory and Management**, DeKalb County OIIA, Report No. IA-2025-0275-IT, issued 2025-12-08. [PDF](https://www.dekalbcountyga.gov/sites/default/files/2026-06/Final%20Audit%20of%20Mobile%20Devices%20and%20Inventory%20Management%20Report%20No.%20IA-2025-0275-IT_Redacted_0.pdf)

**2 qualifying source findings → 5 failure rows.**

*Note: a Finding 2 exists in the document's structure but could not be cleanly isolated in text extraction. Recorded as a gap, not as absent.*

### Row D1 — Parent: DKB-K05-F1
| Field | Entry |
|---|---|
| Evidence Span | "There is no requirement within the policies for employees to return County-issued devices upon separation or reassignment" |
| Actual failure | No policy requirement for return of custody on separation or reassignment |
| Asset Lifecycle State | in service — custody termination uncontrolled |
| Movable equipment / real property / other? | **Movable equipment** |
| Provisional category | Custody-return control absent |
| Legacy R1–R5 | R4-adjacent | Mismatch: R4 is a *record* failure; this is an absent *control requirement* |

### Row D2 — Parent: DKB-K05-F3 (*Inadequate Disposal Records Prevent Verification of Secure Data Destruction*)
| Field | Entry |
|---|---|
| Evidence Span | "Eighteen of the 23 records lacked a complete count of hard drives and did not include a detailed inventory of laptops, tablets, iPads, iPhones, and portable hotspots provided to the vendor for destruction." |
| Actual failure | Disposal records incomplete — 18 of 23 |
| Asset Lifecycle State | disposed |
| Class | **Movable equipment** |
| Provisional category | Disposal record incomplete |
| Legacy R1–R5 | **R5 — first clean fit in any run.** No mismatch flag. |

### Row D3 — Parent: DKB-K05-F3
| Field | Entry |
|---|---|
| Evidence Span | "Some of the reviewed records also lacked sufficient details such as asset tags, serial numbers, or other identifiers to reconcile disposed devices with County-owned assets" |
| Actual failure | Identifiers absent, preventing reconciliation of disposed items to owned assets |
| Asset Lifecycle State | disposed |
| Class | **Movable equipment** |
| Provisional category | Identification insufficient |
| Legacy R1–R5 | **R2 — clean fit** |

### Row D4 — Parent: DKB-K05-F3
| Field | Entry |
|---|---|
| Evidence Span | "14 of the 23 records were missing County certification signatures confirming verification of the destroyed devices." |
| Actual failure | Certification of destruction not signed — 14 of 23 |
| Asset Lifecycle State | disposed |
| Class | **Movable equipment** |
| Provisional category | Verification/certification not executed |
| Legacy R1–R5 | R5-adjacent | Mismatch: R5 covers record *absence*; this is record *present but uncertified* |

### Row D5 — Parent: DKB-K05-F3
| Field | Entry |
|---|---|
| Evidence Span | "The Audit team could not reconcile the data provided because comprehensive inventory of the devices was not readily available." |
| Actual failure | No comprehensive inventory exists to reconcile against |
| Asset Lifecycle State | in service / disposed (both) |
| Class | **Movable equipment** |
| Provisional category | Record absent |
| Legacy R1–R5 | **R1 — clean fit** |

---

## The four questions, answered per finding

**Movable equipment, real property, or something else?** All five DeKalb rows are **movable equipment**. Zero real-property findings in the extracted portion.

**Does the movable/real distinction change the actual problem?**

On this evidence: **no — it changes the remedy, not the failure mode.**

The same four failure shapes appear in both classes across Fulton and DeKalb:

| Failure shape | Movable equipment | Real property |
|---|---|---|
| Record absent | DeKalb D5, Fulton HHM-F6 | Fulton FTY-F4 (3 of 15 leases) |
| Identification insufficient | DeKalb D3, Fulton HHM-F6 | — |
| Verification not performed | Fulton FUL-2015 (count) | Fulton FTY-F3 (inspection) |
| Disposition uncontrolled | DeKalb D2/D4 | Fulton FTY-C2 (land release) |

What differs is **who authorises the status change and what document closes the loop** — a Certificate of Destruction for a laptop, an FAA release of obligations for airport land, a DOR escheatment filing for custodial funds. The *failure* is the same: the closing record is missing, incomplete, or uncertified.

**Provisional read, not adopted:** the distinction may belong as an **attribute** (asset class) rather than as separate categories. The taxonomy would then describe failure shapes, with class and authorising regime as fields. **This is a hypothesis from 2 counties and should not be treated as established.**

---

## Comparison — does the Fulton pattern hold, or was it Fulton-specific?

**It holds, with one important qualification about how it was found.**

**What replicated in DeKalb, independently:**
- Record absent (D5) — matches Fulton HHM-F6, FTY-F4
- Identification insufficient (D3) — matches Fulton HHM-F6
- Disposition control failure (D2, D4) — matches Fulton FTY-C2, JUV-F5

Three of the five v0.1 provisional categories appeared in a second county. **That materially strengthens them beyond the single-county limit v0.1 was confined to.**

**What DID NOT replicate:** no physical-safeguarding finding and no real-property finding in the extracted portion. Fulton's most-repeated category (physical safeguarding, n=3 rows) has **zero** DeKalb instances so far.

**The qualification, and it matters.** DeKalb's yield came from a document **titled** "Mobile Devices Inventory and Management" — an audit that set out to examine inventory. Finding inventory failures there is close to guaranteed and is **selection, not prevalence**. Fulton's hits were epistemically stronger: Hammonds House Museum and Executive Airport were title-invisible, discovered only by opening documents blind.

**So: the failure shapes replicate across counties. The prevalence question does not advance**, and DeKalb's single extracted document cannot speak to it.

**R5's status changes.** v0.1 concluded R5 "does not survive — zero clean instances." DeKalb D2 is a **clean R5 instance**. R5 survives after all, on n=1 clean instance in a second county. v0.1's verdict on R5 was correct for its sample and is now superseded by new evidence — recorded rather than quietly amended.

**Independent product signal, recorded without acting on it:** the entire K05 Finding 3 concerns **certification of secure data destruction** — Certificates of Destruction, missing signatures, inability to reconcile destroyed devices to owned assets. This is direct external evidence for the **data-sanitization-on-disposal field** restored to the Asset & Inventory Kit by Decision #113, which was argued on reasoning rather than evidence at the time.

---

## Open

- Six DeKalb documents remain unread, two of them (K04, K09) with strong keyword profiles.
- Break 2 unexercised across five runs — still no partial-scope physical count.
- PA thesis untouched — no facility-condition or FEMA-PA finding in Run 05.
