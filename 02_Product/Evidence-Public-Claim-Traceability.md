# Public Evidence Claims → Source Traceability

**Purpose:** Decision #123 (Evidence Option C) permits specific findings on the
public government site with the jurisdiction anonymized. This file is the
private mapping that makes each public claim defensible: **which county, which
finding ID, which document.**

**INTERNAL. Never served.** `11_GovSite/.vercelignore` excludes `README.md`
from deployment; this file lives in `02_Product/`, entirely outside the site's
serve path. It must not be moved into `11_GovSite/`.

---

## The sample, stated honestly

| Measure | Value |
|---|---|
| Documents opened | 27 |
| Counties touched | 5 (Fulton, DeKalb, Jasper, Fannin, Habersham) |
| Source findings recorded | 19 |
| **Asset-relevant findings** | **9** |
| **Independent asset-relevant sources** | **4 — all Fulton County** |
| Span | 2015–2026 |

Ten of the 19 findings (Run 01) come from external financial audits with no
asset, equipment, inventory, property or custody content at all. They are
recorded because zero-yield must be recorded, not because they inform anything.

**The binding constraint:** all asset-relevant evidence comes from **one
county's internal audit office**. The public copy therefore says "a
metro-Atlanta county" in the **singular**, consistently. Varied or plural
phrasing would imply several jurisdictions and would be a worse
misrepresentation than naming the county, because a reader would infer variety
that the sample does not contain.

**What is defensible is cross-departmental, not cross-jurisdictional** — four
unrelated departments in one county over eleven years.

---

## Claim → source mapping

| # | Public claim (anonymized) | County | Finding ID | Source document | Matrix row |
|---|---|---|---|---|---|
| 1 | "~250 surplus water meters were stolen from a storage facility an audit found lacked surveillance and access control" | Fulton | `FUL-2015-WS` | 2015 Water Services Equipment Management Review | 11 |
| 2 | "the same review found the required annual physical inventory count had not been performed" | Fulton | `FUL-2015-WS` | 2015 Water Services Equipment Management Review | 13 |
| 3 | "records and labeling did not distinguish county-owned pieces from those owned by the institution housing them" | Fulton | `HHM-F6` | 2026 Hammonds House Museum review | 14 |
| 4 | "an airport with fifteen tenants could produce only twelve leases" | Fulton | `FTY-F4` | 2025 Executive Airport review | 18 |

**Verbatim source text for each is in the run files** —
`Instrument-Run-02/03/04-Fulton-OCA-RAW-RESULTS.md` and the matrix at
`Instrument-Discovery-Matrix-and-Taxonomy-v0.1-HYPOTHESIS.md` §1b.

### Independence note

Claims 1 and 2 come from **the same document and the same incident**. They must
never be presented as two separate occurrences. Matrix §1c is explicit: rows 11,
12 and 13 are one source; counting them separately would triple-count one event.

Independent sources are four: FUL-2015 Water Services · FTY-2025 Airport ·
HHM-2026 Museum · JUV-2024 Juvenile Court.

---

## What the public copy may NOT say

- **Not** "across jurisdictions" / "across counties" — the asset-relevant
  sample is single-county. *(The Option A copy on `index.html` currently says
  patterns "show up independently across different departments and
  jurisdictions." The departments half is supported; the jurisdictions half is
  not. Flagged for correction.)*
- **Not** any recurrence figure without its sample size beside it (#119).
- **Not** "most", "typically", "commonly", or any frequency claim. No claim in
  the matrix rests on more than 3 rows or 2 independent sources.
- **Not** a causal claim that a kit would have prevented a finding. The site's
  "What our research does not establish" section says the opposite and stays.
- **Not** anything from Run 07 — it was designed but never executed. Break 2 is
  unresolved.

---

# Part 2 — Competitive research: verified vs. retracted

Added under Decision #124. **Separate evidence base from Part 1.** Part 1 covers
government audit findings quoted on the public site; this part covers competitor
claims from the Nonprofit/Business market-validation research. They are kept in
one file because both answer the same question — *can this claim be defended?* —
but they must never be merged or cited interchangeably.

The source research for this part **lives outside this repository.** Nothing in
this repo cited any of these names before #124, so the entries below are the
canonical record, not a summary of an in-repo document.

## Verified — real products

| Category | Product | Status |
|---|---|---|
| Maintenance tracking | **FixLog** — `https://www.fixlogapp.com/` | **Verified independently.** Real product; iOS app also listed on the App Store. Tracks assets, maintenance reminders, repairs, warranties, documents, costs, QR labels and reports. The only confirmed near-competitor. |
| Depreciation / accounting | **Fixed Asset Pro**, **MIP**, **QuickBooks + AssetAccountant** | Verified in the source research (founder-supplied). Not re-verified here. |
| Point-in-time insurance inventory | **HomeZada**, **Encircle**, **NAIC Home Inventory** | Verified in the source research (founder-supplied). Not re-verified here. |

**None of these own the full proposed architecture** — they cover adjacent
pieces. That is the defensible claim.

## ⚠ RETRACTED — do not cite

| Claim | Status |
|---|---|
| **"InsureLoc"** — cited in earlier research as a direct competitor with a specific feature set (Business Plus package, Proof File Checkup, and similar) | **RETRACTED. Unfounded.** Independent search returned **no company or product under that name.** Nearest real names are different companies: InsurEco (`insureco.io`), InsureCo (`insureco.org`), Insureon, Insure.com. The cited feature set has no verifiable source. |

**Treat any future appearance of "InsureLoc" as a red flag**, not as a name to
re-check. It was cited with specific, confident product detail that did not
exist — which is the failure mode most likely to survive into positioning,
sizing and pricing decisions unchallenged, because invented detail reads as
research rather than as a gap.

## Binding guardrail (#124)

**Never claim uncontested "white space" or "no competitors"** in product copy or
internal documents. Competitors exist in adjacent categories. The honest and
stronger claim is that no one owns the full architecture.

## Maintenance

If a second county contributes an independent asset-relevant source, this file
and the public copy both change, and #123's revisit trigger fires. Update the
table above **before** the public copy, never after.
