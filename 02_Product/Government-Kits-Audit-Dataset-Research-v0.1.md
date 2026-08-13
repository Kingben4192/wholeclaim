# Government Kits — Audit Dataset Research (Workstream v0.1)

**Status:** Active workstream, logged per Decision #116. Paired with the Property Documentation Kit prototype (#115).
**Origin:** Research conducted in a separate Claude conversation, 2026-08-12/13, and reported to this session by the founder.
**Verification standard:** every claim below is marked with who verified it. Claims I verified myself in this session are marked **[VERIFIED HERE]** with the source. Claims carried from the originating conversation that I have **not** independently checked are marked **[REPORTED, UNVERIFIED HERE]**. Nothing is stated as fact without one of those two marks — per CLAUDE.md's citation standard and Decision #114.

---

## 1. The legal hook — Georgia local government audits

**O.C.G.A. § 36-81-7** — **[VERIFIED HERE]**

Georgia local governments must provide for an audit of financial affairs and transactions, with reports submitted to the **Department of Audits and Accounts (DOAA)** within 180 days of fiscal year close. The statute provides a mechanism covering failure to file and failure to correct deficiencies, and audit reports are subject to public inspection.

**Two corrections to how this was characterised.** Both matter for sizing the opportunity:

1. **The requirement is threshold-based, not universal-annual.** Local governments with population exceeding 1,500 *or* expenditures of $550,000 or more require an **annual** audit. Those below the thresholds audit **at least once every two fiscal years**. Governments with expenditures under $550,000 may elect an annual report of agreed-upon procedures instead of a biennial audit. In practice, essentially every Georgia county clears the annual threshold — so "every county is audited annually" is close to true for counties specifically, but it is not what the statute says, and the distinction will matter as soon as municipalities enter scope.

2. **It applies to local governments generally — counties *and* municipalities.** The original framing was county-only. Georgia has 159 counties; adding municipalities expands the addressable set by roughly an order of magnitude. This is an expansion of the thesis, not a problem with it.

**What this gives us:** a recurring, statutorily-mandated, publicly-inspectable, state-collected audit trail with a named central repository. That is a structured research substrate rather than anecdote — which is the actual value of the hook.

**Sources:** [Justia — O.C.G.A. § 36-81-7 (2024)](https://law.justia.com/codes/georgia/title-36/provisions-applicable-to-counties-municipal-corporations-and-other-governmental-entities/chapter-81/article-1/section-36-81-7/) · [DOAA — statute text, effective 2019](https://www.audits2.ga.gov/wp-content/uploads/2021/10/36-81-7_effective2019.pdf) · [DOAA Local Government resources](https://www.audits2.ga.gov/resources/orgs/local-government/?rpage=get-help)

---

## 2. The failure pattern — repeated, independent, same findings

### NYC Board of Elections (2016) — **[VERIFIED HERE]**

Audit released **2016-06-06**, covering roughly three years of inventory and board records. Findings:

- **More than 1,450 pieces of equipment** not tracked, including voting machines.
- Missing: **4 voting machines, 45 computers, 127 monitors, 85 printers, 12 televisions.**
- **1,176 items never properly tagged** with identification markings and asset control numbers — left vulnerable to theft or loss.

The detail is stronger than the summary: the dominant failure was not theft, it was **items that were never tagged in the first place**. 1,176 of the 1,450 is a *recordkeeping origination* failure, not a security failure.

**Sources:** [NYC Comptroller — press release](https://comptroller.nyc.gov/newsroom/comptroller-stringer-audit-uncovers-nyc-board-of-elections-has-not-kept-track-of-over-1450-pieces-of-election-office-equipment/) · [Audit report — BOE inventory practices for office equipment and voting machines](https://comptroller.nyc.gov/reports/audit-report-on-the-new-york-city-board-of-elections-inventory-practices-for-office-equipment-and-voting-machines) · [NBC New York](https://nbcnewyork.com/news/local/Audit-New-York-City-Board-of-Elections-NYC-Police-Voting-Items-Lost-382011781.html)

### Further NYC Comptroller audits — **[VERIFIED HERE]**, with one date correction

All three located and confirmed. **The Public Advocate audit is 2016, not 2022.** Corrected timeline:

| Date | Agency | Findings |
|---|---|---|
| **2016-06-06** | Board of Elections | See above. 1,450+ untracked; 1,176 never tagged; items missing. |
| **2016-12-07** | **Public Advocate's Office** | No comprehensive oversight policies. **Master Inventory list not accurate and did not include all equipment in PAO custody.** Inventory maintained on two Excel spreadsheets — 565 computer equipment items, 21 mobile devices as of 2016-01-19. |
| **2022-06-27** | **Manhattan Borough President's Office** (MH22-061A) | Did not maintain a complete inventory listing · did not perform periodic counts · **did not immediately tag equipment when received** · did not store unissued equipment in a secured area. |
| **2022-06-29** | **New York County District Attorney's Office** | Performed periodic counts **only on federally-funded items**, not the full inventory · asset tags not assigned sequentially · **not all tagged assets recorded in inventory records** · some items observed by auditors not in records. Five recommendations, four accepted. |

**The correction strengthens the pattern rather than weakening it.** Two audits in 2016 under Comptroller Stringer, two in 2022 under Comptroller Lander — **two independent administrations, six years apart, four different agencies, materially the same findings.** That is the recurrence argument in its strongest available form, and it is now fully verified.

### A qualifier the summary omitted — and it changes the pitch

In both 2022 audits the agencies were **"generally able to account for"** the equipment despite the control failures. DANY accounted for its sampled items; MBPO accounted for its recent purchases. Only the 2016 Board of Elections audit found substantial items actually missing.

**So the verified pattern is: control and recordkeeping failures are near-universal; demonstrated loss is not.** This matters for how the line is positioned. The honest claim is **not** "you are losing equipment." It is **"you cannot demonstrate that you are not"** — which is precisely what a documentation product fixes, and precisely what an auditor writes up. Overstating this as a loss problem would be both wrong and easy to disprove.

**Sources:** [Public Advocate's Office](https://comptroller.nyc.gov/reports/audit-report-on-the-public-advocate-offices-controls-over-its-inventory-of-computers-and-computer-related-equipment) · [Manhattan Borough President's Office](https://comptroller.nyc.gov/reports/audit-report-on-the-manhattan-borough-presidents-offices-controls-over-its-inventory-of-computers-and-computer-related-equipment) · [New York County District Attorney's Office](https://comptroller.nyc.gov/reports/audit-report-on-the-new-york-county-district-attorneys-offices-inventory-practices-over-its-office-equipment)

### Outside New York — **[REPORTED, UNVERIFIED HERE]**

- Montana State University / University of Montana — could not locate disposal records for federally-funded equipment.
- City of Santa Fe — own inventory found "not complete and accurate."

**Verification status: COMPLETE for the NYC set** (2026-08-13). All four NYC audits verified against primary sources — see the table above. The pattern claim now stands on four confirmed audits across two Comptroller administrations six years apart, not on one. **Montana and Santa Fe remain unverified** and are the only outstanding items in this section; they are corroborating rather than load-bearing, since the NYC set alone now establishes recurrence.

---

## 3. The disaster overlay — PA vs. IA is a buyer-segmentation signal

This is the strategically significant part of the research and it holds up.

**Public Assistance (PA)** = state and local governments and certain private nonprofits documenting damage to **public facilities** for federal reimbursement. **That is the institutional buyer for this kit line.**

**Individual Assistance (IA)** = individuals and households documenting **their own property**. That is the buyer for the existing consumer Disaster Response Center — a different, already-approved product.

A jurisdiction's PA/IA designation therefore sorts it into one product line or the other, and the designations do not always match.

### Mississippi DR-4922 — **[VERIFIED HERE]**

Severe storms, straight-line winds, tornadoes and flooding, **May 6–7, 2026**. Seven tornadoes, 26 injured, 425 homes damaged.

- **Public Assistance — 4 counties:** Franklin, Lamar, Lawrence, Lincoln
- **Individual Assistance — 5 counties:** Franklin, Lamar, Lawrence, Lincoln, **Wilkinson**

**Wilkinson County has IA but not PA** — exactly as reported. It is a consumer-product county, not a kit county. The mismatch is real and is the cleanest illustration of the segmentation logic.

**Sources:** [FEMA DR-4922](https://www.fema.gov/disaster/4922) · [FEMA press release](https://www.fema.gov/press-release/20260702/president-donald-j-trump-approves-major-disaster-declaration-mississippi) · [Governor Reeves](https://governorreeves.ms.gov/president-trump-approves-major-disaster-declaration-for-may-6-7-severe-weather/)

### Louisiana DR-4927 — **[VERIFIED HERE, WITH CORRECTION]**

Tropical Storm Arthur. Incident period **2026-06-17 to 2026-06-24**. Declared **2026-08-03**; Public Assistance and an incident period extension added **2026-08-04**.

**Correction — the parish count was wrong as reported.** PA was added for **five** parishes, not two:

> **Avoyelles, Pointe Coupee, St. Charles, St. Landry, and Winn.**

**Second correction, and it strengthens the thesis.** DR-4927 is a **"Public Assistance Only"** declaration — the Federal Register titles it as such. So this is not a PA/IA contrast case at all; it is a pure institutional-buyer event with no consumer component. That is a *better* example for this line than the way it was framed, not a worse one.

**Sources:** [Federal Register — Presidential Declaration of a Major Disaster for Public Assistance Only, Louisiana](https://www.federalregister.gov/documents/2026/08/07/2026-16139/presidential-declaration-of-a-major-disaster-for-public-assistance-only-for-the-state-of-louisiana) · [FEMA — PA and incident period extension added](https://www.fema.gov/press-release/20260804/fema-public-assistance-and-incident-period-extension-added-major-disaster) · [FEMA DR-4927](https://www.fema.gov/disaster/4927)

### Why the freshness matters

The Louisiana PA addition is nine days old as of this writing and appears in no earlier list. Designations are **amended after declaration** — parishes get added, incident periods extend. Any dataset built from this has a staleness problem and needs a refresh cadence, not a one-time pull.

---

## 4. What this tells the prototype — the pairing, concretely

Two findings run in opposite directions. Both are useful.

### Finding A — the audit pattern validates the Asset & Inventory Kit's spine, not the facility kit

Every NYC failure mode maps directly onto a field group I argued to restore in #113 after the supplied product copy dropped it:

| Audit finding | Restored field group |
|---|---|
| Equipment never tagged | §2 Asset Identification Register — local asset ID |
| Missing serial numbers | §2 — serial number, NSN, IUID/UII |
| No periodic counts | §9 Inventory Review & Reconciliation |
| Incomplete inventory listings | §2 register + §3–6 detail spreads |
| No secured storage | §5 Location & Assignment, §6 Custody |

**This is external evidence for the accountability spine.** The 1,176-items-never-tagged figure is the strongest single number: it says the failure happens at record *origination*, which is precisely what a structured intake form addresses.

**But note the tension honestly:** the Stage 2 validation lead is the **Property Documentation Kit** (facility), and this research validates the **Asset & Inventory Kit**. The audit evidence points at a kit that is not the one being prototyped. That is a genuine finding from the pairing and should be weighed rather than smoothed over — see §5.

### Finding B — the PA overlay validates the facility kit as the disaster-reimbursement play

PA reimburses repair and replacement of **public facilities**. Substantiating a PA claim requires establishing facility condition — and pre-loss condition is the hardest part to produce after the fact. The Property Documentation Kit is exactly a pre-loss facility condition record.

That supports the current Stage 2 lead on a different axis than the reasoning originally given: not only "broadest foundational layer," but "the record a PA applicant needs and usually does not have." The Incident & Loss Documentation Kit is the natural companion for the post-event half.

---

## 5. Next step — the county-by-county table

Not yet done. The proposed structure, unchanged from the founder's framing:

| County | Audit year | Finding | Asset/inventory issue | PA / IA / neither |
|---|---|---|---|---|

Method: work DOAA county by county, extract findings touching asset accountability, inventory, capital assets or property records, then join against FEMA declaration designations.

**Three method notes before this starts:**

1. **Scope decision needed** — counties only, or counties plus municipalities? The statute covers both, and municipalities are where the below-threshold biennial and agreed-upon-procedures cases live, which may be where the *worst* recordkeeping is.
2. **The PA/IA join is time-varying.** Designations amend after declaration (see Louisiana). The join needs a date stamp, not a boolean.
3. **Verify the 2022 NYC audits first.** The pattern claim is load-bearing for the whole thesis and currently rests on one verified audit plus three unverified ones.

---

## 6. Standing constraint

This is research. **It is not authorization for outreach.** No government marketing, selling, pilot quoting, or contact with any named jurisdiction is authorized — that gate has been held continuously since Decision #110 and is untouched by this workstream. Findings inform product decisions and nothing else.
