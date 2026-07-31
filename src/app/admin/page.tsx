import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isServiceRoleConfigured, getAdminClient } from "@/lib/supabase/admin";
import { computeConversionStats, computeAiExhaustionStats, computeRetentionRate, median } from "@/lib/betaMetrics";
import { FREE_CLAIM_CAP } from "@/lib/anthropic/rateLimit";
import {
  FREE_STORAGE_LIMIT_PER_ACCOUNT_BYTES,
  PRO_STORAGE_LIMIT_PER_ACCOUNT_BYTES,
  PRO_STORAGE_BUFFER_BYTES,
} from "@/lib/uploadLimits";
import { SUBSCRIPTION_STATUSES_GRANTING_PRO } from "@/lib/entitlements";

// Same admin-email gate already used for the Knowledge Library
// (src/app/library/actions.ts, src/app/library/page.tsx) — duplicated
// here rather than extracted to a shared helper, to keep this change
// scoped to exactly the one new page requested. Worth centralizing later
// now that it exists in three places, but not part of this pass.
function isAdmin(email: string | null | undefined): boolean {
  const allowed = process.env.ADMIN_EMAIL?.toLowerCase();
  return Boolean(allowed && email && email.toLowerCase() === allowed);
}

// Beta monitoring (read-only). Deliberately stricter than /library's "This
// page isn't available" message: that response still confirms the route
// exists to anyone who visits it. This page aggregates every beta user's
// email and activity in one place, not just one admin's own draft
// entries, so a plain 404 (not found — no different from a URL that was
// never a route at all) is used instead, for every non-admin case:
// signed out, signed in as a non-admin, or Supabase not configured.
export default async function AdminPage() {
  if (!isSupabaseConfigured() || !isServiceRoleConfigured()) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) {
    notFound();
  }

  // Everything below runs only after the admin check above — the real
  // access-control boundary for this page is that check, not RLS: these
  // reads use the service-role client (bypassing RLS by design, same as
  // the Knowledge Library's approveEntry) because there is no RLS policy
  // that lets any normal user read another user's claims/files/ai_runs —
  // confirmed during the 2026-07-24 security review — so this data is
  // only ever reachable through this gated path.
  const admin = getAdminClient();

  // perPage: 1000 is a beta-scale simplification (5-10 real users per the
  // founder's own brief) — fine for now, would need real pagination if
  // this ever needs to cover a larger user base.
  const [{ data: usersPage }, { data: claims }, { data: files }, { data: aiRuns }, { data: profiles }, { data: analyticsEvents }] =
    await Promise.all([
      admin.auth.admin.listUsers({ perPage: 1000 }),
      admin.from("claims").select("id, user_id, claim_category, storage_used_bytes"),
      admin.from("files").select("user_id, claim_id"),
      admin.from("ai_runs").select("user_id, claim_id, created_at"),
      admin.from("profiles").select("id, subscription_status, converted_at, storage_used_bytes"),
      admin.from("analytics_events").select("event_type, user_id, metadata, created_at"),
    ]);

  const claimCountByUser = new Map<string, number>();
  const claimCategoriesByUser = new Map<string, Map<string, number>>();
  for (const c of claims ?? []) {
    claimCountByUser.set(c.user_id, (claimCountByUser.get(c.user_id) ?? 0) + 1);
    if (c.claim_category) {
      const byCategory = claimCategoriesByUser.get(c.user_id) ?? new Map<string, number>();
      byCategory.set(c.claim_category, (byCategory.get(c.claim_category) ?? 0) + 1);
      claimCategoriesByUser.set(c.user_id, byCategory);
    }
  }

  const fileCountByUser = new Map<string, number>();
  for (const f of files ?? []) {
    fileCountByUser.set(f.user_id, (fileCountByUser.get(f.user_id) ?? 0) + 1);
  }

  const aiRunCountByUser = new Map<string, number>();
  for (const r of aiRuns ?? []) {
    aiRunCountByUser.set(r.user_id, (aiRunCountByUser.get(r.user_id) ?? 0) + 1);
  }

  const rows = (usersPage?.users ?? [])
    .map((u) => ({
      id: u.id,
      email: u.email ?? "(no email)",
      signedUp: u.created_at,
      lastLogin: u.last_sign_in_at ?? null,
      claimCount: claimCountByUser.get(u.id) ?? 0,
      claimCategories: claimCategoriesByUser.get(u.id) ?? new Map<string, number>(),
      fileCount: fileCountByUser.get(u.id) ?? 0,
      aiRunCount: aiRunCountByUser.get(u.id) ?? 0,
    }))
    .sort((a, b) => new Date(b.signedUp).getTime() - new Date(a.signedUp).getTime());

  // Beta metrics summary (proposal approved 2026-07-31). Pure calculation
  // functions live in src/lib/betaMetrics.ts (unit-tested there) -- this
  // page only fetches and hands off. Metric 6 (cost per free account) is
  // deliberately not here yet: it needs current AI token pricing and a
  // Supabase Storage $/GB figure, both pending from the founder rather
  // than guessed.
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  const conversionStats = computeConversionStats(
    (usersPage?.users ?? []).map((u) => ({
      createdAt: u.created_at,
      convertedAt: profileById.get(u.id)?.converted_at ?? null,
    })),
  );

  const aiExhaustionStats = computeAiExhaustionStats(
    (aiRuns ?? []).map((r) => ({ userId: r.user_id, claimId: r.claim_id, createdAt: r.created_at })),
    FREE_CLAIM_CAP,
  );

  const now = new Date();
  const retention30 = computeRetentionRate(
    (usersPage?.users ?? []).map((u) => ({ createdAt: u.created_at, lastSignInAt: u.last_sign_in_at ?? null })),
    30,
    now,
  );
  const retention60 = computeRetentionRate(
    (usersPage?.users ?? []).map((u) => ({ createdAt: u.created_at, lastSignInAt: u.last_sign_in_at ?? null })),
    60,
    now,
  );
  const retention90 = computeRetentionRate(
    (usersPage?.users ?? []).map((u) => ({ createdAt: u.created_at, lastSignInAt: u.last_sign_in_at ?? null })),
    90,
    now,
  );

  const claimFileCounts = new Map<string, number>();
  for (const f of files ?? []) {
    if (!f.claim_id) continue;
    claimFileCounts.set(f.claim_id, (claimFileCounts.get(f.claim_id) ?? 0) + 1);
  }
  const medianFilesPerClaim = median([...claimFileCounts.values()]);

  // Currently at/over the storage limit, account-level (the more visible,
  // single-number version of metric 3) -- reuses the exact thresholds
  // checkUploadAccess enforces against, not separately computed. Per-claim
  // blocking is captured in everBlockedUsers below instead, since
  // aggregating per-claim status into one account-level number would
  // hide which limit actually bound.
  let accountsAtOrOverStorage = 0;
  for (const p of profiles ?? []) {
    const used = p.storage_used_bytes ?? 0;
    const isProAccount = Boolean(
      p.subscription_status && SUBSCRIPTION_STATUSES_GRANTING_PRO.includes(p.subscription_status),
    );
    const limit = isProAccount
      ? PRO_STORAGE_LIMIT_PER_ACCOUNT_BYTES + PRO_STORAGE_BUFFER_BYTES
      : FREE_STORAGE_LIMIT_PER_ACCOUNT_BYTES;
    if (used >= limit * 0.8) accountsAtOrOverStorage++;
  }

  const everBlockedUsers = new Set(
    (analyticsEvents ?? []).filter((e) => e.event_type === "storage_limit_blocked").map((e) => e.user_id),
  );
  const deletionReasons = new Map<string, number>();
  for (const e of analyticsEvents ?? []) {
    if (e.event_type !== "account_deleted") continue;
    const metadata = e.metadata as { reason?: string | null } | null;
    const reason = metadata?.reason ?? "unspecified";
    deletionReasons.set(reason, (deletionReasons.get(reason) ?? 0) + 1);
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <header className="mb-8">
        <h1 className="font-display text-2xl font-extrabold mb-1">Beta Monitoring</h1>
        <p className="text-sm text-ink/60">
          Read-only. {rows.length} signed-up user{rows.length === 1 ? "" : "s"}.
        </p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        <div className="border border-ink/15 rounded-sm px-3 py-3">
          <p className="text-xs text-ink/50 mb-1">Free → Pro conversion</p>
          <p className="text-lg font-semibold text-ink">{conversionStats.conversionRatePercent}%</p>
          <p className="text-xs text-ink/40">
            {conversionStats.convertedUsers} of {conversionStats.totalUsers}
            {conversionStats.medianDaysToConvert !== null &&
              ` — median ${conversionStats.medianDaysToConvert}d to convert`}
          </p>
        </div>
        <div className="border border-ink/15 rounded-sm px-3 py-3">
          <p className="text-xs text-ink/50 mb-1">AI cap exhaustion</p>
          <p className="text-lg font-semibold text-ink">{aiExhaustionStats.exhaustionRatePercent}%</p>
          <p className="text-xs text-ink/40">
            {aiExhaustionStats.claimsExhausted} of {aiExhaustionStats.claimsWithAnyRun} claims
            {aiExhaustionStats.medianDaysToExhaust !== null &&
              ` — median ${aiExhaustionStats.medianDaysToExhaust}d`}
          </p>
        </div>
        <div className="border border-ink/15 rounded-sm px-3 py-3">
          <p className="text-xs text-ink/50 mb-1">Storage: at/over limit</p>
          <p className="text-lg font-semibold text-ink">{accountsAtOrOverStorage}</p>
          <p className="text-xs text-ink/40">{everBlockedUsers.size} ever hit a block</p>
        </div>
        <div className="border border-ink/15 rounded-sm px-3 py-3">
          <p className="text-xs text-ink/50 mb-1">Returning: 30 / 60 / 90d</p>
          <p className="text-lg font-semibold text-ink">
            {retention30.ratePercent}% / {retention60.ratePercent}% / {retention90.ratePercent}%
          </p>
          <p className="text-xs text-ink/40">
            of {retention30.eligible} / {retention60.eligible} / {retention90.eligible} eligible
          </p>
        </div>
        <div className="border border-ink/15 rounded-sm px-3 py-3">
          <p className="text-xs text-ink/50 mb-1">Median files/claim</p>
          <p className="text-lg font-semibold text-ink">{medianFilesPerClaim}</p>
          <p className="text-xs text-ink/40">{claimFileCounts.size} claims with files</p>
        </div>
        <div className="border border-ink/15 rounded-sm px-3 py-3">
          <p className="text-xs text-ink/50 mb-1">Cost per free account</p>
          <p className="text-lg font-semibold text-ink/30">—</p>
          <p className="text-xs text-ink/40">pending AI/storage pricing input</p>
        </div>
      </div>

      {deletionReasons.size > 0 && (
        <div className="border border-ink/15 rounded-sm px-3 py-3 mb-8">
          <p className="text-xs text-ink/50 mb-1.5">Deletion reasons</p>
          <p className="text-sm text-ink/70">
            {[...deletionReasons.entries()].map(([reason, count]) => `${reason}: ${count}`).join(", ")}
          </p>
        </div>
      )}

      <div className="border border-ink/15 rounded-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink/15 text-left">
              <th className="px-3 py-2 font-semibold whitespace-nowrap">User email</th>
              <th className="px-3 py-2 font-semibold whitespace-nowrap">Signed up</th>
              <th className="px-3 py-2 font-semibold whitespace-nowrap">Last login</th>
              <th className="px-3 py-2 font-semibold whitespace-nowrap">Claims created</th>
              <th className="px-3 py-2 font-semibold whitespace-nowrap">Files uploaded</th>
              <th className="px-3 py-2 font-semibold whitespace-nowrap">AI analyses used</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-ink/10 last:border-b-0">
                <td className="px-3 py-2 font-mono text-xs">{r.email}</td>
                <td className="px-3 py-2 text-ink/70 whitespace-nowrap">
                  {new Date(r.signedUp).toLocaleDateString()}
                </td>
                <td className="px-3 py-2 text-ink/70 whitespace-nowrap">
                  {r.lastLogin ? new Date(r.lastLogin).toLocaleDateString() : "never"}
                </td>
                <td className="px-3 py-2">
                  {r.claimCount}
                  {r.claimCategories.size > 0 && (
                    <span className="text-ink/50 text-xs ml-1.5">
                      ({[...r.claimCategories.entries()].map(([cat, n]) => `${cat}: ${n}`).join(", ")})
                    </span>
                  )}
                </td>
                <td className="px-3 py-2">{r.fileCount}</td>
                <td className="px-3 py-2">{r.aiRunCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="px-3 py-6 text-sm text-ink/50 text-center">No signups yet.</p>
        )}
      </div>
    </main>
  );
}
