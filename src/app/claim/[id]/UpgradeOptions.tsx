"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

// Billing Build Order Step 4 — the dual purchase UI. Replaces the single
// hidden-cohort "Upgrade to Pro" button (LossOfUseTracker.tsx previously
// called checkout with no explicit choice; the server auto-assigned one).
// Copy is deliberately plain: what's included, the price, nothing about
// claim outcomes (Decision #2/#25 — never implies a result).
//
// claimId is optional (Pre-Launch Prep: Pricing Connection, 2026-07-19) —
// the subscription is account-level and never needed it; /pricing renders
// this component with no claim in context at all.
//
// lifetimeRedirectHref (Pricing Page Lifetime Unlock Routing Update,
// 2026-07-19) — when there's no claimId, /pricing pre-computes which
// claim-scoped page to send the user to (new-claim form, the single
// existing claim, or the claim list) and passes the resulting URL here.
// This component still never creates a checkout session without a
// claimId — it's a plain navigation link, not a second checkout path.
export function UpgradeOptions({
  claimId,
  lifetimeRedirectHref,
}: {
  claimId?: string;
  lifetimeRedirectHref?: string;
}) {
  const [loadingType, setLoadingType] = useState<"subscription" | "lifetime" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(purchaseType: "subscription" | "lifetime") {
    if (purchaseType === "lifetime" && !claimId) return;
    setLoadingType(purchaseType);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          purchaseType === "lifetime" ? { purchaseType, claimId } : { purchaseType },
        ),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error ?? "Could not start checkout. Try again.");
        setLoadingType(null);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Could not start checkout. Try again.");
      setLoadingType(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="border border-ink/15 rounded-sm p-4 flex flex-col gap-2">
          <div className="font-display font-bold text-sm">WholeClaim Pro</div>
          <div className="font-mono text-2xl font-extrabold text-ledger">
            $19<span className="text-sm font-sans font-normal text-ink/50">/month</span>
          </div>
          <p className="text-xs text-ink/60 flex-1">
            Unlock WholeClaim Pro features with a monthly subscription.
          </p>
          <button
            type="button"
            onClick={() => startCheckout("subscription")}
            disabled={loadingType !== null}
            className="inline-flex items-center justify-center gap-2 bg-ledger text-paper px-4 py-2 rounded-sm font-semibold text-sm disabled:opacity-50"
          >
            {loadingType === "subscription" && <Loader2 size={14} className="animate-spin" />}
            {loadingType === "subscription" ? "Starting checkout…" : "Upgrade to Pro"}
          </button>
        </div>

        <div className="border border-ink/15 rounded-sm p-4 flex flex-col gap-2">
          <div className="font-display font-bold text-sm">WholeClaim Pro</div>
          <div className="font-mono text-2xl font-extrabold text-ledger">
            $49<span className="text-sm font-sans font-normal text-ink/50"> one-time</span>
          </div>
          <p className="text-xs text-ink/60 flex-1">
            Unlock WholeClaim Pro features for this claim permanently.
          </p>
          {claimId ? (
            <button
              type="button"
              onClick={() => startCheckout("lifetime")}
              disabled={loadingType !== null}
              className="inline-flex items-center justify-center gap-2 border-2 border-ledger text-ledger px-4 py-2 rounded-sm font-semibold text-sm disabled:opacity-50"
            >
              {loadingType === "lifetime" && <Loader2 size={14} className="animate-spin" />}
              {loadingType === "lifetime" ? "Starting checkout…" : "Unlock This Claim"}
            </button>
          ) : lifetimeRedirectHref ? (
            <Link
              href={lifetimeRedirectHref}
              className="inline-flex items-center justify-center gap-2 border-2 border-ledger text-ledger px-4 py-2 rounded-sm font-semibold text-sm"
            >
              Choose a claim to unlock
            </Link>
          ) : (
            <>
              <button
                type="button"
                disabled
                className="inline-flex items-center justify-center gap-2 border-2 border-ledger text-ledger px-4 py-2 rounded-sm font-semibold text-sm disabled:opacity-50"
              >
                Open a claim to unlock it
              </button>
              <p className="text-xs text-ink/40">
                This unlocks one specific claim — open a claim first to buy it.
              </p>
            </>
          )}
        </div>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
