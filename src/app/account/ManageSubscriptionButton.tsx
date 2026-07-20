"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

// Pre-Launch Prep: Cancellation UI (2026-07-19). Routes to the Stripe
// Customer Portal via the existing /api/stripe/portal route — no
// cancellation logic lives here or anywhere in the app. Cancellation
// itself happens entirely inside Stripe's own portal; this app only
// finds out afterward via the webhook (customer.subscription.updated/
// deleted), same as every other subscription-lifecycle change.
export function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error ?? "Could not open billing portal. Try again.");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Could not open billing portal. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 items-start">
      <button
        type="button"
        onClick={openPortal}
        disabled={loading}
        className="inline-flex items-center gap-2 border-2 border-ledger text-ledger px-4 py-2 rounded-sm font-semibold text-sm disabled:opacity-50"
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        {loading ? "Opening…" : "Manage subscription"}
      </button>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
