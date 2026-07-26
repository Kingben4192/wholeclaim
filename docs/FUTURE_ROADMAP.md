# Future Roadmap — Filed Strategy Documents

Strategy/vision documents land here as they're drafted, filed under a dated
heading, reconciled against what's already built or already parked. Filing
a document here does **not** change current MVP priority — see
`00_Founder/Roadmap.md` for the active build sequence. Nothing in this file
is a build task unless and until it's separately scoped and approved.

---

## 2026-07-26 — Feature Strategy Doc (Amazon-analogy framing)

**Source document**: not yet attached. This entry covers a feature-strategy
document the founder described as drafted — Amazon-analogy framing,
covering a Property History Record, Home Vault, a "Next Best Action"
engine, a secure evidence room, and a marketplace layer — but the document
body itself wasn't included when this entry was filed. Paste the full text
in a future session and it will be appended here under this same heading.

**This entry does NOT change current MVP priority.**

### Reconciliation — already built, do not rebuild

- **"Documentation Confidence Score"** = Claim Grade / Documentation Score,
  already shipped (50-case fixture suite, 44/44 passing at last full run —
  see `src/lib/scoring/documentationScore.fixtures.test.ts`).
- **"Next Best Action engine"** = the existing `recommendations` array
  (`src/lib/scoring/documentationScore.ts`) — `description` text already
  reaches the client (Decision #40's confidentiality boundary strips
  weights/points, not descriptions); `BeforeAfterGrade.tsx` already renders
  it under "Next steps."
- **Secure share** = already in Phase 1 scope (`00_Founder/Roadmap.md`).
- **"Communication Center"** ≈ the party registry gap already reported this
  session — `entries.contact` is a single freeform string today, not a
  structured registry. Same underlying gap, not a new feature.

### Reconciliation — already parked, written decision exists

Property Timeline, Home Vault subscription, warranty tracker, home
inventory scanner, renewal prep — all Layer 2 per existing roadmap
sequencing, held until beta signal. No change from this filing.

### New — open decision, not resolved, nothing built

**AI auto-categorization of uploads** (suggesting an evidence category at
upload time) conflicts with the free-tier limit of 3 total AI analyses per
claim (Decision #32) — auto-classifying every upload either exhausts that
allowance immediately or requires an explicit, currently-undesigned
exemption. Recorded as an open conflict. Not resolved, not implemented.

### Flagged conflicts — recorded alongside this filing

1. **Marketplace layer** (routing homeowners to contractors, public
   adjusters, or attorneys) triggers the platform's neutrality rule.
   Requires a conflict-of-interest review before it's even a roadmap item,
   not just before it ships.
2. **The source document's example stores a named adjuster.** This is the
   same party-registry privacy question already flagged for attorney
   review — identified third parties who are not WholeClaim users and
   never consented to being recorded.
3. **Strip all ™ marks on any sub-brand names in the document.** Trademark
   clearance on the primary WholeClaim mark is still in progress (Decision
   #17, Open — attorney). No sub-brands get created ahead of that
   clearing.

**No build tasks from this document. Priority order is unchanged.**
