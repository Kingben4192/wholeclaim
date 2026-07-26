"use client";

import { useTransition } from "react";
import { toggleEvidenceItem } from "../actions";
import { EvidenceUpload } from "./EvidenceUpload";
import { safetyNoteForLabel } from "@/lib/scoring/checklistTemplates";

export function EvidenceRow({
  claimId,
  item,
}: {
  claimId: string;
  item: { id: string; label: string; checked: boolean };
}) {
  const [pending, startTransition] = useTransition();
  const safetyNote = safetyNoteForLabel(item.label);

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 text-sm border-t border-ink/10 first:border-t-0">
      <label className="flex items-center gap-3 flex-1 cursor-pointer min-w-0">
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
          className="w-4 h-4 accent-current text-ledger shrink-0"
        />
        <span className="flex-1 min-w-0">
          <span className={`block truncate ${item.checked ? "text-ink" : "text-ink/60"}`}>
            {item.label}
          </span>
          {safetyNote && (
            <span className="block text-xs text-amber-700 mt-0.5">{safetyNote}</span>
          )}
        </span>
      </label>
      <EvidenceUpload claimId={claimId} evidenceItemId={item.id} />
    </div>
  );
}
