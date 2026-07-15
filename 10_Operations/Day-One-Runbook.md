# WholeClaim — Day One Runbook

**Purpose:** the single sheet to follow at the computer, start to finish. It merges the standard Next.js/Supabase/Vercel setup with the corrections this repo requires. Everything below is free-tier under the working name — the clearance gate (Decisions #17–18) stays untripped. Paid domain and Stripe wait for clearance and the LLC.

## 0. Install once

- **Node.js LTS** — nodejs.org
- **Git** — git-scm.com
- **VS Code** — optional; Claude Code works from the terminal alone
- **Claude Code** — Mac/Linux: `curl -fsSL https://claude.ai/install.sh | bash` · Windows PowerShell: `irm https://claude.ai/install.ps1 | iex` · or `npm install -g @anthropic-ai/claude-code`. Requires a paid Claude plan (Pro/Max/Team).
- **Accounts:** GitHub, Supabase, Vercel — free tiers all suffice.

## 1. Create the app

```
npx create-next-app@latest wholeclaim
```

Answers: TypeScript **Yes** · ESLint **Yes** · Tailwind **Yes** · App Router **Yes** · src/ directory **No** · import alias **Yes**.

```
cd wholeclaim
npm run dev
```

Open http://localhost:3000 — the starter page means it works. Ctrl+C to stop.

## 2. Wire in the company repo — the step generic guides miss

Unzip `wholeclaim-company-v1.zip` and copy its **contents** (CLAUDE.md, the 00–10 folders, README.md) into the `wholeclaim` project root, so `CLAUDE.md` sits beside `package.json`. This single move is what makes Claude Code wake up as FA-1.0 — already knowing the Decision Log, the charter limits, and the Build Brief.

## 3. Supabase

New project named **WholeClaim** · strong database password (into the password manager, not a sticky note) · wait for provisioning · copy the **Project URL** and **anon public key**.

## 4. Secrets file

Create `.env.local` in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Restart the dev server. **Verification that matters:** after step 5's `git add .`, run `git status` — `.env.local` must NOT be listed (create-next-app's .gitignore excludes it; confirm anyway before the first push). The M2 secrets that come later — `SUPABASE_SERVICE_ROLE_KEY` and `ANTHROPIC_API_KEY` — are server-side only and never carry a `NEXT_PUBLIC_` prefix.

## 5. GitHub — repo must be PRIVATE

Create the repo `wholeclaim` with visibility **Private**. Appendix A classifies the prompt templates as trade secrets living only in the private repo — a public repo leaks the IP vault the moment M2 ships. Then:

```
git init
git add .
git status        <- confirm .env.local is absent
git commit -m "Initial WholeClaim setup"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/wholeclaim.git
git push -u origin main
```

## 6. Vercel

Import the GitHub repo · add the two Supabase environment variables in project settings · Deploy. The free `https://wholeclaim.vercel.app` URL is the beta home until clearance unlocks the real domain.

## 7. Start the Founder Assistant

In the project folder:

```
claude
```

Sign in, then send exactly this:

> **Read 04_Engineering/Production-Build-Brief.md and build milestone M1 only. Explain each step in plain English and stop at anything irreversible.**

One milestone per session — that's the charter, not a suggestion. (The 8-item "Sprint 1" list floating around is a subset of M1+M2+M5; the Brief version adds the two things it forgot — RLS security tests and the Decision #29 grader-first onboarding. Follow the Brief.)

## 8. M1 acceptance before M2

- Magic-link sign-up works
- Create a claim, add a binder entry, add a deadline
- **The RLS check:** a second test account cannot see the first account's data
- The deployed vercel.app URL behaves identically to localhost

Then next session: "Build M2." Order holds M1→M6; M4 includes Brief §12; M6 is Test Run 02 — the beta gate.

**If anything errors:** paste the error text straight to Claude Code, or run `claude doctor`.
