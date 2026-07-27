import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { computeDocumentationScore, toClientView } from "@/lib/scoring/documentationScore";
import { DeleteAccountButton } from "./DeleteAccountButton";
import { ManageSubscriptionButton } from "./ManageSubscriptionButton";
import { ExportDataButton } from "./ExportDataButton";
import { WelcomeFlow } from "./WelcomeFlow";
import { SignupIntentForm } from "./SignupIntentForm";
import { AccountMenu } from "../AccountMenu";
import { BottomNav } from "../BottomNav";
import { SUBSCRIPTION_STATUSES_GRANTING_PRO } from "@/lib/entitlements";
import { filesForScoring } from "@/lib/scoringFileFilter";
import { bucketLabel, relativeAge, BUCKET_ORDER, type DateBucket } from "@/lib/relativeTime";
import { getClaimDisplayTitle } from "@/lib/claimDisplay";

// Authenticated dashboard (Part 2 of the homepage/dashboard split,
// 2026-07-20) — the primary landing page after magic-link sign-in
// (src/app/auth/callback/page.tsx's default `next`). Route protection is
// middleware-level (src/lib/supabase/middleware.ts PROTECTED_PREFIXES),
// same mechanism as /claim, not just this page's own inline check.
//
// Every section here reads real data from tables that already exist.
// "My Claims" reuses the exact query /claim/page.tsx already uses; Claim
// Grade summary uses the Documentation Score engine
// (src/lib/scoring/documentationScore.ts) — client view only, per Decision
// #40's confidentiality boundary; Settings reuses the account page's
// pre-existing export/delete/billing-portal functionality verbatim.

const RECENT_CLAIMS_LIMIT = 5;
const RECENT_ACTIVITY_LIMIT = 8;

type ActivityItem = {
  kind: "entry" | "deadline" | "file";
  label: string;
  claimId: string;
  claimLabel: string;
  at: string;
};

export default async function AccountPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main className="max-w-xl mx-auto px-6 py-16">
        <p className="text-sm text-ink/60">Supabase isn&apos;t configured yet.</p>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return (
      <main className="max-w-xl mx-auto px-6 py-16">
        <p className="text-sm text-ink/60">
          <Link href="/login" className="text-ledger underline">
            Sign in
          </Link>{" "}
          to view your dashboard.
        </p>
      </main>
    );
  }

  const [{ data: profile }, { data: claims }] = await Promise.all([
    supabase
      .from("profiles")
      .select("name, stripe_customer_id, created_at, onboarding_seen_at, subscription_status, signup_category")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("claims")
      .select("id, label, carrier, claim_number, damage_category, claim_category, status, date_of_loss, offer_amount, created_at")
      .order("created_at", { ascending: false })
      .limit(RECENT_CLAIMS_LIMIT),
  ]);

  // Signup Category + Acquisition Source Tracking (Decision #45) — a new,
  // earlier gate than WelcomeFlow's, deliberately decoupled from claim
  // count so it also catches Path A (grader-converted) users, who skip
  // WelcomeFlow's own zero-claims gate below entirely since they always
  // already have >=1 claim by their first /account visit. Reuses
  // onboarding_seen_at as the "is this an existing, pre-feature user"
  // grandfather signal: nothing else ever sets it besides dismissWelcome,
  // so anyone who's already been through (or dismissed) onboarding is
  // correctly excluded from this new, required question.
  if (!profile?.onboarding_seen_at && !profile?.signup_category) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16 pb-24 sm:pb-16">
        <AccountMenu />
        <SignupIntentForm />
        <BottomNav />
      </main>
    );
  }

  // Welcome Flow (Onboarding Step 3) — first-time direct-signup users only.
  // Path A (grader-converted) users never hit this: /claim/from-grade
  // redirects straight into a populated /claim/[id] before /account is
  // ever rendered, so they always already have >=1 claim by the time (if
  // ever) they visit this page. Skipping the rest of the dashboard here is
  // deliberate — Recent Activity/Claim Grade Summary are meaningless noise
  // with zero claims.
  if (!profile?.onboarding_seen_at && (!claims || claims.length === 0)) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16 pb-24 sm:pb-16">
        <AccountMenu />
        <WelcomeFlow />
        <BottomNav />
      </main>
    );
  }

  const claimIds = (claims ?? []).map((c) => c.id);
  const claimLabel = (id: string) => {
    const c = claims?.find((cl) => cl.id === id);
    return c ? getClaimDisplayTitle(c) : "a claim";
  };

  // WholeClaim Documentation Score summary — real computed score per claim
  // shown, same deterministic scoring every other score display in the
  // app uses. Not the public Claim Grade quiz (Decision #59) -- this is
  // the file-based Documentation Score engine.
  // Scoped to the same small preview list as "My Claims" (not every claim
  // the user has ever created) to keep this one page's query count bounded.
  // toClientView() strips weights/maxes/raw points before anything here is
  // rendered — this page never holds the full DocumentationScoreResult.
  const grades = await Promise.all(
    (claims ?? []).map(async (claim) => {
      const [{ data: entries }, { data: deadlines }, { data: evidenceItems }, { data: files }, { data: promisedItems }] = await Promise.all([
        supabase.from("entries").select("type, date, created_at").eq("claim_id", claim.id),
        supabase.from("deadlines").select("title, due_date, created_at").eq("claim_id", claim.id),
        supabase
          .from("evidence_items")
          .select("label, checked, file_id, category, created_at")
          .eq("claim_id", claim.id),
        supabase.from("files").select("id, kind, original_name, uploaded_at").eq("claim_id", claim.id),
        supabase.from("promised_items").select("file_id").eq("claim_id", claim.id),
      ]);
      const score = computeDocumentationScore({
        claim: {
          dateOfLoss: claim.date_of_loss ?? null,
          damageCategory: claim.damage_category ?? null,
          offerAmount: claim.offer_amount !== null && claim.offer_amount !== undefined ? Number(claim.offer_amount) : null,
        },
        entries: entries ?? [],
        deadlines: deadlines ?? [],
        evidenceItems: evidenceItems ?? [],
        files: filesForScoring(files ?? [], evidenceItems ?? [], promisedItems ?? []),
      });
      return { claimId: claim.id, view: toClientView(score) };
    }),
  );

  // Recent Activity — real rows from entries/deadlines/files across the
  // same preview claim set, merged and sorted by timestamp. No separate
  // "activity log" table exists or is needed; these three already carry
  // real created_at/uploaded_at values.
  let activity: ActivityItem[] = [];
  if (claimIds.length > 0) {
    const [{ data: entries }, { data: deadlines }, { data: files }] = await Promise.all([
      supabase.from("entries").select("claim_id, type, summary, created_at").in("claim_id", claimIds),
      supabase.from("deadlines").select("claim_id, title, created_at").in("claim_id", claimIds),
      supabase.from("files").select("claim_id, original_name, uploaded_at").in("claim_id", claimIds),
    ]);
    activity = [
      ...(entries ?? []).map((e) => ({
        kind: "entry" as const,
        label: `${e.type} logged — ${e.summary}`,
        claimId: e.claim_id,
        claimLabel: claimLabel(e.claim_id),
        at: e.created_at,
      })),
      ...(deadlines ?? []).map((d) => ({
        kind: "deadline" as const,
        label: `Deadline added — ${d.title}`,
        claimId: d.claim_id,
        claimLabel: claimLabel(d.claim_id),
        at: d.created_at,
      })),
      ...(files ?? []).map((f) => ({
        kind: "file" as const,
        label: `File uploaded — ${f.original_name}`,
        claimId: f.claim_id,
        claimLabel: claimLabel(f.claim_id),
        at: f.uploaded_at,
      })),
    ]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, RECENT_ACTIVITY_LIMIT);
  }

  // Grouped by day-bucket, preserving BUCKET_ORDER; empty buckets are
  // simply absent from the map, not rendered as empty sections.
  const activityByBucket = new Map<DateBucket, ActivityItem[]>();
  for (const item of activity) {
    const bucket = bucketLabel(item.at);
    const existing = activityByBucket.get(bucket);
    if (existing) existing.push(item);
    else activityByBucket.set(bucket, [item]);
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-16 pb-24 sm:pb-16 flex flex-col gap-12">
      <AccountMenu />
      <BottomNav />
      <div>
        <h1 className="font-display text-2xl font-extrabold">Your dashboard</h1>
        <p className="text-sm text-ink/60 mt-1">{user.email}</p>
      </div>

      {/* My Account */}
      <section>
        <h2 className="font-display text-xs font-bold uppercase tracking-[0.1em] text-ink/60 mb-3">
          My Account
        </h2>
        <div className="border border-ink/15 rounded-sm px-4 py-3 text-sm flex flex-col gap-1">
          <div>
            <span className="text-ink/50">Email: </span>
            {user.email}
          </div>
          {profile?.name && (
            <div>
              <span className="text-ink/50">Name: </span>
              {profile.name}
            </div>
          )}
          <div>
            <span className="text-ink/50">Member since: </span>
            {new Date(profile?.created_at ?? user.created_at).toLocaleDateString()}
          </div>
          {profile?.subscription_status && SUBSCRIPTION_STATUSES_GRANTING_PRO.includes(profile.subscription_status) && (
            <div className="text-ledger font-semibold">
              ✔ Included with your WholeClaim Pro subscription
            </div>
          )}
        </div>
      </section>

      {/* Decision #69 -- "Continue Your Claim" resume card. Uses the same
          created_at DESC ordering "My Claims" below already queries with
          (claims[0] is the same row as that list's first entry) as a
          proxy for "most recently active" -- no last_viewed_at/updated_at
          tracking exists on claims, and adding one is a migration
          (founder-applied, out of scope here). Category filter chips
          deferred per the spec's own explicit priority call. */}
      {claims && claims.length > 0 && (
        <section>
          <h2 className="font-display text-xs font-bold uppercase tracking-[0.1em] text-ink/60 mb-3">
            Continue Your Claim
          </h2>
          <Link
            href={`/claim/${claims[0].id}`}
            className="flex items-center justify-between border-2 border-ledger bg-ledger/5 rounded-sm px-4 py-3.5 hover:bg-ledger/10"
          >
            <span className="flex flex-col min-w-0">
              <span className="text-sm font-semibold truncate">{getClaimDisplayTitle(claims[0])}</span>
              <span className="text-xs text-ink/50 font-mono truncate">
                {claims[0].carrier || "Unnamed carrier"}
                {claims[0].claim_number && ` · ${claims[0].claim_number}`}
              </span>
            </span>
            <span className="text-xs font-semibold text-ledger shrink-0 ml-3">Resume &rarr;</span>
          </Link>
        </section>
      )}

      {/* My Claims */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xs font-bold uppercase tracking-[0.1em] text-ink/60">
            My Claims
          </h2>
          <Link href="/claim" className="text-xs font-semibold text-ledger">
            View all &rarr;
          </Link>
        </div>
        {claims && claims.length > 0 ? (
          <ul className="border border-ink/15 rounded-sm divide-y divide-ink/10">
            {claims.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/claim/${c.id}`}
                  className="flex items-center justify-between px-4 py-3 text-sm hover:bg-ledger/5"
                >
                  <span className="flex flex-col min-w-0">
                    <span className="truncate">{getClaimDisplayTitle(c)}</span>
                    <span className="text-xs text-ink/50 font-mono truncate">
                      {c.carrier || "Unnamed carrier"}
                      {c.claim_number && ` · ${c.claim_number}`}
                    </span>
                  </span>
                  <span className="text-xs text-ink/50 font-mono flex items-center gap-1.5 shrink-0 ml-3">
                    {c.damage_category || "damage type not set"}
                    {c.status && c.status !== "active" && (
                      <span className="px-1.5 py-0.5 rounded-sm bg-ink/10 text-ink/60 normal-case font-sans capitalize">
                        {c.status}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="border border-ink/15 rounded-sm px-4 py-4 text-sm text-ink/50">
            No claims yet.{" "}
            <Link href="/claim/new" className="text-ledger font-semibold">
              Start your claim file
            </Link>
            .
          </div>
        )}
      </section>

      {/* WholeClaim Documentation Score summary */}
      {grades.length > 0 && (
        <section>
          <h2 className="font-display text-xs font-bold uppercase tracking-[0.1em] text-ink/60 mb-3">
            WholeClaim Documentation Score Summary
          </h2>
          <div className="border border-ink/15 rounded-sm divide-y divide-ink/10">
            {grades.map(({ claimId, view }) => (
              <Link
                key={claimId}
                href={`/claim/${claimId}`}
                className="flex items-center justify-between px-4 py-3 text-sm hover:bg-ledger/5"
              >
                <span>{claimLabel(claimId)}</span>
                <span className="font-mono text-xs text-ink/60">
                  {view.grade} · {view.total}/100
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent Activity */}
      <section>
        <h2 className="font-display text-xs font-bold uppercase tracking-[0.1em] text-ink/60 mb-3">
          Recent Activity
        </h2>
        {activity.length > 0 ? (
          <div className="flex flex-col gap-4">
            {BUCKET_ORDER.filter((bucket) => activityByBucket.has(bucket)).map((bucket) => (
              <div key={bucket}>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/40 mb-1.5">
                  {bucket}
                </p>
                <ul className="border border-ink/15 rounded-sm divide-y divide-ink/10">
                  {activityByBucket.get(bucket)!.map((item, i) => (
                    <li key={i} className="px-4 py-2.5 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate">{item.label}</span>
                        <span className="text-xs font-mono text-ink/50 shrink-0">
                          {relativeAge(item.at)}
                        </span>
                      </div>
                      <Link href={`/claim/${item.claimId}`} className="text-xs text-ledger">
                        {item.claimLabel}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-ink/15 rounded-sm px-4 py-4 text-sm text-ink/50">
            Nothing logged yet.
          </div>
        )}
      </section>

      {/* Support */}
      <section>
        <h2 className="font-display text-xs font-bold uppercase tracking-[0.1em] text-ink/60 mb-3">
          Support
        </h2>
        <Link
          href="/help"
          className="inline-flex items-center gap-2 border border-ink/20 px-4 py-2 rounded-sm font-semibold text-sm"
        >
          Help Center
        </Link>
      </section>

      {/* Settings — existing functionality only, unchanged from the prior account page */}
      <section className="border-t border-ink/10 pt-10">
        <h2 className="font-display text-xs font-bold uppercase tracking-[0.1em] text-ink/60 mb-3">
          Settings
        </h2>
        <div className="flex flex-col gap-8">
          {profile?.stripe_customer_id && (
            <div>
              <h3 className="font-display font-bold text-sm mb-2">Billing</h3>
              <p className="text-sm text-ink/60 mb-3">
                Manage your subscription, update payment details, or cancel —
                all through Stripe&apos;s secure billing portal.
              </p>
              <ManageSubscriptionButton />
            </div>
          )}

          <div>
            <h3 className="font-display font-bold text-sm mb-2">Export your data</h3>
            <p className="text-sm text-ink/60 mb-3">
              Every claim, entry, deadline, and evidence item as JSON, plus every
              uploaded photo and PDF, in one zip.
            </p>
            <ExportDataButton />
          </div>

          <div className="border-t border-red-700/20 pt-8">
            <h3 className="font-display font-bold text-sm text-red-700 mb-2">Delete account</h3>
            <p className="text-sm text-ink/60 mb-3">
              Removes every claim, entry, deadline, and uploaded file. No support
              ticket required — this happens immediately.
            </p>
            <DeleteAccountButton />
          </div>
        </div>
      </section>
    </main>
  );
}
