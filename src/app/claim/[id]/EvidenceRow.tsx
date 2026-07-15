"use client";

import { useTransition } from "react";
import { toggleEvidenceItem } from "../actions";

export function EvidenceRow({
  claimId,
  item,
}: {
  claimId: string;
  item: { id: string; label: string; checked: boolean };
}) {
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-3 px-3 py-2.5 text-sm border-t border-ink/10 first:border-t-0 cursor-pointer">
      <input
        type="checkbox"
        defaultChecked={item.checked}
        disabled={pending}
        onChange={(e) => {
          const checked = e.target.checked;
          startTransition(() => {
            toggleEvidenceItem(claimId, item.id, checked);
          });
        }}
        className="w-4 h-4 accent-current text-ledger"
      />
      <span className={item.checked ? "text-ink" : "text-ink/60"}>
        {item.label}
      </span>
    </label>
  );
}
