"use client";

import { useEffect, useState, useTransition } from "react";
import { EvidenceRow } from "./EvidenceRow";
import { restoreEvidenceItem, type DeletedEvidenceItem } from "../actions";

const UNDO_MS = 5000;

// The checklist rows plus the "Item deleted — Undo" bar. The delete itself
// happens immediately on the server; Undo re-inserts the same row, so
// leaving the page during the 5 seconds can't strand anything.
export function EvidenceChecklist({
  claimId,
  items,
  fileNames,
}: {
  claimId: string;
  items: {
    id: string;
    label: string;
    checked: boolean;
    category: string | null;
    file_id: string | null;
    notApplicable: boolean;
  }[];
  fileNames: Record<string, string>;
}) {
  const [deleted, setDeleted] = useState<DeletedEvidenceItem | null>(null);
  const [undoError, setUndoError] = useState<string | null>(null);
  const [restoring, startRestore] = useTransition();
  const [showNotApplicable, setShowNotApplicable] = useState(true);
  const notApplicableCount = items.filter((i) => i.notApplicable).length;
  const visible = showNotApplicable ? items : items.filter((i) => !i.notApplicable);

  useEffect(() => {
    if (!deleted) return;
    const timer = setTimeout(() => setDeleted(null), UNDO_MS);
    return () => clearTimeout(timer);
  }, [deleted]);

  function undo() {
    if (!deleted) return;
    const item = deleted;
    startRestore(async () => {
      const result = await restoreEvidenceItem(claimId, item);
      if (result.ok) {
        setDeleted(null);
        setUndoError(null);
      } else {
        setUndoError(result.error);
      }
    });
  }

  return (
    <>
      {items.length > 0 ? (
        visible.map((item) => (
          // The tick state is part of the key so a server-side change
          // (attach ticks, deleting the linked file unticks) redraws the
          // row instead of leaving the old checkbox state on screen.
          <EvidenceRow
            key={`${item.id}:${item.checked}:${item.file_id ?? ""}:${item.notApplicable}`}
            claimId={claimId}
            item={item}
            fileName={item.file_id ? fileNames[item.file_id] ?? null : null}
            onDeleted={(d) => {
              setUndoError(null);
              setDeleted(d);
            }}
          />
        ))
      ) : (
        <p className="px-3 py-3 text-sm text-ink/50">Nothing logged yet. The first entry takes thirty seconds.</p>
      )}
      {notApplicableCount > 0 && (
        <button
          type="button"
          onClick={() => setShowNotApplicable((v) => !v)}
          className="w-full text-left px-3 py-2 text-xs text-ink/50 border-t border-ink/10 hover:text-ink"
        >
          {showNotApplicable
            ? `Hide ${notApplicableCount} not-applicable ${notApplicableCount === 1 ? "item" : "items"}`
            : `Show ${notApplicableCount} not-applicable ${notApplicableCount === 1 ? "item" : "items"}`}
        </button>
      )}
      {deleted && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 px-3 py-2 text-sm border-t border-ink/10 bg-ink/5"
        >
          <span className="truncate">Item deleted — &ldquo;{deleted.label}&rdquo;</span>
          <button
            type="button"
            onClick={undo}
            disabled={restoring}
            className="text-xs font-semibold text-ledger underline shrink-0 disabled:opacity-50"
          >
            Undo
          </button>
        </div>
      )}
      {undoError && <p className="px-3 py-2 text-xs text-red-700 border-t border-ink/10">{undoError}</p>}
    </>
  );
}
