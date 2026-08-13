# Run 05 — DeKalb OIIA COMPLETION + Sharpened Hypothesis Test

**Date:** 2026-08-13. Completes the six documents left unread in `Instrument-Run-05-DeKalb-OIIA-PARTIAL-RAW.md`. **Run 05 is now complete — all 10 documents examined.**

**Hypothesis under test:** *failure shape* (record absent · identification insufficient · disposition control failure · physical safeguarding) may be the real taxonomy; *asset class* (real property vs movable equipment) may be an **attribute** determining which document closes the failure, not a separate category.

**Guard rails:** primary sources · evidence span required · one row = one failure · Parent Finding ID · Asset Lifecycle State · zero-yield recorded · no forcing into R1–R5 · **NYC excluded from counts** · no invented sampling rules.

**Counting note:** Run 05 is hypothesis-testing, **not** part of the 30-finding discovery stop. **The 30-count remains at 19** (Runs 01–04). Run 05 figures are tracked separately.

---

## The six previously-unread documents

| Doc | Report | Findings | Qualifying |
|---|---|---|---|
| K01 | Low Bid Procurement Process | 6 | **0** — procurement policy, system tracking, file integrity/retention, ITB approval, timelines. File-retention finding concerns *procurement records*, not asset records. Excluded. |
| K02 | E911 Call Response Times | 7 | **0** — data reliability, answering times, response objectives, EMS vendor, disaster recovery. No asset content. |
| K03 | Emergency Procurements | 6 | **0** — procurement policy alignment, planning, NCPR forms, quotes, BOC ratification. |
| **K04** | **DeKalb-Peachtree Airport Revenue Collection** | 9 | **1 source finding → 3 rows** |
| **K06** | **Purchasing Card Programs** | 8 | **2 source findings → 2 rows** |
| K09 | Animal Shelter Evaluation (167 pp.) | narrative | **0 qualifying — 1 discovery observation, not counted** |

---

## K04 — Airport Revenue Collection, FINDING 3

*"Controls over Physically Safeguarding Revenues Collected Onsite at the Airport Need to be Enhanced"* — Report No. IA-2025-0268-AP, issued 2025-12-18.

The source itself invokes **GAO Green Book Principle 10**, which requires management to design control activities *"such as securing assets and ensuring daily deposits."* **The source frames cash as an asset to be secured** — relevant to whether asset class is an attribute rather than a boundary.

### Row D6 — Parent: DKB-K04-F3
| Field | Entry |
|---|---|
| Evidence Span | "Physical security is inadequate, as funds are stored in a locked bag in a desk drawer instead of a secure, locked safe, and the after-hours drop box is not tamper-resistant." |
| Actual failure | Physical storage inadequate to secure held value |
| Asset Lifecycle State | in custody, pre-deposit |
| **Asset class** | **Cash / revenue** |
| **Failure shape** | **Physical safeguarding** |
| Closing document implied | Deposit to bank |

### Row D7 — Parent: DKB-K04-F3
| Field | Entry |
|---|---|
| Evidence Span | "payments may occasionally be accepted by other members of the airport staff when that employee is unavailable, with no defined system for logging or processing them" |
| Actual failure | No logging system exists at point of receipt |
| Asset Lifecycle State | at receipt |
| **Asset class** | Cash / revenue |
| **Failure shape** | **Record absent (origination)** |
| Closing document implied | Receipt log |

### Row D8 — Parent: DKB-K04-F3
| Field | Entry |
|---|---|
| Evidence Span | "airport staff did not deposit funds in a timely manner, holding collections for up to a week, including two checks totaling nearly $1.8 million" |
| Actual failure | Required transfer not performed within expected period |
| Asset Lifecycle State | **held past required disposition** |
| **Asset class** | Cash / revenue |
| **Failure shape** | **Disposition control failure — failure-to-move variant** |
| Note | Same shape as JUV-F5 escheatment (Run 04): value held past the point it should have moved, no process detecting it |

---

## K06 — Purchasing Card Programs, FINDINGS 7 and 8

Report No. 2024-0223-FN, issued 2025-10-29.

### Row D9 — Parent: DKB-K06-F7 (*Dormant P-Cards are Not Identified or Canceled in a Timely Manner*)
| Field | Entry |
|---|---|
| Evidence Span | "We identified 3 P-Cards that had not been used in the past 360 days… 1 of the cards was activated in 2021 and has never been used. 1 of the cards has not been used since 2018, 6+ years… There is currently no policy or procedure in place to ensure that P-Cards that are no longer needed by an employee are canceled in a timely manner." |
| Actual failure | Instrument remains active past need; no detection process |
| Asset Lifecycle State | **held past required disposition** |
| **Asset class** | Payment instrument |
| **Failure shape** | **Disposition control failure — failure-to-move variant** |
| Closing document implied | Card cancellation record |

### Row D10 — Parent: DKB-K06-F8 (*Inadequate Controls Over P-Card Cancellation Following Employee Termination or Transfer*)
| Field | Entry |
|---|---|
| Evidence Span | "internal controls were not consistently effective in ensuring that P-Cards were canceled in accordance with policy when cardholders separated from the County or transferred to another department" |
| Actual failure | Custody not terminated when holder left or moved |
| Asset Lifecycle State | in service — custody termination uncontrolled |
| **Asset class** | Payment instrument |
| **Failure shape** | **Custody-termination control absent** |
| Closing document implied | Cancellation confirmation on separation |

---

## Discovery observation — recorded, NOT counted

**K09 Animal Shelter Evaluation.** Its inventory references concern **animal population census**, not asset inventory. Not a qualifying asset finding, and recorded as a discovery observation only — the same treatment given to the Fulton ballot-custody regime in Run 04.

Recorded because one sentence is the most product-relevant in the entire corpus:

> "Effective population management and monitoring should involve conducting a daily animal inventory… **However, staff have indicated that they no longer perform this inventory due to the time it consumes.**"

The **shape** is exactly *required check not performed* — identical to Fulton's uncompleted annual physical count. What is new is the **stated cause: the count was abandoned because it took too long.** No other finding in the corpus states why a required check stopped happening. For a product whose core mechanism is periodic verification recorded on paper, that is the adoption risk named out loud by a real government body. **Recorded, not acted on.**

---

## Run 05 totals — complete

| Measure | Value |
|---|---|
| Documents opened | **10 of 10** |
| Documents with qualifying findings | **3** (K04, K05, K06) |
| Documents with zero qualifying findings | 7 |
| **Qualifying source findings** | **5** |
| **Failure rows** | **10** |
| Discovery observations, not counted | 1 (K09) |
| Asset classes represented | **3** — IT/mobile equipment · cash/revenue · payment instruments |
| Contribution to the 30-finding stop | **0 — hypothesis-testing, tracked separately. 30-count stays at 19.** |

---

## Hypothesis test result

### The sharpened hypothesis is supported by DeKalb's evidence

**Five failure shapes appeared, each recurring across two or more asset classes:**

| Failure shape | Instances | Asset classes | Closing document differs by class |
|---|---|---|---|
| **Record absent** | K05 D5, K04 D7 | IT equipment, cash | Device inventory / receipt log |
| **Identification insufficient** | K05 D3 | IT equipment | Asset tag, serial number |
| **Disposition control failure** | K05 D2, K05 D4, K04 D8, K06 D9 | IT equipment, cash, payment instrument | Certificate of Destruction / bank deposit / cancellation record |
| **Physical safeguarding** | K04 D6 | Cash | Secure safe |
| **Custody-termination control absent** | K05 D1, K06 D10 | IT equipment, payment instrument | Return-on-separation record / cancellation confirmation |

**The class did not change the failure. It changed the document that closes it.** A laptop needs a Certificate of Destruction, cash needs a deposit, a P-card needs a cancellation record, airport land needs an FAA release of obligations, custodial funds need a DOR escheatment filing. The failure in every case is that the closing record is absent, incomplete, or uncertified.

### Two corrections to earlier conclusions

**1. Physical safeguarding DOES appear in DeKalb.** The partial Run 05 write-up stated it had zero DeKalb instances — that was an artifact of only one document having been read. K04 F3 is a physical safeguarding finding. **Corrected by record, not edited.** It appears for *cash*, not equipment — which is itself evidence for class-as-attribute.

**2. A sixth shape candidate emerged that v0.1 did not contain: custody-termination control absent.** K05 F1 (no requirement to return County-issued devices on separation) and K06 F8 (P-cards not cancelled on separation or transfer) are the same failure in two classes. It is arguably **distinct from disposition control failure**: the trigger is a *person leaving*, not an *asset being retired*. v0.1's five categories had no place for it. **Flagged as a candidate, not named or adopted** — per the standing constraint that categories are consolidated after collection, not during.

### What this still does not establish

- **Two counties, not three.** Cobb is Run 06; Clayton is parked as blocked-access.
- **No prevalence claim.** DeKalb's richest document was *titled* an inventory audit — selection, not base rate.
- **Real property is thin in DeKalb.** Zero real-property findings here; that class rests entirely on Fulton (leases, airport land). The class-as-attribute claim is stronger for movable/cash/instrument than for real property.
- **Break 2 unexercised across five runs** — still no partial-scope physical count.
- **PA thesis untouched.**
