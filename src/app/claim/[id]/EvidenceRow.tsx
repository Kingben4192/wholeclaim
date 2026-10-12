"use client";

import { useState, useTransition } from "react";
import { Paperclip, Pencil, Trash2 } from "lucide-react";
import {
  toggleEvidenceItem,
  renameEvidenceItem,
  deleteEvidenceItem,
  setEvidenceItemNotApplicable,
  type DeletedEvidenceItem,
} from "../actions";
import { EvidenceUpload } from "./EvidenceUpload";
import { safetyNoteForLabel } from "@/lib/scoring/checklistTemplates";
import { MAX_CHECKLIST_LABEL_LENGTH } from "@/lib/evidenceUpload";

export function EvidenceRow({
  claimId,
  item,
  fileName,
  onDeleted,
}: {
  claimId: string;
  item: { id: string; label: string; checked: boolean; category: string | null; notApplicable: boolean };
  // Name of the Vault file attached to this item, if any.
  fileName: string | null;
  // Called after a successful delete, so the list can offer Undo.
  onDeleted?: (item: DeletedEvidenceItem) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.label);
  const [error, setError] = useState<string | null>(null);
  const safetyNote = safetyNoteForLabel(item.label);
  // Template items (seeded for the claim type) carry a category and stay
  // fixed; items the user made, or a Vault upload made, can be renamed or
  // removed.
  const editable = item.category === null;

  function toggleNotApplicable() {
    setError(null);
    startTransition(async () => {
      const result = await setEvidenceItemNotApplicable(claimId, item.id, !item.notApplicable);
      if (!result.ok) setError(result.error);
    });
  }

  function saveRename() {
    setError(null);
    startTransition(async () => {
      const result = await renameEvidenceItem(claimId, item.id, draft);
      if (result.ok) setEditing(false);
      else setError(result.error);
    });
  }

  function remove() {
    const note = fileName ? " The attached file stays in your Evidence Vault." : "";
    if (!window.confirm(`Remove "${item.label}" from the checklist?${note}`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteEvidenceItem(claimId, item.id);
      if (result.ok) onDeleted?.(result.deleted);
      else setError(result.error);
    });
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-1 px-3 py-2.5 text-sm border-t border-ink/10 first:border-t-0">
        <div className="flex items-center gap-2">
          <label htmlFor={`rename-${item.id}`} className="sr-only">
            Item name
          </label>
          <input
            id={`rename-${item.id}`}
            value={draft}
            maxLength={MAX_CHECKLIST_LABEL_LENGTH}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveRename();
              if (e.key === "Escape") setEditing(false);
            }}
            autoFocus
            className="flex-1 text-sm px-2 py-1 rounded-sm border border-ink/20 bg-white"
          />
          <button
            type="button"
            onClick={saveRename}
            disabled={pending}
            className="text-xs font-semibold text-ledger disabled:opacity-50"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(item.label);
              setError(null);
              setEditing(false);
            }}
            className="text-xs font-semibold text-ink/60"
          >
            Cancel
          </button>
        </div>
        {error && <p className="text-xs text-red-700">{error}</p>}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col px-3 py-2.5 text-sm border-t border-ink/10 first:border-t-0 ${item.notApplicable ? "opacity-50" : ""}`}
    >
      <div className="flex items-center gap-3">
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
            <span className={`block truncate ${item.checked ? "text-ink" : "text-ink/60"}`}>{item.label}</span>
            {fileName && (
              <span className="flex items-center gap-1 text-xs text-ink/50 mt-0.5 min-w-0">
                <Paperclip size={11} className="shrink-0" />
                <span className="truncate">{fileName}</span>
              </span>
            )}
            {item.notApplicable && (
              <span className="block text-xs text-ink/60 mt-0.5">
                Marked not applicable — still counts toward your Documentation Score
              </span>
            )}
            {safetyNote && <span className="block text-xs text-brass mt-0.5">{safetyNote}</span>}
          </span>
        </label>
        {editable && (
          <>
            <button
              type="button"
              onClick={() => {
                setDraft(item.label);
                setEditing(true);
              }}
              disabled={pending}
              className="text-ink/40 hover:text-ink shrink-0"
              aria-label={`Rename ${item.label}`}
            >
              <Pencil size={13} />
            </button>
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              className="text-ink/40 hover:text-red-700 shrink-0"
              aria-label={`Remove ${item.label}`}
            >
              <Trash2 size={13} />
            </button>
          </>
        )}
        {!editable && (
          <button
            type="button"
            onClick={toggleNotApplicable}
            disabled={pending}
            className="text-xs text-ink/50 hover:text-ink shrink-0 disabled:opacity-50"
          >
            {item.notApplicable ? "Mark applicable" : "Not applicable"}
          </button>
        )}
        {!item.notApplicable && <EvidenceUpload claimId={claimId} evidenceItemId={item.id} />}
      </div>
      {error && <p className="text-xs text-red-700 mt-1">{error}</p>}
    </div>
  );
}
