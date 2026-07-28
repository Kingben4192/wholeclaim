"use client";

import { useState, useTransition } from "react";
import { setClaimCategory } from "../actions";
import { CLAIM_CATEGORIES } from "@/lib/claimCategories";
import { UpgradeOptions } from "./UpgradeOptions";

// Decision #86 -- the only place a grader-converted claim (claim_category
// null, from-grade/route.ts never asks) ever gets categorized. Renders in
// place of the entire claim page until resolved -- no evidence vault, no
// AI tools, nothing else is reachable, matching how ClaimWizard.tsx
// blocks progress on the same gate at creation time.
type BlockedGate = { reason: "ACTIVE_CLAIM_EXISTS_IN_CATEGORY" | "CATEGORY_HISTORY_EXISTS"; blockingClaimIds: string[] };

export function CategoryRequiredGate({ claimId }: { claimId: string }) {
  const [pending, startTransition] = useTransition();
  const [blockedGate, setBlockedGate] = useState<BlockedGate | null>(null);
  const [error, setError] = useState<string | null>(null);

  function pick(category: string) {
    setError(null);
    setBlockedGate(null);
    startTransition(async () => {
      const res = await setClaimCategory(claimId, category);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if ("blocked" in res && res.blocked) {
        setBlockedGate({ reason: res.gate.reason, blockingClaimIds: res.gate.blockingClaimIds });
        return;
      }
      // Success -- setClaimCategory already revalidated /claim/[id]; the
      // page re-renders past this gate on its own, nothing to do here.
    });
  }

  return (
    <main className="max-w-md mx-auto px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-wider text-ink/50 mb-2">
        One more thing
      </p>
      <h1 className="font-display text-2xl font-extrabold mb-3">
        What kind of dispute is this?
      </h1>
      <p className="text-sm text-ink/60 mb-6">
        This claim came from your Claim Grade result. Pick a category to open the rest of
        your claim file.
      </p>

      {blockedGate ? (
        <div className="border border-red-200 bg-red-50 rounded-sm p-4 text-sm flex flex-col gap-3">
          <p className="text-red-800 font-semibold">
            {blockedGate.reason === "ACTIVE_CLAIM_EXISTS_IN_CATEGORY"
              ? "You already have an active claim in this category."
              : "You've already used your free claim for this category."}
          </p>
          <p className="text-ink/70">
            Upgrade to WholeClaim Pro to manage unlimited property documentation workflows.
          </p>
          <UpgradeOptions lifetimeRedirectHref={`/claim/${blockedGate.blockingClaimIds[0]}`} />
          <button
            type="button"
            onClick={() => setBlockedGate(null)}
            className="text-xs font-semibold text-ink/60 underline self-start"
          >
            Try a different category
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {CLAIM_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              disabled={pending}
              onClick={() => pick(category)}
              className="w-full text-left border border-ink/15 rounded-sm px-4 py-3 text-sm font-medium hover:bg-ledger/5 disabled:opacity-50"
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-700 mt-3">{error}</p>}
    </main>
  );
}
