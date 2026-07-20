> **STATUS: DRAFT COVER LETTER — fact-checked against the live codebase by
> Claude (FA-1.0) on 2026-07-19, not attorney-reviewed.** The questions
> below are unchanged from the founder's original request — no legal
> opinions have been added or answered. Everything marked **FACT-CHECK
> NOTE** is a verified technical/factual correction or open item found by
> reading the actual code, database schema, and existing legal drafts in
> `07_Legal/`. Nothing here should be read as legal advice.

---

# WholeClaim — Pre-Launch Legal Review Request

I am preparing to launch WholeClaim, a SaaS documentation platform for homeowners managing property insurance claim documentation.

The platform helps users:
- organize photos, documents, and timelines
- track claim-related information and deadlines
- analyze documents using AI-assisted tools
- create a more organized claim file

WholeClaim does not:
- act as a public adjuster
- negotiate, adjust, or settle insurance claims
- provide legal advice
- guarantee insurance claim approval, settlement amounts, coverage decisions, or insurer outcomes

> **FACT-CHECK NOTE:** all of the above matches the live product. The
> strongest evidence for the "does not" list: the AI Disclaimer page
> explicitly states every score/grade is computed by fixed deterministic
> rules, never by AI; the "Should I Hire a Public Adjuster?" tool is a
> pure tradeoff quiz explicitly labeled "never a recommendation"; no
> feature sends, files, or submits anything to an insurer on the user's
> behalf.

I am currently running the platform as a free beta and plan to enable paid features later.

> **FACT-CHECK NOTE — important nuance:** the paid checkout flow (two
> options: $19/month subscription, $49 one-time claim unlock) is **already
> fully built and wired to Stripe**, not merely planned. It lives inside
> the app (embedded in the Loss-of-Use Tracker's upgrade prompt) and was
> functionally verified against Stripe test mode earlier in this build.
> The disconnected piece is the public-facing `/pricing` page, which is an
> explicit visual-only mockup — its buttons are disabled on purpose and it
> is not linked from the live checkout path. **Confirmed directly in the
> Stripe dashboard (2026-07-19):** the account is in test mode only —
> sandbox banner visible, `sk_test_`/`pk_test_` keys in use, and the live
> account has not been activated (business onboarding was started but
> deliberately left incomplete, pending the entity-structure question in
> this same letter). No real charge is currently possible under any
> circumstance.

A separate branding decision is also pending. WholeClaim may remain the product name, or I may transition to a different brand name. I am seeking advice on entity structure and operational setup rather than trademark clearance in this review.

---

## Business Entity Structure

Please advise:
- Should WholeClaim operate through a new LLC separate from A&K Construction LLC?
- Is a standalone entity recommended given the insurance-adjacent nature of the product?
- Should the public-facing brand name differ from the legal entity name?
- Are there concerns with operating under a DBA?
- Would separating this business reduce regulatory confusion between contracting services and a documentation software platform?

> **FACT-CHECK NOTE (background, not an answer):** the existing Terms of
> Service and Privacy Policy drafts already contain this rationale,
> written during an earlier build session: *"WholeClaim has been
> deliberately built and positioned as legally and functionally separate
> from A&K Construction LLC, to avoid the appearance of a contractor
> steering or influencing insurance claims (a restricted activity under
> Georgia public adjusting law)."* Both drafts also currently use
> `[WHOLECLAIM OPERATING ENTITY]` as a literal unfilled placeholder —
> confirming this decision is genuinely still open, not just deferred in
> this letter. The drafts' working-default governing law is Georgia
> (Fulton County) — worth flagging to counsel alongside the entity
> question since the two are related.

---

## Terms of Service Review

Please review:
- disclaimers that WholeClaim is a documentation and organization tool, not a public adjuster
- AI-generated content disclaimers
- user-uploaded document ownership and usage rights
- limitation of liability provisions
- governing law and venue provisions
- account termination provisions

Please identify any language that could unintentionally imply insurance advice, claims adjustment, or representation.

> **FACT-CHECK NOTE:** a full draft already exists at
> `07_Legal/Terms-of-Service-DRAFT.md` (unpublished, unreviewed) covering
> every item above. Two things worth knowing before counsel reads it:
> (1) its liability cap ($100 / 12-months-paid, whichever is greater) and
> its governing-law/venue choice (Georgia, Fulton County, no arbitration
> clause) are both explicitly marked as placeholder "working defaults"
> pending counsel's own judgment, not considered decisions;
> (2) Section 5.4 currently describes self-service subscription
> cancellation, but **no cancellation UI exists in the product yet** —
> `/api/stripe/portal` exists on the server but nothing in the app links
> to it. That section is not yet accurate to what a user can actually do
> and needs either a UI build or a rewrite to describe the real
> (support-request) path before publishing.

---

## Privacy Policy Review

Please review:
- collection of insurance claim documents, photos, and property information
- AI processing through third-party providers
- cloud storage providers and data handling disclosures
- whether disclosures are sufficient for potentially sensitive claim documentation
- account deletion and data export provisions

> **FACT-CHECK NOTE:** a full draft exists at
> `07_Legal/Privacy-Policy-DRAFT.md`. Confirmed accurate: account deletion
> and data export are real, functional, fully self-serve features (no
> support ticket required) — I read the actual route code for both.
> Confirmed present: a third-party disclosure list covering Supabase,
> Stripe, Vercel, Anthropic, and Resend, each with the specific data each
> one touches. One open, unverified claim: Section 4 states Anthropic
> "does not use it to train its models by default under standard API
> usage" — this was written as a placeholder assumption and explicitly
> flagged in the draft itself as needing confirmation against Anthropic's
> actual current API terms. Neither I nor the draft's author verified
> this against Anthropic's current commercial terms — please have counsel
> (or the founder directly) confirm this before it's asserted publicly.
> Separately confirmed: no analytics, tracking, or aggregated/anonymized
> data usage exists anywhere in the current codebase — the Cookie Notice
> page states this outright and a full-codebase search found nothing to
> contradict it.

---

## Refund Policy and Success Guarantee

This is the highest priority item.

WholeClaim includes a planned Success Guarantee feature.

The guarantee is based only on:
- WholeClaim's internal documentation score ("Claim Grade")
- completion of a defined documentation checklist

It does not guarantee:
- insurance claim approval
- payment from an insurer
- settlement amount
- coverage decisions
- any insurance or legal outcome

Please advise:
- Is this structure appropriate for a documentation SaaS platform?
- Could any wording be interpreted as acting as a public adjuster or promising an insurance result?
- What changes would you recommend before publishing?

> **FACT-CHECK NOTE:** I read the actual guarantee-eligibility code
> (`src/lib/guarantee.ts`). It confirms the description above precisely —
> eligibility is computed only from a before/after Claim Grade comparison
> and five fixed checklist items, with no reference anywhere to coverage,
> settlement, or insurer decisions. A full draft Refund Policy exists at
> `07_Legal/Refund-Policy-DRAFT.md`, Section 3, and is marked as the
> single highest-priority section for counsel's review. One thing counsel
> should know that isn't obvious from the policy text: **refund issuance
> itself is not automated.** The code explicitly computes an
> `eligible_for_refund` flag as a stored fact only — actual refunds are a
> manual, human-reviewed process triggered by a support email (per the
> draft's own Section 3.5/3.6). This is consistent with what's written,
> but worth being explicit about so the letter's "how to request a
> refund" language isn't read as describing a faster or more automated
> process than what currently exists.

---

## Subscription Billing Review (Before Paid Launch)

Planned pricing:
- $19/month subscription
- $49 one-time claim-specific Pro access

Please review:
- subscription disclosure requirements
- auto-renewal requirements
- cancellation procedures
- refund terms
- chargeback/dispute handling
- nationwide state-specific subscription compliance concerns

> **FACT-CHECK NOTE:** the $19/$49 figures are consistent everywhere I
> checked (Terms draft, the pricing preview page, the live checkout
> component) but I did not independently verify them against the actual
> configured dollar amounts on the live Stripe Price objects — the app
> only stores Stripe Price IDs, not amounts, so confirming the real
> billed amount requires checking the Stripe dashboard directly.
> Cancellation: see the Terms of Service note above — not yet
> self-service. Chargeback/dispute handling: the Refund Policy draft
> states Pro access is removed immediately on a refund or dispute; this
> matches how the billing system was built (entitlement removal tied to
> Stripe webhook events), though I did not re-read the webhook handler
> code specifically for this pass. State-specific subscription compliance
> is outside what I can fact-check from code — that's squarely for
> counsel.

---

## AI and Data Use Review

Please review:
- use of Anthropic API for document analysis
- required AI processing disclosures
- whether anonymized/aggregated data usage requires additional consent
- recommended AI-specific contractual language

> **FACT-CHECK NOTE:** Anthropic API usage is real and is the only AI
> provider used anywhere in the product — confirmed disclosed in both the
> Privacy Policy draft and the dedicated AI Disclaimer page, which goes
> further than most SaaS disclosures by explicitly separating
> deterministic scoring (never AI) from AI-generated prose (always
> user-reviewed before use). On aggregated/anonymized data: as noted
> above, no such usage currently exists in the codebase at all, so there
> is nothing to consent to yet — worth confirming with counsel whether
> the Privacy Policy should proactively address this (in case it's added
> later) or simply reflect current reality.

---

## Requested Deliverable

Please provide:
- Required changes before accepting payments
- Recommended improvements
- Any compliance concerns requiring additional review
- Confirmation of what is appropriate for a free beta launch
- Recommended legal checklist before enabling paid subscriptions

Thank you
