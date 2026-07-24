"use client";

import { useTransition } from "react";
import { updateClaimStatus } from "../actions";
import { CLAIM_STATUSES, type ClaimStatus } from "@/lib/claimCategories";

const STATUS_LABEL: Record<ClaimStatus, string> = {
  active: "Active",
  resolved: "Resolved",
  archived: "Archived",
  closed: "Closed",
};

// Claim lifecycle status (Decision #44) — proposed default: unrestricted,
// self-service, either direction, matching EvidenceRow.tsx's inline-toggle
// pattern. No state machine — the category-limit consequences of a status
// change live entirely in claimCategoryGate.ts, not here.
export function ClaimStatusControl({
  claimId,
  status,
}: {
  claimId: string;
  status: ClaimStatus;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-ink/50">Status</span>
        <select
          value={status}
          disabled={pending}
          onChange={(e) => {
            const next = e.target.value as ClaimStatus;
            startTransition(() => {
              updateClaimStatus(claimId, next);
            });
          }}
          className="text-sm px-2 py-1 rounded-sm border border-ink/20 bg-white disabled:opacity-50"
        >
          {CLAIM_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </label>
      {status !== "active" && (
        <p className="text-xs text-ink/50 max-w-xs">
          Resolved, archived, and closed all free this category up for the
          duplicate-claim prompt — but a free plan still won&apos;t allow a new
          active claim in the same category afterward without Pro or a
          reviewed exception.
        </p>
      )}
    </div>
  );
}
