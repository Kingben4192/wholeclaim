# Instrument — Dual Root-Cause Classification: Proposal

**Status:** Proposal only. **The frozen field set has not been touched.** Nothing changed in either run record.
**Question:** can the root-cause field support dual classification (R4+R5) without losing the auditability that made Run 02 trustworthy?

---

## 1. First: the example that prompted this is probably a mis-code of mine

Before designing a mechanism, the case it was derived from needs re-reading.

Entry 11's source text, verbatim:

> "The equipment stolen during the theft included approximately 250 obsolete water meters that were **surplus and were waiting to be properly disposed**. The water meters were located in a warehouse that **lacked the use of a security system** and required minimal access control with only a key for entry."

**R5 is defined as "disposal record failure — item leaves without a closing record."** The Fulton memo does not state that any disposal record was missing, late, or defective. It states the meters *were waiting to be properly disposed* — which describes a **lifecycle state**, and arguably a correct-if-slow process, not a failure.

**I coded R5 from context rather than from evidence.** The source supports **R4 only**. My "R5 adjacency" note in Run 02 is a small instance of exactly the stretch Break 1 warns about — a finder wanting the data to be useful, reaching one step past what the document says.

**This is recorded rather than quietly corrected**, consistent with how the runs have been handled. Run 02's entry 11 should be re-examined under whatever mechanism is adopted; I have not edited it.

**Consequence for the question asked:** entry 11 is weak evidence for dual classification. It may be zero evidence for it.

---

## 2. But dual classification is still genuinely needed — here is the real proof case

From the verified NYC set, the Manhattan Borough President's Office finding states **four distinct failures in a single finding**:

> "did not maintain a complete inventory listing" → **R1**
> "did not perform periodic inventory counts" → **R3**
> "did not immediately tag equipment when received" → **R1** (timing variant)
> "did not store unissued equipment in a secured area" → **R4**

Each is separately stated in the source. Each has its own quotable span. **None requires inference.** A singular root-cause field forces a finder to discard three of four evidenced failures.

So the need is real. It was simply demonstrated by the wrong example.

---

## 3. What actually made Run 02 trustworthy

Naming this precisely, because any mechanism must preserve it:

1. Finding text entered **verbatim**, never paraphrased.
2. The false-positive candidate **excluded on retrieved evidence**, not assumption.
3. Titles considered-and-skipped **recorded**, so exclusions are auditable.
4. Breaks **recorded, not fixed** mid-run.
5. Every field either populated from source or marked `—` **with a stated reason**.

The property underneath all five: **every cell traces to specific source text, and every judgment call is visible as a judgment call.**

**The threat from multi-coding is specific.** Allowing a finder to assign two codes doubles the surface for unfalsifiable judgment — and this dataset's entire purpose is to establish that a real problem exists. Generosity in coding is precisely what manufactures a false positive. Break 1 already identified the failure mode ("segregation of duties superficially resembles R4"); a multi-value field makes that stretch easier to smuggle in, not harder, because a weak second code looks like thoroughness.

---

## 4. Options considered

**A — Primary + Secondary code fields.** Rejected. "Secondary" is undefined: weaker evidence, or a second distinct failure? The ambiguity is where stretch lives. It also invites a finder to fill the second slot because it exists.

**B — Multi-value code set, unordered.** Rejected. Breaks tallying, and directly maximises the Break 1 mis-entry surface. A row with three codes and one quoted span is indistinguishable from a row with three codes and three spans.

**C — Decompose the finding into one row per failure.** *(Recommended, part 1.)* Keep the root-cause field **singular and unchanged**. A finding containing multiple evidenced failures becomes multiple rows, each carrying its own quoted span and its own single code, linked by a parent finding ID. MBPO becomes four rows; Fulton entry 11 stays one row.

**D — Separate `Asset lifecycle state` field.** *(Recommended, part 2.)* Captures what I wrongly coded as R5: in service / in transfer / in storage / surplus awaiting disposal / disposed / unknown. This records *the state that made the failure consequential* without pretending it was a second failure. Entry 11 becomes R4 + lifecycle state "surplus awaiting disposal" — which is what the source actually supports, and arguably the more product-relevant fact.

---

## 5. Recommendation

**Adopt C and D together. Do not adopt multi-value root-cause fields.**

The governing invariant becomes:

> **One row = one failure = one root-cause code = one quoted evidence span.**

Multi-value fields break that invariant. Decomposition preserves it — and strengthens it, because the unit of analysis shifts from "one finding" (an editorial artifact of how an auditor chose to write) to "one failure" (the thing actually being counted).

**Guard rails, required, not optional:**

1. **Every coded row must carry a verbatim span** from the source justifying its code. No span, no code. This is the single most important guard — it converts coding from judgment into citation.
2. **Decomposition must be conservative.** Split only where the source states separate failures in separate clauses. Do not split on inference. A finder unsure whether text describes one failure or two records **one** row and flags it.
3. **Lifecycle state is never a substitute for a root cause.** If the only thing recorded is a state, the row has no failure and should not be coded at all.
4. **Re-examine entry 11 under the new rule** before any further coding, and record the outcome as a correction rather than an edit.

**Two fields would need to be added** — `Parent finding ID` and `Evidence span`, plus `Asset lifecycle state` from D. **That is a field-set change and I have not made it.** It requires unfreezing, which is your call and should probably wait for a run boundary rather than happening mid-stream.

---

## 6. Consequence you should decide on: what the stopping rule counts

**Decomposition changes what "a finding" means.** Under C, MBPO alone yields four rows from one finding. The 30-finding stopping rule currently reads ambiguously:

- **30 source findings** — decomposition doesn't affect the stop, but rows could reach 60+.
- **30 coded failure-rows** — decomposition reaches the stop roughly 2–3× sooner, on materially less source diversity.

These produce meaningfully different datasets. The second risks stopping after very few jurisdictions. **Recommend the rule count source findings, with failure-rows tracked separately** — but this is a decision, not a detail, and it should be settled before the field set is unfrozen rather than discovered at row 30.

---

## 7. What is not proposed

No change to the R1–R5 taxonomy itself. Both runs have now shown the taxonomy fits internal operational audits and does not fit external financial audits (Break 9) — **that is a scope question about which documents to sample, not a coding-mechanism question**, and it should not be solved by loosening codes.
