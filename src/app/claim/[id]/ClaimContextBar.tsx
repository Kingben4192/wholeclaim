"use client";

import { useState, useTransition } from "react";
import { updateClaimLabel } from "../actions";
import { getClaimDisplayTitle } from "@/lib/claimDisplay";

// Decision #70 — persistent (sticky) claim-context bar. Originally showed
// only carrier/claim number/damage category (no address field existed in
// the schema). Decision #75 adds a required `label` field specifically to
// solve the ambiguity #70 couldn't: carrier and claim number are both
// optional, so two claims in the same category could render identically.
// Label is now the primary line; carrier/claim number/damage category stay
// as secondary metadata underneath, never removed.
//
// createdAt fallback: pre-#75 claims have label = NULL (no backfill, see
// Decisions.md #75) and show "Claim created {month year}" until the user
// sets one via the inline edit below — at which point their value
// permanently replaces the fallback everywhere it's read.
export function ClaimContextBar({
  claimId,
  label,
  createdAt,
  carrier,
  claimNumber,
  damageCategory,
}: {
  claimId: string;
  label: string | null;
  createdAt: string;
  carrier: string | null;
  claimNumber: string | null;
  damageCategory: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(label ?? "");
  const [pending, startTransition] = useTransition();

  const displayTitle = getClaimDisplayTitle({ label, created_at: createdAt });

  function save() {
    const trimmed = value.trim();
    if (!trimmed || trimmed === label) {
      setValue(label ?? "");
      setEditing(false);
      return;
    }
    startTransition(() => {
      updateClaimLabel(claimId, trimmed);
    });
    setEditing(false);
  }

  return (
    <div className="sticky top-0 z-10 -mx-6 sm:mx-0 px-6 sm:px-3 py-2 bg-paper/95 backdrop-blur-sm border-b border-ink/10 sm:rounded-sm sm:border">
      {editing ? (
        <input
          autoFocus
          value={value}
          maxLength={60}
          disabled={pending}
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") {
              setValue(label ?? "");
              setEditing(false);
            }
          }}
          className="w-full text-sm font-semibold px-1.5 py-0.5 -mx-1.5 rounded-sm border border-ledger/40 bg-white"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-sm font-semibold truncate text-left hover:underline decoration-dotted"
        >
          {displayTitle}
        </button>
      )}
      <p className="text-xs font-mono text-ink/50 truncate mt-0.5">
        {carrier || "Unnamed carrier"}
        {claimNumber && <span> · {claimNumber}</span>}
        {damageCategory && <span> · {damageCategory}</span>}
      </p>
    </div>
  );
}
