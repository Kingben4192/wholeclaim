# WholeClaim
WORKING DRAFT — PENDING NAME CLEARANCE · CONFIDENTIAL

WholeClaim helps homeowners organize documentation for property insurance claims — evidence, correspondence, deadlines, and policy documents, all in one place, with a deterministic Documentation Score tracking how complete the file is. AI tools assist with analysis and drafting, but every score and recommendation is deterministic and server-computed; AI explains, it never decides or predicts claim outcomes.

## Stack

- **Next.js 16** (App Router, Turbopack), **TypeScript**, **Tailwind CSS v4**
- **Supabase** (Postgres, Auth, Storage, Row-Level Security)
- **Stripe** (subscriptions + one-time purchases)
- **Vercel** (hosting, Cron, deployment)
- **Anthropic API** (Claude, for the AI-assisted tools)
- **Resend** (transactional email), **Sentry** (error tracking), **web-push** (deadline reminders)

## Local setup

```bash
git clone <repo-url>
cd wholeclaim
npm install
cp .env.example .env.local
# fill in .env.local — see "Environment variables" below
npm run dev
```

App runs at `http://localhost:3000`. The two Supabase variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) are the minimum to get the app booting against a real Supabase project; everything else unlocks individual features and can be added incrementally. Without a Supabase project configured at all, most pages render a plain "not configured" message instead of crashing.

## Environment variables

All defined in `.env.example` — copy it to `.env.local` and fill in real values. `.env.local` is gitignored; never commit it.

| Variable | What it does |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project's API URL. Required to boot. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase's public anon key — used for every session-scoped (RLS-respecting) request. Required to boot. |
| `NEXT_PUBLIC_APP_URL` | This app's own public URL (used to build redirect/callback links). Defaults to `http://localhost:3000` for local dev. |
| `SUPABASE_SERVICE_ROLE_KEY` | Bypasses RLS. Used server-side only, for account deletion, admin monitoring, rate-limit counters, and the Stripe webhook. Never exposed to the client. |
| `ANTHROPIC_API_KEY` | Claude API access for the AI-assisted tools (Policy Decoder, Letter Builder, etc.). Server-side only. |
| `STRIPE_SECRET_KEY` | Stripe API access for checkout and billing-portal sessions. Test-mode key (`sk_test_...`) for local dev. |
| `STRIPE_WEBHOOK_SECRET` | Verifies incoming Stripe webhook signatures. From `stripe listen` locally, or the Stripe Dashboard in production. |
| `STRIPE_PRICE_ONETIME` | Price ID for the one-time "WholeClaim Pro" purchase. |
| `STRIPE_PRICE_SUBSCRIPTION` | Price ID for the subscription "WholeClaim Pro" plan. |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Web push key pair for deadline reminder notifications. Generate with `npx web-push generate-vapid-keys` — use a distinct pair per environment. |
| `VAPID_SUBJECT` | Contact address (`mailto:...`) required by the web-push protocol. |
| `CRON_SECRET` | Shared secret checked in the `Authorization: Bearer` header on scheduled routes, so only Vercel Cron (or someone who knows the secret) can trigger them. |
| `RESEND_API_KEY` | Resend API access, for the Claim Grade results email and the magic-link Send Email Hook. |
| `RESEND_FROM_EMAIL` | Verified sending address. Left unset, email falls back to Resend's shared test sender (only delivers to Resend's own reserved test addresses). |
| `SEND_EMAIL_HOOK_SECRET` | Verifies Supabase's Send Email Hook webhook calls. Generated in the Supabase dashboard (Authentication → Hooks) after the hook route is deployed. |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry error-reporting endpoint. Safe to expose client-side by design — it can only submit events, not read anything. |

## Applying migrations to a fresh Supabase project

There's no migration CLI or automated pipeline. Every file in `supabase/migrations/` is a plain numbered `.sql` file, applied by pasting its full contents into the Supabase SQL Editor and running it — one at a time, **in numeric order**, from `0001_init.sql` through the highest-numbered file currently in the directory. `supabase/migrations/README.md` has the full rationale, but the one non-negotiable step: every migration ends with `NOTIFY pgrst, 'reload schema';` — Supabase's PostgREST layer has repeatedly failed to pick up new tables/columns/policies without it.

## Running the test suite

```bash
npx tsc --noEmit   # typecheck
npx eslint .        # lint
npx vitest run      # unit tests (npm test also works)
```

All three should be clean before considering any change complete. Some test files (named `*.live.test.ts` when they appear) run against a real Supabase project rather than in-memory fixtures — those are throwaway verification scripts, not part of the permanent suite, and are deleted after use rather than committed.

## Deploying to production

```bash
vercel --prod
```

This repo is already linked to its Vercel project (`.vercel/project.json`). A plain `git push` to `master` only creates a **Preview** deployment — `vercel --prod` is the separate, required step that actually promotes to production. On a fresh clone, run `vercel login` and `vercel link` first to connect to the right Vercel project/team.

## Repo layout

```
src/app/          Next.js App Router — pages, API routes, and Server Actions,
                   organized by feature (account/, claim/, grade/, login/, api/...)
src/lib/           Business logic and integrations, framework-agnostic where
                   possible: scoring engines, Supabase clients, Stripe, Anthropic,
                   email, push, rate limiting, upload validation
supabase/
  migrations/      Numbered .sql schema migrations, applied by hand (see above)
public/            Static assets, PWA icons, service worker
scripts/           One-off maintenance/diagnostic SQL and Node scripts
docs/              Product/engineering specs; docs/confidential/ (gitignored)
                   holds the proprietary Documentation Score methodology
00_Founder/ … 10_Operations/
                   Company documentation (governance, brand, product, legal,
                   marketing, investor materials) — this is a combined
                   company-and-code repository, not source code
```

## Repository governance

This tree is the company, not just the code — every canonical document, asset, prototype, and standard lives here, organized 00–10. It is also the working directory for Claude Code — open the terminal here, run `claude`, then `/init`, then: "Read 04_Engineering/Production-Build-Brief.md and build milestone M1."

1. One canonical file per subject; the Operating Manual (02_Product) summarizes, source files govern.
2. Every material decision lands in 00_Founder/Decisions.md the week it is made.
3. Product invariants live in 02_Product/Product-Bible.md — violating a Never means the change is wrong.
4. Prompt changes: version-bump in 04_Engineering/AI-Prompt-Library.md + full golden-test regression.
5. The Evidence-Library-Standard (02_Product) is a product change when edited — it moves scores.
6. Nothing branded is purchased or filed until 01_Brand/Trademark-Status.md clears.
