# Run 07 — Break 2 Controlled Test: DESIGN ONLY

**Date:** 2026-08-13. **Setup only. Nothing sampled. No document opened.**
**Status:** awaiting founder confirmation of the test design against the verbatim definition before any retrieval begins.

---

## 1. Break 2, quoted verbatim from its original definition

Source: `Instrument-Run-01-Georgia-DOAA-RAW-RESULTS.md`, break log.

> **Break 2 — The designated stress test could not be performed.**
> The instruction required at least one partial-federal-funding-scope finding to stress the P3 scope field. **No such finding exists in this sample.** Zero Georgia county findings retrieved involve a physical inventory count at all, partial or otherwise. Entry 7 was entered as the nearest analogue and is explicitly *not* a valid test — it is federal awards *reporting*, not a scoped count. **The P3 scope field remains untested against real data.**

## 2. The field under test, quoted verbatim

Source: `prototype/Government-Property-Documentation-Kit-PROTOTYPE-v0.1.md`, section P3.

> | **Scope of this count** | ☐ Entire inventory ☐ Partial — describe below |
> | If partial, what was excluded and why | |

> **The scope field exists to catch the DANY finding.** Counting only federally-funded items is a partial count. If a count is partial, this form requires the exclusion to be stated — which converts a silent gap into a recorded one.

## 3. The originating case, quoted verbatim

Source: `Government-Kits-Audit-Dataset-Research-v0.1.md`, verified NYC set. **NYC remains excluded from all counts** — it is quoted here as the design target, not as evidence.

> Performed periodic counts **only on federally-funded items**, not the full inventory

---

## 4. What the verbatim text actually requires — narrower than the shorthand

Six run logs have carried Break 2 as *"still no partial-scope physical count."* The original text is more specific, and the difference matters:

1. The test requires a finding involving **a physical inventory count that was actually performed** — and performed over **part** of the inventory. Not a count omitted. Not a count overdue. Not a reporting failure.
2. **"Not performed at all" is explicitly not a valid substitute.** Run 02 entry 13 (Fulton, annual count not performed) and Cobb 2022-002 (inventory not updated) are both *absent* counts. Under the verbatim definition neither tests the field, because a form that is never filled in cannot demonstrate whether its scope checkbox catches anything.
3. The pass condition is about **the form, not the finding**: does completing P3 truthfully force the scope limitation onto the page?

**Consequence for the search:** six runs have failed not because the search was poor but because **the population was wrong**. County internal audits examine whether a department manages its own equipment. Partial-scope counts arise from a different pressure entirely — **2 CFR 200.313(d)(2) requires a physical inventory of *federally funded* equipment at least once every two years.** That rule creates precisely the incentive that produced the DANY finding: count what the federal requirement covers, leave the rest uncounted. The document class that records this is the **single audit**, under the compliance requirement **"Equipment and Real Property Management."**

---

## 5. Proposed smallest controlled test

### 5a. This is a targeted test, not a sample — stated so it cannot contaminate anything

**This test deliberately abandons blind sampling.** Testing whether a form field catches a specific case requires retrieving that case on purpose. That is legitimate for form validation and illegitimate for prevalence.

**Therefore: Run 07 produces no prevalence data, contributes nothing to the 30-finding stop, and its findings must never be cited as evidence of how common partial-scope counts are.** The 30-count stays at 19.

### 5b. Population

Single-audit findings cited under Uniform Guidance compliance requirement **Equipment and Real Property Management (2 CFR 200.313)**, from a public primary source. **Not restricted to Georgia** — Break 2 concerns the form's behaviour, not Georgia prevalence, and restricting geography here would only reduce the chance of resolving it.

### 5c. Selection rule — deterministic, stated before opening

- **Source:** Federal Audit Clearinghouse (`fac.gov`) public dissemination search, filtered to the Equipment and Real Property Management compliance requirement. If that filter proves unavailable without an API key, fall back to published single-audit reports located by primary-source search, and **record the substitution explicitly** rather than improvising silently.
- **Order:** most recent audit year first; within a year, ascending by the source's own identifier (FAC accession number, or report number where FAC is unavailable).
- **Examine in order. Record every document examined**, including non-qualifying ones with the reason.
- **Qualifying test, applied per finding:** does the finding describe a physical inventory count that **was performed** over **part** of the inventory? If the count was absent, overdue, or the finding concerns records/reporting rather than a count, it is **non-qualifying** — recorded as examined-and-excluded, exactly as Run 01 entry 7 was.

### 5d. Stopping rule — bounded so the test terminates either way

**Stop at whichever comes first:**
- **3 qualifying partial-scope findings**, or
- **15 documents examined.**

Three is the smallest number that can distinguish a field that works from one that works once by luck. Fifteen bounds the cost.

### 5e. Pass / fail defined in advance

For each qualifying finding, attempt to record it on the actual P3 form as written.

- **PASS** — a truthfully completed P3 **forces** the scope limitation onto the page: the user must tick "Partial" and state what was excluded and why. The silent gap becomes a recorded one.
- **FAIL** — P3 can be completed truthfully and completely while the scope gap stays invisible. This would most likely occur if a user can tick "Entire inventory" in good faith while having counted only a subset — e.g. because "inventory" is read as *the inventory I am responsible for* rather than *all accountable property*.
- **INCONCLUSIVE** — the finding turns out not to involve a scoped count. Recorded as a further Break 2 recurrence, not as a result.

### 5f. A negative outcome also resolves Break 2

If 15 documents are examined and **zero** qualifying partial-scope findings appear, that is a result, not another failure:

> The P3 scope field addresses a case that is rare even in the population most likely to contain it.

That bears directly on whether the field earns its space on a page — which is the underlying product question. **Break 2 would then be closable as "tested, case rare," rather than carried forward indefinitely as untested.**

---

## 6. What this test does not do

- No prevalence claim, in any direction.
- No contribution to the 30-finding discovery stop.
- No bearing on the failure-shape taxonomy or on the class-as-attribute hypothesis.
- No jurisdiction contacted — public records only, outreach gate untouched.
- No change to P3 or any other field. **If the test fails, the fix is a separate decision at a run boundary**, per #119.

---

## 6a. SOURCE VERIFICATION — completed 2026-08-13, before any rule was stated

Every claim below was tested directly. No sample document was opened.

| Route | Status | What it gives | Blocker |
|---|---|---|---|
| **`api.fac.gov`** | **403 Forbidden** | `findings` endpoint with **`type_requirement`** (compliance requirement code) + **`findings_text`** — the clean deterministic route | **Requires a Data.gov API key. Free, but an email signup = account creation.** Charter requires a full stop here. **I have not created one.** |
| **Public search UI** `app.fac.gov/dissemination/search/` | 200, reachable | Filters: audit year · state · entity type · entity name · UEI/EIN · report ID · date range · FY-end month · free-text query | **Not scriptable via GET** — identical byte count returned with query params, so it is POST/CSRF/JS-driven. **Critically: no compliance-requirement filter exists in the UI at all.** |
| **Daily findings workbooks** `fac.gov/assets/findings/YYYY-MM-DD-findings.xlsx` | **200, key-free** | 22 columns: `report_id`, `auditee_name`, `uei`, `award_reference`, `reference_number`, `aln`, `federal_program_name`, `amount_expended`, and booleans (`is_material_weakness`, `is_significant_deficiency`, `is_questioned_costs`, `is_repeat_finding`…). Sheets split by federal agency ALN prefix. | **No compliance requirement. No finding text.** |
| **Report PDFs** `app.fac.gov/dissemination/report/pdf/{report_id}` | **200, key-free, application/pdf** | Full single audit including Schedule of Findings and Questioned Costs | none |
| **Summary pages** `app.fac.gov/dissemination/summary/{report_id}` | 200, key-free HTML | Finding *counts* only ("Findings: 3, Findings text: 3") | Does not expose compliance requirement or finding text |

### The design problem this creates

**Without the API, the population cannot be pre-filtered to Equipment and Real Property Management.** An unfiltered national sample of 20 single audits is dominated by findings on eligibility, reporting, allowable costs and procurement.

**A zero result from an unfiltered 20 would therefore measure the base rate of equipment findings in single audits — not the P3 scope field.** That directly conflicts with the instruction that a zero result should meaningfully *narrow* Break 2. A diluted zero narrows nothing.

## 6b. Three candidate rules

**Option A — API key (requires founder authorisation; account creation).**
Free Data.gov key → `findings` filtered on the Equipment and Real Property Management `type_requirement`, ordered deterministically, take 20; pull `findings_text` for each. **The only route where a zero result genuinely narrows Break 2**, because every document in the sample would be an equipment finding by construction.

**Option B — key-free, predefined 20, diluted.**
Enumerate `report_id`s from daily findings workbooks over a fixed date range, sort deterministically by `report_id`, take the first 20, open each PDF, search the Schedule of Findings for physical-inventory language. **Fully key-free and predefined — but expected qualifying yield is low, and a zero result would be weak evidence.**

**Option C — key-free, targeted screen.**
Same enumeration, but define the 20 as *20 documents containing an equipment or physical-inventory finding*, screening as many PDFs as needed to reach 20. **Preserves informativeness but breaks "predefined 20"** — the screened pool becomes unbounded unless a cap is set.

**Recommendation: Option A if a free Data.gov API key is authorised; otherwise Option C with an explicit screening cap (e.g. stop at 20 qualifying or 120 screened, whichever first).**

## 6c. One ambiguity to resolve before results are written

The locked instruction reads: *"A positive result means Break 2 survived a real attempt to break it."*

Under the verbatim definition, Break 2 is the claim **"the P3 scope field remains untested against real data."** On that reading, *finding* qualifying instances **falsifies** Break 2 rather than letting it survive — Break 2 would survive only on a zero result.

Three outcomes need unambiguous labels before any are recorded:

1. **Qualifying instances found, and a truthful P3 forces the scope limitation onto the page** → field works, and Break 2 is resolved.
2. **Qualifying instances found, and P3 can be completed truthfully while the gap stays invisible** → field fails; Break 2 resolved but the prototype needs a fix.
3. **Zero qualifying instances in the predefined sample** → recorded as *"no qualifying instance found in the predefined 20-document sample"*; **narrows Break 2, does not close it** (per the locked instruction).

Confirming which of 1 or 2 the phrase "positive result" denotes — before results exist — prevents the outcome being labelled after the fact.

## 7. Awaiting confirmation

Not starting until the design is confirmed against the verbatim definition in §1. The specific points worth checking before I begin:

1. Whether abandoning blind sampling for this one targeted test is acceptable, given §5a's containment.
2. Whether leaving Georgia is acceptable — I believe Break 2 cannot be resolved inside a Georgia county-audit population, but that is a judgement worth your check.
3. Whether 3 qualifying / 15 examined is the right bound.
4. Whether the negative outcome in §5f should count as closing Break 2, or only as narrowing it.
