# BRAND_VOICE.md

> **Note on how this file came to exist:** a full BRAND_VOICE.md was
> requested earlier in the WholeClaim build (a constraint doc covering the
> A&K Construction exclusion and no-outcome-promise rules), but the base
> document's content was never actually delivered/pasted — confirmed
> absent from the repo before this file was created. What follows is
> exactly the 2026-07-27 addendum content (Founding Story and AI Tool
> Prompt Binding) and nothing else. This is **not** a complete brand
> voice document — if/when the original base content is provided, it
> should be merged in above these two sections, not treated as
> superseded by them.

---

## Founding Story — Approved Language

**The story:** In 2021, a tree fell through Benjamin's home. Drawing on hands-on construction and contracting experience, he documented the loss to a standard the carrier's initial adjuster hadn't — every repair itemized, every loss substantiated. The initial settlement offer was $40,000. The final settlement was $125,000. This is WholeClaim's founder-market-fit story: the product exists because thorough documentation measurably changed the outcome of his own claim.

**Rules — apply to marketing copy, investor materials, and any AI-generated content referencing this story:**

1. **Never name the carrier.** A separate matter involving the same carrier relationship is currently in active litigation (Grange Mutual, pending). Whether or not it's the exact same claim, naming the carrier anywhere creates identification risk for that matter. Treat the carrier as unnamed in all public material until active litigation is fully resolved.
2. **Always pair the numbers with a disclaimer** wherever they appear: *"Individual results vary. This reflects one homeowner's experience and is not a guarantee of any outcome."*
3. **Never imply the result is typical or replicable.** No "homeowners typically see," no "on average," no extrapolating from a single data point.
4. **Don't add detail beyond what's approved here** — a tree fell through the house, 2021, $40K→$125K. No carrier, policy number, address, or county without separate sign-off.

This sits alongside — not instead of — the standing rule that the founder's active personal litigation (Grange, DWM) is never referenced in marketing copy. That rule covers *mentioning the litigation itself*; this one covers *naming the carrier in an unrelated historical story*. Both apply at once.

---

## AI Tool Prompt Binding

Not uniform across all five tools — risk varies by what each tool actually outputs.

### Tier 1 — Hard binding: Decision Assistant, Letter Builder

These two most resemble legal or public-adjuster advice if they slip. Two layers.

**System prompt — appended to both tools' existing prompts** (`NEVER_LIST`, `src/lib/anthropic/prompts.ts`):

```
NEVER:
- State or imply what a carrier owes, will pay, or is required to pay
- Recommend or imply the user should pursue litigation, legal action, or hire an
  attorney (a neutral "you may want to consult an attorney about this" is
  acceptable only when directly on-topic for a coverage question — never proactive)
- Draft language that reads as a formal legal demand, threat, or attorney
  correspondence
- Assert that a document, photo, or piece of evidence "proves," "confirms," or
  "establishes" fault, cause of damage, or liability
- State or imply that following these recommendations increases the likelihood
  of approval, faster payment, or a larger settlement
- Cite insurance law, statutes, or legal standards as if giving legal advice
- Reference any specific carrier by name
```

**Output-side filter** (`src/lib/anthropic/outputFilter.ts`) — scans the response before it reaches the user. On a match, returns a generic safe fallback plus the universal disclaimer, and logs the flagged output for review (server-side, plus `ai_runs` retains the unfiltered original for traceability per Decision #26). Does not silently edit the response for a hard match — a quietly removed sentence can leave the rest making a claim it no longer supports. One deliberate exception: `you should sue`/`get a lawyer` are softened via a narrow, targeted phrase substitution rather than a full-response block, since discarding an otherwise-fine response over one fixable phrase is worse than a precise, logged substitution of just that phrase.

Starter pattern list (expand once real beta output shows what actually slips through):
`will be approved` / `will approve` · `guaranteed to` · `you will receive $` / `you are owed $` / `you're entitled to $` · `your claim will` + any outcome word · `this proves` / `this is fraud` / `bad faith` · `you should sue` / `get a lawyer` (soften, don't outright ban — rewrite to the neutral form above)

### Tier 2 — Soft binding: Policy Decoder, Loss-Count Auditor

Same `NEVER_LIST` in the system prompt. No output-side filter yet — lower risk surface. Revisit if beta usage surfaces a real miss.

### Already handled: Estimate Gap Analyzer

Shipped guardrail line stands as-is: *"Paste or describe the carrier's estimate here. The analyzer reads only what you enter — not uploaded files."*

### Not addressed by this pass

Mold Coverage Timeline and Supplement Assistant are not named in this addendum and were not touched — their prompts already carry their own domain-specific guardrail language (see `src/lib/anthropic/prompts.ts`), but neither the shared `NEVER_LIST` nor the output filter has been applied to them. Worth a deliberate decision later, not assumed.

### Universal — every AI tool, every response

One canonical disclaimer string, not five paraphrases (`UNIVERSAL_DISCLAIMER`, `src/lib/anthropic/outputFilter.ts`, rendered via `AIToolCard.tsx` — the shared shell every AI tool card uses):

> "WholeClaim helps organize documentation. It does not provide insurance advice, guarantee claim approval, or determine claim outcomes."

This is the same string already used as `/help`'s own `DISCLAIMER` constant — unified to one source, not a new third variant. Two other pre-existing disclaimer strings remain deliberately untouched, since they're outside this addendum's named scope (not AI tools): `DepreciationCalculator.tsx` and `LossOfUseTracker.tsx` (deterministic, non-AI features, own contextually-appropriate wording), and the grader results email (`grade/actions.ts`) and drip-tip emails (`tips/copy.ts`) (the public Claim Grade quiz, a separate system per Decision #59, not one of the five AI analysis tools). The standalone `/ai-disclaimer` legal page also keeps its own longer-form wording — a full legal explainer, not the per-response inline disclaimer this section governs.

---

## Pre-Publish Check

Run against every piece of external-facing copy before it goes out — marketing materials, partner/contractor sheets, investor materials, social posts, anything leaving the building. Six yes/no questions:

1. Does this promise or imply an insurance outcome, approval, or payout?
2. Does this frame WholeClaim or its output as legal advice or public adjusting (negotiating, representing, or advising on pressing a claim)?
3. Does this claim a capability that isn't built yet?
4. Does this recommend, rank, or refer any contractor, including A&K?
5. Does this reference the founding story or Benjamin's litigation in a way that breaks carrier anonymity or violates the four founding-story rules above?
6. Does this use a trademark symbol before clearance is confirmed?

**Any "yes" answer means don't publish until fixed.**
