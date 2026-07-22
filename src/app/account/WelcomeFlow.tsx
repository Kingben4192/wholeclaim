import { dismissWelcome } from "./actions";

// Onboarding Step 3 — shown once, only when the account page's own gate
// (!profile.onboarding_seen_at && zero claims) is true. Never rendered for
// Path A (grader-converted) users: they never land on /account before a
// claim already exists (/claim/from-grade redirects straight into
// /claim/[id]), so the zero-claims condition alone excludes them without
// any special-casing here. No client JS needed — both actions are plain
// server-action form submissions, same pattern as claim/actions.ts.
export function WelcomeFlow() {
  const startClaim = dismissWelcome.bind(null, "/claim/new");
  const skip = dismissWelcome.bind(null, "/account");

  return (
    <div className="rounded-xl border border-neutral-200 p-6 bg-gradient-to-br from-neutral-50 to-white flex flex-col gap-6">
      <div>
        <p className="text-xs font-medium uppercase text-neutral-500 mb-1">
          The insurance claim workspace for homeowners
        </p>
        <h1 className="font-display text-2xl font-extrabold">Welcome to WholeClaim</h1>
      </div>

      <p className="text-sm text-ink/70">
        WholeClaim organizes everything about your claim in one place — your
        policy, your photos, your correspondence with the carrier, and every
        deadline — so nothing gets lost and nothing gets forgotten.
      </p>

      <p className="text-sm text-ink/70">
        Your Documentation Score tracks how complete your file is across
        seven categories, from evidence photos to deadline tracking. It
        updates automatically as you add to your file.
      </p>

      <div>
        <p className="text-sm font-semibold text-ink mb-2">Setting up your claim file takes a few minutes:</p>
        <ol className="text-sm text-ink/70 flex flex-col gap-1 list-decimal list-inside">
          <li>What happened</li>
          <li>When it happened</li>
          <li>Your claim type</li>
          <li>What documentation you already have</li>
        </ol>
        <p className="text-xs text-ink/50 mt-2">You can always add more later.</p>
      </div>

      <p className="text-sm text-ink/70">
        A complete file is one you can hand to an adjuster, a contractor, or
        an attorney without having to go dig for anything. WholeClaim never
        predicts how your claim will turn out — it just makes sure your
        documentation is ready when you need it.
      </p>

      <div className="flex items-center gap-4 pt-2">
        <form action={startClaim}>
          <button className="bg-ledger text-paper px-6 py-3 rounded-sm font-semibold text-sm">
            Start my claim file
          </button>
        </form>
        <form action={skip}>
          <button className="text-sm text-ink/50 underline">Skip for now</button>
        </form>
      </div>
    </div>
  );
}
