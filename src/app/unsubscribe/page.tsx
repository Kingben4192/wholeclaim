import type { Metadata } from "next";
import { getAdminClient, isServiceRoleConfigured } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Unsubscribe | WholeClaim" };

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="font-display font-extrabold uppercase tracking-[0.06em] text-sm mb-8">
          Whole<span className="text-ledger">Claim</span>
        </div>
        {children}
      </div>
    </main>
  );
}

// Public, unauthenticated by design — this is a one-click link from an
// email, not a logged-in action. Uses the service-role client, scoped
// narrowly by an exact match on the random unsubscribe_token (never the
// lead's internal id, never exposed in the URL) — the same "service-role
// write, app-layer scoping" pattern already used elsewhere in this
// codebase for actions an anonymous visitor needs to trigger safely. The
// existing "leads: owner update by email" RLS policy requires an
// authenticated session and doesn't apply here on purpose.
export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!isServiceRoleConfigured()) {
    return (
      <Shell>
        <p className="text-sm text-ink/60">
          This service isn&apos;t configured yet. Try again later.
        </p>
      </Shell>
    );
  }

  if (!token) {
    return (
      <Shell>
        <h1 className="font-display text-xl font-bold mb-2">Invalid link</h1>
        <p className="text-sm text-ink/60">
          This unsubscribe link is missing its token. If you followed a link
          from an email, try copying the full URL again.
        </p>
      </Shell>
    );
  }

  const admin = getAdminClient();
  const { data: lead, error } = await admin
    .from("leads")
    .select("id, unsubscribed")
    .eq("unsubscribe_token", token)
    .maybeSingle();

  // Deliberately the same generic message for "no row" and "query error" —
  // never confirm or deny whether a given token exists in more detail
  // than that.
  if (error || !lead) {
    return (
      <Shell>
        <h1 className="font-display text-xl font-bold mb-2">Invalid link</h1>
        <p className="text-sm text-ink/60">
          We couldn&apos;t find a matching subscription for this link. If you
          believe this is an error, contact support.
        </p>
      </Shell>
    );
  }

  if (!lead.unsubscribed) {
    // Atomic conditional update — the unsubscribed = false guard means a
    // second, near-simultaneous visit can't double-process or clobber the
    // real unsubscribed_at timestamp a second time.
    const { error: updateError } = await admin
      .from("leads")
      .update({ unsubscribed: true, unsubscribed_at: new Date().toISOString() })
      .eq("id", lead.id)
      .eq("unsubscribed", false);

    if (updateError) {
      console.error("unsubscribe: update failed:", updateError.message);
      return (
        <Shell>
          <p className="text-sm text-ink/60">
            Something went wrong processing your request. Try again shortly.
          </p>
        </Shell>
      );
    }
  }

  return (
    <Shell>
      <div className="border-2 border-ledger bg-ledger/10 rounded-sm p-4 mb-4">
        <h1 className="font-display text-lg font-bold text-ledger mb-1">
          You&apos;re unsubscribed
        </h1>
        <p className="text-sm text-ink">
          You won&apos;t receive any more claim documentation tip emails from
          WholeClaim.
        </p>
      </div>
      <p className="text-xs text-ink/50">
        This only affects tip emails — if you have a WholeClaim account,
        deadline reminders and other account-related emails are unaffected.
      </p>
    </Shell>
  );
}
