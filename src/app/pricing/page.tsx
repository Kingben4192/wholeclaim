import Link from "next/link";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { UpgradeOptions } from "../claim/[id]/UpgradeOptions";
import { SUBSCRIPTION_STATUSES_GRANTING_PRO, LIFETIME_ENTITLEMENT_TYPES } from "@/lib/entitlements";

// Pre-Launch Prep: Pricing Connection (2026-07-19) — the monthly
// subscription button creates a real Stripe TEST MODE checkout session
// via the existing /api/stripe/checkout route, reusing UpgradeOptions.tsx
// as-is (no second checkout implementation, no duplicated Stripe logic,
// no key exposed client-side).
//
// Pricing Page Lifetime Unlock Routing Update (2026-07-19) — the $49
// lifetime unlock is claim-specific and this page has no claim in
// context, so it never creates a checkout session itself. It only
// decides *which claim-scoped page* to send the user to; the existing,
// already-tested claim-detail UpgradeOptions instance (LossOfUseTracker)
// is what actually creates the checkout session, exactly as before:
//   0 claims  -> /claim/new (creating one lands on its detail page, where
//                the real upgrade flow already lives)
//   1 claim   -> that claim's detail page directly
//   2+ claims -> /claim (pick one, then continue from its detail page)

const QR_TARGET = `${process.env.NEXT_PUBLIC_APP_URL || "https://wholeclaim.vercel.app"}/grade`;

export default async function PricingPreviewPage() {
  const qrDataUrl = await QRCode.toDataURL(QR_TARGET, {
    margin: 1,
    width: 240,
    color: { dark: "#1E4B3C", light: "#F2F1EC" },
  });

  let signedIn = false;
  let lifetimeRedirectHref = "/claim/new";
  let isSubscriber = false;
  let hasAnyLifetimeUnlocked = false;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    signedIn = Boolean(user);

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_status")
        .eq("id", user.id)
        .maybeSingle();
      isSubscriber = Boolean(
        profile?.subscription_status && SUBSCRIPTION_STATUSES_GRANTING_PRO.includes(profile.subscription_status),
      );

      // Embedded claim_entitlements (real FK, claim_entitlements.claim_id
      // -> claims.id, 0011 migration) so we know per-claim lifetime status
      // in one query, not N+1 — needed to route the lifetime CTA at a
      // claim that isn't already unlocked, and to know whether to show
      // "Lifetime Access Active" at all.
      const { data: claims } = await supabase
        .from("claims")
        .select("id, claim_entitlements(status, entitlement_type)")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      const claimsWithLifetimeStatus = (claims ?? []).map((c) => ({
        id: c.id,
        lifetimeUnlocked: (c.claim_entitlements ?? []).some(
          (e) => e.status === "active" && LIFETIME_ENTITLEMENT_TYPES.includes(e.entitlement_type),
        ),
      }));

      hasAnyLifetimeUnlocked = claimsWithLifetimeStatus.some((c) => c.lifetimeUnlocked);

      const unlockable = claimsWithLifetimeStatus.filter((c) => !c.lifetimeUnlocked);
      if (unlockable.length === 1) {
        lifetimeRedirectHref = `/claim/${unlockable[0].id}`;
      } else if (unlockable.length > 1) {
        lifetimeRedirectHref = "/claim";
      }
      // unlockable.length === 0 (no claims at all, or every claim already
      // lifetime-unlocked) keeps the default "/claim/new" — offering to
      // unlock a future new claim is still a real, non-redundant option.
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <Link href="/" className="text-xs font-semibold text-ledger uppercase tracking-wide">
        ← Back home
      </Link>

      <header className="mt-6 mb-10 text-center">
        <h1 className="font-display text-3xl font-extrabold mb-3">
          WholeClaim Pro
        </h1>
        <p className="text-sm text-ink/60 max-w-xl mx-auto">
          Two ways to go Pro.
        </p>
      </header>

      {signedIn ? (
        <div className="mb-16">
          {isSubscriber ? (
            <div className="border-2 border-ledger bg-ledger/10 rounded-sm p-6 text-center">
              <p className="font-display font-bold text-ledger">
                ✔ You are currently subscribed to WholeClaim Pro.
              </p>
            </div>
          ) : (
            <>
              {hasAnyLifetimeUnlocked && (
                <div className="border-2 border-ledger bg-ledger/10 rounded-sm p-4 mb-4 text-center">
                  <p className="font-display font-bold text-ledger text-sm">
                    💎 WholeClaim Pro Lifetime Access Active
                  </p>
                </div>
              )}
              <UpgradeOptions lifetimeRedirectHref={lifetimeRedirectHref} />
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-16">
          <div className="border border-ink/15 rounded-sm p-6 flex flex-col gap-3">
            <div className="font-display font-bold text-sm">WholeClaim Pro</div>
            <div className="font-mono text-3xl font-extrabold text-ledger">
              $19<span className="text-base font-sans font-normal text-ink/50">/month</span>
            </div>
            <p className="text-sm text-ink/60 flex-1">
              Unlock WholeClaim Pro features with a monthly subscription.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center bg-ledger text-paper px-4 py-3 rounded-sm font-semibold text-sm"
            >
              Sign in to subscribe
            </Link>
          </div>

          <div className="border border-ink/15 rounded-sm p-6 flex flex-col gap-3">
            <div className="font-display font-bold text-sm">WholeClaim Pro</div>
            <div className="font-mono text-3xl font-extrabold text-ledger">
              $49<span className="text-base font-sans font-normal text-ink/50"> one-time</span>
            </div>
            <p className="text-sm text-ink/60 flex-1">
              Unlock WholeClaim Pro features for this claim permanently.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center border-2 border-ledger text-ledger px-4 py-3 rounded-sm font-semibold text-sm"
            >
              Sign in first
            </Link>
          </div>
        </div>
      )}

      {/* Scan to grade a claim free — customer-acquisition QR (Decision
         #29: the free grader is the front door). Generated locally,
         no external service. */}
      <div className="border border-ink/15 rounded-sm p-8 flex flex-col items-center text-center gap-4">
        <h2 className="font-display text-xs font-bold uppercase tracking-[0.1em] text-ink/60">
          Scan to grade a claim, free
        </h2>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrDataUrl}
          alt={`QR code linking to ${QR_TARGET}`}
          width={240}
          height={240}
          className="rounded-sm"
        />
        <p className="text-xs text-ink/50 font-mono">{QR_TARGET}</p>
      </div>
    </main>
  );
}
