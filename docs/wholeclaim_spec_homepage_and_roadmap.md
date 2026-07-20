# WholeClaim — Product Spec
## Homepage v2 (approved) + Mission Roadmap

Prepared July 19, 2026 · Status: Homepage design approved by founder; roadmap reconciled with Product Roadmap & Feature Strategy doc

---

# Part 0 — Why This Product Exists (read first)

The founder's own claim opened at $40,000 and closed past $125,000 — through documented supplements, not negotiation. Every letter drafted personally, every deadline tracked by hand, every photo logged. Nobody handed him a system, so he built one under pressure. WholeClaim is that system, handed to the next homeowner on day one.

**The filter for every feature:** does this make the homeowner more *capable*, or more *dependent*? Capability is the lane. WholeClaim organizes; it never argues, values, predicts, or negotiates. The file does the talking.

**Positioning line:** WholeClaim is the organized evidence system homeowners and professionals use before, during, and after a property claim.

**Core message:** Your claim. Organized from day one.

---

# Part 1 — Homepage v2 Specification (APPROVED)

Reference implementation: `wholeclaim_homepage_mockup.html` (approved by founder). Build to match.

## 1.1 Design tokens

| Token | Value | Use |
|---|---|---|
| Paper | `#F2F0EB` | Page background |
| Paper-deep | `#EAE7DF` | Alternate section background |
| Ink | `#14201A` | Primary text |
| Ink-soft | `#43514A` | Secondary text |
| Pine | `#1E4636` | Primary buttons, links, accents |
| Pine-deep | `#153528` | Button hover |
| Sage | `#E3E9E2` | Badges, soft fills |
| Line | `#D8D3C6` | Borders, dividers |
| Stamp | `#8A2F23` | SAMPLE stamp only |

Type: **Bricolage Grotesque** (display/headings), **Public Sans** (body), **IBM Plex Mono** (labels, dates, ledger entries, eyebrows). Mono labels are tracked-out uppercase — this extends the existing shipped "CLAIM GRADE" vernacular.

## 1.2 Page structure (top to bottom)

**Header (sticky):** WholeClaim wordmark · "Log in" link · pill "Help" button. Help is persistent everywhere.

**Hero:**
- Eyebrow (mono caps): `The insurance claim workspace for homeowners`
- H1: `Your claim. Organized from day one.`
- Sub: `Store photos, documents, timelines, and conversations in one secure claim file.`
- Primary button: `Start Free Claim Binder`
- Secondary button: `Check Your Claim Grade`
- Below: `Already have an account? Log in`

**How WholeClaim Works** — four numbered steps in a ruled grid:
1. Create your claim — Add property details and claim information.
2. Upload your evidence — Photos, receipts, invoices, estimates, conversations.
3. Build your timeline — Keep every important event organized.
4. Share your claim file — Give contractors, adjusters, or professionals one organized record.

**Features grid (Free-first):** eyebrow `WHAT YOU GET` · H2 `Built around the free experience` · six cards, each with mono kicker + badge + title + description. Cards 1–5 badged `FREE`; card 6 badged `PLANNED` with muted styling:
1. Claim Grade — "Know where your claim file stands" — "Get a quick assessment of your documentation and see what areas you can organize next."
2. Claim Binder — "Everything in one organized place" — "Keep photos, documents, receipts, notes, and important claim details together."
3. Evidence Vault — "Store your documentation securely" — "Upload and organize important files, photos, and records related to your claim."
4. Timeline — "Track every important moment" — "Create a clear record of events, updates, and documentation as your claim progresses."
5. Guided Organization — "Know what to add next" — "Follow a simple workflow that helps you build a more complete claim file."
6. Sharing (planned) — "Share your organized claim file" — "Future feature for securely sharing claim information with approved recipients."

**Claim File preview (signature element):** rendered as a physical file — folder tab reading `EXAMPLE CLAIM FILE`, diagonal red `SAMPLE` stamp overlay, and:
- Title: Water Damage · Status badge: `STATUS · DOCUMENTATION STARTED`
- Grade box (bordered square, matches live Claim Grade motif): `B+`
- Stats: 47 Photos · 6 Documents · 3 Receipts
- Ledger (`TIMELINE · 12 EVENTS ADDED`) in the app's real entry format:
  - `PHOTO — Kitchen ceiling, 6 images — 2026-07-15`
  - `EMAIL — Adjuster follow-up sent — 2026-07-14`
  - `CALL — Plumber estimate received — 2026-07-12`
- Caption: `Sample data shown for illustration. Your file starts empty — and fills fast.`

**Compliance requirement:** the SAMPLE stamp + caption are mandatory. No fake numbers may appear unlabeled anywhere on the site (Founder Decision Log invariant).

**What do I need to start?** — six check items (Photos & videos · Repair estimates · Receipts · Emails & text messages · Contractor invoices · Inspection reports) plus reassurance line: *Don't have everything? **Start with what you have.***

**Trust band (pine background):** four items with line icons —
- Secure evidence storage — Photos and PDFs stored privately; only you can view them.
- Organized documentation — Every file, receipt, and note in one structured place.
- Timeline tracking — Dates, calls, and events logged as they happen.
- Export anytime — Your claim file belongs to you.

Disclaimer (mono, in-band): `WholeClaim helps organize claim documentation. It is an educational tool — not legal, insurance, or financial advice, and it does not guarantee insurance outcomes.`

**Account preview** — three menu cards:
- My Account: Profile · Subscription · Security · Export my data · Delete account
- My Claims: Active claims · Completed claims · Shared files
- Support: Help Center · FAQs · Contact support · Report a problem

**Final CTA:** eyebrow `START HERE` · H2 `Build your claim file before you need it.` · both CTA buttons (secondary reads `Take the 60-Second Claim Grade`).

**Footer:** wordmark · getwholeclaim.com · disclaimer · ©.

**Mobile bottom nav (fixed, <600px):** Home · My Claims · Evidence · Profile · Help.

## 1.3 Language rules (sitewide, non-negotiable)

Never use: "get your claim approved" · "maximize your payout" · "beat insurance companies" · "chain of custody" · "guaranteed acceptance" · any implied settlement outcome.

Always: outcomes framed as documentation quality; Success Guarantee references WholeClaim's own Claim Grade only; sample data labeled; "Verified Evidence History" (not blockchain/custody language).

**Paid-feature gate (governing rule):** Free features ship active. All Pro/paid features remain labeled "Planned" across the product and site — and nothing is charged for — until attorney review approves pricing, billing, and paid-feature terms. No exceptions.

---

# Part 2 — Roadmap (reconciled)

Base: founder's Product Roadmap & Feature Strategy doc. Changes made here: **Supplement Assistant restored** (it is the origin story and was dropped), communication templates and expanded deadline tracking added, Claim Package Builder promoted (it is already a Pro-tier promise: "full binder export"). Everything else preserved.

## Phase A — Launch Foundation
1. **Actionable Claim Grade** (highest priority) — grade + specific improvement checklist. This *is* the Success Guarantee mechanism: guarantee is tied to WholeClaim's own grade improving, never to insurance outcomes.
2. **Guided first-steps mode** — new claim opens to the first-48-hours checklist (photograph before moving anything, keep damaged materials, save receipts, document mitigation with before/after + invoices). Matches the "right-after-damage" GTM search moment.
3. **Deadline tracker (expanded)** — user-entered dates only: carrier response windows, proof-of-loss dates, follow-ups. WholeClaim tracks dates the user provides; it never states what the law requires.
4. **Claim Package Builder** — export the full Binder as one professional PDF: timeline, evidence index, correspondence log. The literal artifact that won the founder's claim; also the future attorney/professional handoff format.

## Phase B — Trust & Sharing
5. **Secure Share Links** — view-only / download / expiration controls. Referral loop: Homeowner → Contractor → new user.
6. **Verified Evidence History** — upload timestamp, file fingerprint (SHA-256), original preserved, activity log. Marketing language: "Know when your documentation was added." Nothing about legal admissibility.

## Phase C — The Supplement Layer (origin story — RESTORED)
7. **Supplement Assistant** — document what the initial payment covered, what it missed, and the evidence supporting the gap. Organization-lane only.
8. **Communication templates** — one tap from a Binder call log to a drafted "confirming our conversation today" email. Productizes the founder's own discipline; delivers the "professional claim letters in minutes" brand promise.
9. **ACV/RCV + recoverable depreciation tracker** — user logs holdbacks and completion proof so depreciation isn't forfeited. (Carried from original Phase 1 homeowner tools.)
10. **Estimate organization** — store carrier vs. independent estimates side by side; "missing scope" framing per the Scope Intelligence plan (parser/benchmarking remain V2+ per that doc).

## Phase D — AI Documentation Intelligence
11. **AI Photo Organization** — dedupe, group by room, suggest descriptions (`IMG_4829.jpg` → `Kitchen — lower cabinet water damage`). Deliberately gated: at ~$0.02–0.03/call, a 47-photo batch exceeds the free tier's 3-analyses cap — this is the conversion moment for the $49 claim unlock / $19 Pro.
12. **Smart Timeline Builder** — assembles photos, docs, notes, invoices into one dated timeline. The payoff layer #11 feeds.
13. **AI Claim Assistant** — summarizes what's uploaded, flags missing documentation categories, suggests questions to ask contractors/adjusters. Explains, never decides (deterministic-scoring invariant).

## Phase E — V2
14. **Voice-to-Claim Notes** — mic → structured timeline entry. Interim: quick text notes + AI cleanup.
15. **Contractor Workspace** — client folders, direct photo/estimate/invoice upload, documentation requests. Neutral tool; no A&K routing (Georgia conflict rules). Maps to Contractor Pro $79/mo tier.
16. **Consumer capability education (Knowledge Library, owner-approved):**
    - Claim-history awareness — how to pull your own CLUE report and loss runs (an FCRA consumer right).
    - Non-renewal transition checklist — key dates + a coverage-comparison worksheet the user fills in.
    - DOI complaint process — knowing the option exists is capability, not advice.

## Long-Term
17. **Property Digital Twin** — pre-loss home record (roof year, HVAC, renovations, shutoff locations, documents). *This is the retention thesis*: it converts WholeClaim from an emergency purchase into "I keep it because it protects my home's history." Also the only feature that literally fulfills the hero line "Build your claim file before you need it." Pairs with a **rating-accuracy checklist** (verify dec-page roof year / square footage / construction against reality — the founder personally recovered $1,235 from exactly this kind of carrier data error).
18. **Scope Intelligence Network** — per existing standalone spec (parser → comparison → benchmarking; carrier identity excluded from the data model; consent visible in upload flow).

---

# Part 3 — Guardrails Summary (applies to everything above)

WholeClaim never: values a claim, predicts a settlement, rates a carrier, negotiates, recommends a specific contractor (including A&K), gives legal advice, or promises insurance outcomes. The user enters the facts. WholeClaim organizes them. The file does the talking.

Priority note: nothing in Phases B–E starts before the free Claim Grade + Binder is validated live (existing founder rule). Billing (Stripe, entitlements, refund flow) remains a separate prerequisite build.
