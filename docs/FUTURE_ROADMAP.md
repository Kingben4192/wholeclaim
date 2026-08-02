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

---

## 2026-07-28 — Renovation Grade + pre-loss-to-claim transfer (PARKED)

**Concept.** Renovation Grade for pre-loss home documentation. Helps
homeowners maintain complete renovation records before any insurance
claim exists. If a loss later occurs, selected documentation can be
associated with the resulting claim.

**Why it's interesting.** Reaches homeowners at a non-episodic moment
(new purchase, active remodel) rather than waiting for a disaster, and
the transfer path is the property-vault retention thesis running in
reverse — vault as acquisition, claim as the event.

**Scoring constraint (hard).** Measures documentation completeness only.
Does NOT evaluate construction quality, code compliance, workmanship, or
predict claim outcomes. Code-compliance assessment is licensed-inspector
territory in Georgia and is out of scope permanently, not just for v1.

**Capability constraint.** No vision or OCR exists anywhere in the
product — buildClaimContext passes labels and metadata only, never file
contents. Any photo-grading variant of this concept requires a vision
build first and must be costed as such. A defensible middle version
exists if vision is ever added: grade the photo's usefulness as evidence
(focus, wide + detail shot, date, scale reference) without judging the
work depicted.

**Scoring-system boundary.** This would be a FOURTH scoring system
alongside WholeClaim Documentation Score, Claim Grade, and Readiness
Score/Band. Decision #59 exists specifically to keep those separated.
Any build must resolve which of the existing systems this reuses versus
introduces new, before a single string is written.

**Open design questions — all must be answered before build:**
1. What entity owns renovation records? Claims are temporary events;
renovations are long-lived property records. They do not naturally
belong to the same object.
2. How do storage quotas and pricing work? Current limits are
deliberately claim-scoped (500MB/claim free, 25 active files/claim,
2GB account ceiling — Decisions #51-55). Permanent pre-claim records
break that accounting and change the free-tier cost profile.
3. How does transfer into a claim behave? Copy or move? Does transferred
documentation re-score under the claim engine? Does it count against
the 25-file cap on arrival? What happens if a free user is blocked
mid-transfer?
4. What new security, legal, export, and deletion requirements does a
new top-level object introduce? New RLS surface, new authorization
rules, new privacy and legal copy, new deletion semantics.

**Sequencing.** Strictly after Phase 1 founder beta. Trigger to revisit:
beta users independently asking to organize records before a claim
exists, OR renovation/maintenance content pillars measurably
outperforming claims content. Absent either, it stays parked.

---

## 2026-07-29 — Lease Decoder (PARKED)

**Concept.** Future counterpart to Policy Decoder — same AI
infrastructure, different guardrails/UX. Distinct from the renter
documentation workflow, which records facts (move-in condition,
maintenance requests, communications, photos/video, receipts). Lease
Decoder translates lease language into plain English.

**Design law — descriptive, not prescriptive:**

✅ "This clause says the tenant must notify the landlord in writing
within 7 days."
✅ "This appears to be a late-fee provision."
✅ "This clause discusses responsibility for water damage."
❌ "You should sue."
❌ "This clause is unenforceable."
❌ "You can legally withhold rent."
❌ "Your landlord violated Georgia law."

**Four layers:**

1. **Plain-English Summary** — explain each lease section.
2. **Clause Finder** — surface every paragraph matching a topic (pets,
   maintenance, fees, water damage, mold, entry rights, security
   deposits).
3. **Risk Highlights** — flag unusual/noteworthy provisions (mandatory
   arbitration, automatic renewal, high late fees, broad
   indemnification) as noteworthy only, never enforceability
   judgments. **HARD BINDING REQUIRED** — same tier as Decision
   Assistant / Letter Builder (explicit NEVER list in system prompt +
   output-side keyword filter returning a safe fallback and logging
   the flag), not the soft binding Policy Decoder currently has. This
   is the only layer making a judgment call rather than pointing at
   existing text — concentrated UPL risk lives here.
4. **Issue Linking** — a logged maintenance issue points to the
   relevant lease section, no action advice. This layer is the
   differentiator: layers 1-3 could be replicated by any generic AI
   chatbot pasted a lease, but only a platform already holding the
   renter's maintenance log and timeline can link a live issue to its
   governing clause. Do not treat as low-priority polish relative to
   the other three layers.

**Sequencing.** Post-homeowner-MVP, deliberately not labeled with a
phase number since Phase 2/3 already mean Contractor/Public Adjuster in
the pricing ladder. Legal counsel must review implementation +
disclaimers before launch (same UPL family as Anna question #2 on AI
claim letters).

---

## 2026-08-01 — Claim Grade A-Action-Center (audit) (PARKED, pieces vary)

Source: founder audit request covering the full A-Action-Center concept.
Two pieces were approved to build separately (Annual Claim Health Check,
PDF-only claim binder export) and are not part of this parked entry. This
covers everything else from that audit.

### Document Vault, Home Inventory, Disaster Preparedness (storage-dependent pieces)

**Real blocker, corrected from how it was originally framed.** The
storage model (Decision #55) is confirmed claim-scoped: 500MB/claim,
2GB/account ceiling — no account-level "vault" allocation exists.
Enforcement itself (Decision #88) is **not** an open blocker — it shipped
and has been live in production since 2026-07-31 (Decision #89,
`supabase/migrations/0027_storage_enforcement.sql`). The actual blocker
is architectural, not a pending to-do: nothing in this schema represents
storage that persists independent of a specific claim. Document Vault,
Home Inventory, and any Disaster Prep piece needing standalone document
storage all require the same new concept — an account-level storage
object with no claim to belong to — which doesn't exist yet and hasn't
been decided, not just unbuilt. Building any of these on the current
model would mean either awkwardly attaching everything to a placeholder
claim, or introducing a second storage allocation with its own limits,
pricing implications, and RLS surface. That's a real design decision, not
a build task, and belongs in that form when this is revisited.

### Policy Review Checklist (AI coverage-gap detection, endorsement suggestions)

Same public-adjusting/UPL question already queued for Anna's legal
review — not a new legal question, and a disclaimer does not resolve it
(same standing rule as every other AI-advice-adjacent feature in this
product). Not built until her opinion lands.

### Everything else — no blockers, not urgent

Claim Health Monitoring reminders, Coverage Change Tracker, Maintenance
Timeline, and the remaining Disaster Preparedness items (the ones that
don't need standalone storage) have no identified blocker. Parked purely
on priority, not on a dependency.

### Per-claim-scoped export variant

Surfaced while scoping the claim binder PDF (below): the existing
account-wide "Export Everything" ZIP (`/api/account/export`) has no
per-claim equivalent — no way to export just one claim's own raw files
without pulling the entire account. Distinct from the PDF binder itself
(an organized index/cover document) — this would be a scoped variant of
the existing raw-file export, not a new format. Not built now.

**Revisit trigger for the whole A-Action-Center.** After Stripe goes live
AND Anna's clearance lands — both conditions, not either alone. The
storage-dependent pieces above have an additional, separate precondition
(the account-level vault architecture decision) on top of that.

**Explicitly not covered here:** the "always-on home documentation
platform" pivot this audit surfaced. That changes ICP, GTM story, and
pricing SKUs — it's a business-model decision, not sequenced feature
work, and belongs in a dedicated strategy conversation post-launch, not
folded into this engineering backlog.

---

## WholeClaim for Renters (Renter Mode) — PARKED, post-homeowner-MVP
Parked: 2026-08-02 | Source: founder concept doc + competitive scan (unverified)

Concept: renter-focused evidence platform on the shared core (vault,
timeline, deadlines, scoring, AI letters). Outcome shifts from claim
maximization to deposit recovery, lease enforcement, maintenance
documentation, and renters-insurance claims.

Candidate modules: move-in condition report; maintenance tracker; deposit
protection / move-out package; communication vault; property inventory;
renters-insurance policy explainer; Renter Claim Grade; deadline tracker;
AI letter builder; evidence timeline; lease decoder (already parked as its
own entry — renter mode inherits those constraints; do not duplicate scope).

Hard constraints (binding if ever activated):
1. Sequencing — no activation before the homeowner-MVP condition in the
   Activation trigger below is met and Lease Decoder's own gates are
   cleared. Lease Decoder is a dependency, not a build.
2. UPL — renter mode carries HIGHER unauthorized-practice risk than
   homeowner mode: eviction/dispute "defense," lease interpretation,
   deposit-dispute letters under GA landlord-tenant law. No activation
   without written counsel review (new question for Anna; not added to the
   current four).
3. Scoring — Renter Claim Grade forks the Documentation Score engine and
   category caps; requires its own spec freeze (equivalent of Decision #66
   — verify number) before any build.
4. EXCLUDED: "Apartment History" crowdsourced property-issue database.
   Rejected as a WholeClaim feature — defamation/trade-libel exposure,
   verification/moderation burden, cold-start network effects, occupied
   lane.
5. Economics gate — validate renter willingness-to-pay before build;
   deposit stakes (~$1.5–3K) vs. homeowner claim stakes; incumbents
   monetize landlords/PMs, not renters.
6. Competitive table in source doc is unverified — re-run competitor scan
   at activation; do not cite MoveProof / DwellFile / Renter's Vault
   externally without confirmation.

Activation trigger: founder directive only, after the homeowner MVP has
demonstrated sustained paying revenue — the specific threshold met is
logged in Decisions.md at activation — and written counsel review is
complete.
