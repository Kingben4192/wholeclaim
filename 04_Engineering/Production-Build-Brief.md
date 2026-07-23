# WholeClaim — Production Build Brief v1.0

**Purpose:** Hand this file to Claude Code along with `claim-binder-app-v2.jsx`, `wholeclaim-design-system.jsx`, `wholeclaim-app-icon.svg`, and `wholeclaim-brand-book-v1-1.md`. Together they contain everything needed to build the production app. Work milestone by milestone; commit at each milestone; do not skip the security rules.

**Strategic scope:** Mobile-first production **web app** (installable PWA). Native app stores are Phase 3, after revenue. Reason: the funnel is Threads → link → app; the web ships in weeks, iterates daily, and keeps 100% of subscription revenue minus payment fees.

---

## 1. Stack (locked — do not substitute)

- **Next.js (App Router) + TypeScript**, Tailwind configured with the design-system tokens
- **Supabase**: Postgres + Auth (email magic link + Google) + Storage (Evidence Vault) + Row Level Security
- **Vercel** hosting
- **Stripe**: Checkout + Customer Portal + webhook
- **Anthropic API** — server-side only, model `claude-sonnet-4-6`
- **Resend** for transactional email (grader results, deadline reminders)
- **PWA**: manifest + service worker + web push (deadline alerts; iOS supports push for installed PWAs)

## 2. Environment variables

`ANTHROPIC_API_KEY` (server only — NEVER in client bundles), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server only), `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL`, `RESEND_API_KEY`.

**Hard rule:** every Anthropic call goes through a Next.js route handler or server action. If `ANTHROPIC_API_KEY` appears anywhere client-side, the build fails review.

## 3. Data model (Postgres, RLS on every table)

- **profiles** — id (= auth.uid), name, us_state, plan (`free` | `pro`), stripe_customer_id, created_at
- **claims** — id, user_id, carrier, claim_number, policy_number, date_of_loss, damage_category, damage_desc, us_state, offer_amount, created_at
- **entries** — id, claim_id, user_id, date, type, contact, summary, created_at
- **deadlines** — id, claim_id, user_id, title, due_date
- **evidence_items** — id, claim_id, user_id, label, checked, file_id (nullable)
- **files** — id, claim_id, user_id, storage_path, kind (photo | pdf | doc), original_name, uploaded_at  ← the Evidence Vault
- **library_entries** — id, owner_id (null = global curated), type (statute | code | price | procedure), jurisdiction, cite, summary, verified_date, active, source_url
- **ai_runs** — id, user_id, claim_id, tool, prompt_version, output, tokens_in, tokens_out, created_at  ← audit log for every AI call
- **leads** — id, name, email, us_state, grade, score, answers (jsonb), created_at  ← grader

**RLS policy pattern:** rows readable/writable only where `user_id = auth.uid()`. `library_entries` with `owner_id null` are readable by all authenticated users, writable only by the admin role. `leads` insertable by anon (public grader), readable by admin only.

## 4. API routes (server)

`/api/ai/analyze` (tool: policy | gap | loss) · `/api/ai/letter` · `/api/ai/decide` · `/api/ai/ingest` (library draft structuring) · `/api/ai/grade` (public, for the grader page)

Each route: authenticate → plan gate → rate limit → build prompt → call Anthropic → write `ai_runs` → return.

- **Prompt templates:** port them **verbatim** from `claim-binder-app-v2.jsx` (ANALYZE_TOOLS, letterPrompt, decidePrompt, ingestPrompt) — they are tested IP (Golden Test Run 01, 6/6 pass). Version them (`prompt_version` field) so future edits are traceable.
- **Library injection:** each call loads the user's active library_entries (cap 12) plus global curated entries, formatted exactly as `libraryContext()` does in the prototype.
- **Plan gate:** free = 1 lifetime AI analysis (the taste); pro = unlimited with a fair-use cap (30 AI calls/day/user).
- **Rate limiting:** per-user and per-IP on all AI routes (Upstash Redis or a Postgres counter). This is cost-attack protection — non-negotiable.
- **max_tokens:** 1500–2000 in production (the artifact's 1000 was a sandbox limit).

## 5. Payments

Stripe Products: **WholeClaim Pro** — both **$49 one-time per claim** and **$19/month** offered together, no A/B split (Decision #16). Hosted Checkout; webhook flips `profiles.plan`; Customer Portal for self-service. **Sell on the web only** in Phase 2 — keeps revenue whole and defers app-store commission questions entirely.

## 6. Migration map (prototype → production)

| Prototype | Production |
|---|---|
| `window.storage` key-value | Supabase tables above, via server actions |
| Anthropic call from the artifact | Route handlers with server-side key |
| Evidence checklist (checkboxes only) | Checklist + real uploads to Storage (photos/PDFs), linked via `files` |
| Paste-in Policy/Estimate text | Same at launch; **v2.1**: PDF upload → server-side text extraction → same prompts |
| Single claim | Multi-claim per account (claims table is already claim-scoped) |
| GA seed button | Global curated library rows, admin-managed |
| Grader lead in storage | `leads` insert + Resend email with results + ConvertKit sync |

Port the UI components 1:1 from `wholeclaim-design-system.jsx` — tokens, exhibit tabs, stamps, health module, evidence chips. Rebrand all strings from "Claim Binder" to **WholeClaim** (the binder feature keeps its name: "the Binder"). Tagline in product register: *Every document. Every deadline. Every detail.*

## 7. Security & compliance (blocking checklist)

1. RLS enabled and tested on every table (write a failing-access test per table)
2. Service-role key server-only; anon key has no table access beyond RLS
3. No claim contents, letters, or AI outputs in analytics or logs
4. Account deletion endpoint (removes rows + storage objects) and data export endpoint (JSON + files zip) — required for trust now and app stores later
5. Disclaimer component on every AI surface: *"WholeClaim is a self-help documentation tool, not legal or insurance advice."*
6. Litigation-aware Letters footer: *"In active litigation? Route drafts through your attorney before sending."*
7. Pages: Privacy Policy, Terms of Service, AI Disclaimer, Cookie notice (if analytics)
8. Marketing claims carry the results-vary tail per Brand Book §8

## 8. Milestones (commit each)

- **M1** — Scaffold + auth + claims/entries/deadlines/evidence CRUD with RLS (the binder works)
- **M2** — AI routes with prompt templates, library injection, ai_runs logging, rate limits
- **M3** — Stripe: checkout, webhook, plan gates, portal
- **M4** — Public grader page + leads + Resend results email; legal pages; account deletion/export
- **M5** — Evidence Vault uploads; PWA manifest + push reminders; polish pass against the design system
- **M6** — **Test Run 02**: rerun G1–G6 from `claim-binder-test-run-01.md` inside the deployed app; all six must pass before beta

## 9. Launch order (business side)

1. Name clearance + LLC + EIN + business bank (Brand Book §14 — blocking)
2. Domain on the new entity; Vercel + Supabase + Stripe + Anthropic Console accounts under the entity
3. Build M1–M6 with Claude Code
4. Private beta: 10 users from Threads, one week, fix list
5. Launch: grader as link-in-bio, thread anchor with the $40K→$125K story, results-vary tail on every ad

## 10. Running costs (order of magnitude)

Domain ~$10–15/yr · Vercel free tier → ~$20/mo at scale · Supabase free tier → ~$25/mo · Anthropic API usage-based (set a monthly budget cap + alerts in the Console; verify current rates at docs.claude.com) · Stripe ~2.9% + 30¢ per transaction · Resend free tier to start · Later: Apple Developer $99/yr, Google Play $25 one-time.

## 11. Phase 3 — app stores (only after revenue)

Wrap the PWA with **Capacitor** (one codebase → iOS + Android) rather than rebuilding. Store requirements to budget for: privacy nutrition labels, in-app account deletion, support URL, per-device screenshots, review notes that lead with the "We are NOT" positioning (insurance-adjacent apps draw reviewer scrutiny — the disclaimers are the approval strategy). Keep subscription purchase on the web where store policy permits; revisit in-app purchase economics only if store conversion demands it.

## 12. Amendment — grader-first onboarding (Decision #29)

The public grader is the onboarding path, not just lead capture. Build M4 accordingly:

1. Grader answers persist to `leads.answers` (jsonb), keyed by email, before any account exists.
2. The results email (Resend) delivers the grade plus one magic-link CTA — **"Create My Claim File"** — and clicking it authenticates and creates the account. Email capture and signup collapse into a single step. The results page carries the same CTA (replaces the prototype's Gumroad button).
3. On first authentication, map answers → claim: claim status → dashboard context and first Next Action; damage type → `damage_category` (drives the Evidence Checklist template); state → `us_state`; the photo/log/deadline answers → pre-checked evidence items and seeded Next Actions (e.g., "never heard of the suit limitation" makes the deadline quick-add the very first action). **Map only what was answered; fabricate nothing into the file.**
4. Store the grader result as `baseline_grade` on the claim. Onboarding copy frames it honestly: "Your grade showed the gaps — the file closes them." The live Claim Health Score computes from real state and will start below the self-reported grade (empty binder, zero freshness); that is the product working, not a regression.
5. Funnel events: `grade_completed` → `account_created_from_grade` → `claim_prefilled`. Activation now measures grader-to-binder continuity.

**Acceptance:** a completed grade converts to a pre-filled claim file in two taps or fewer (email link + confirm), with zero re-entry of already-answered data.
