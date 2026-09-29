"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { PRO_SUBSCRIPTION } from "@/lib/pricing";

// Homepage pricing card, signed-in state only — the server component in
// page.tsx renders this instead of the "Sign in to subscribe" link once
// it already knows (via the same isSignedIn check the hero uses) that
// there's a session. Same checkout contract as UpgradeOptions.tsx
// (POST /api/stripe/checkout, purchaseType: "subscription"), kept as a
// separate component so the homepage's hp-* button styling doesn't have
// to match UpgradeOptions' ledger-styled card.
export function HomeSubscribeButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchaseType: "subscription" }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error ?? "Could not start checkout. Try again.");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Could not start checkout. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={startCheckout}
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 bg-hp-pine hover:bg-hp-pine-deep text-white px-4 py-3 rounded-[10px] font-bold text-sm transition-colors disabled:opacity-50"
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        {loading ? "Starting checkout…" : PRO_SUBSCRIPTION.buttonLabel}
      </button>
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
