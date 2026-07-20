"use client";

import { useState, useTransition } from "react";
import { approveEntry, rejectEntry } from "./actions";

const CONFIDENCE_COLOR: Record<string, string> = {
  high: "text-ledger",
  medium: "text-amber-700",
  low: "text-red-700",
};

export function DraftRow({
  entry,
}: {
  entry: {
    id: string;
    type: string;
    jurisdiction: string;
    cite: string;
    summary: string;
    confidence: string | null;
    verify_note: string | null;
  };
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [gone, setGone] = useState(false);

  function run(action: (id: string) => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await action(entry.id);
        setGone(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  if (gone) return null;

  return (
    <div className="px-4 py-3 border-t border-ink/10 first:border-t-0 text-sm">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-mono uppercase text-ledger">{entry.type}</span>
        <span className="text-xs text-ink/50">{entry.jurisdiction}</span>
        {entry.confidence && (
          <span className={`text-xs font-semibold uppercase ${CONFIDENCE_COLOR[entry.confidence] ?? ""}`}>
            {entry.confidence} confidence
          </span>
        )}
      </div>
      <p className="font-semibold mb-1">{entry.cite}</p>
      <p className="text-ink/80 mb-1">{entry.summary}</p>
      {entry.verify_note && (
        <p className="text-xs text-amber-700 italic mb-2">Verify: {entry.verify_note}</p>
      )}
      <div className="flex gap-3 mt-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => run(approveEntry)}
          className="text-xs font-semibold uppercase tracking-wide text-ledger disabled:opacity-50"
        >
          Approve
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(rejectEntry)}
          className="text-xs font-semibold uppercase tracking-wide text-red-700 disabled:opacity-50"
        >
          Reject
        </button>
      </div>
      {error && <p className="text-xs text-red-700 mt-2">{error}</p>}
    </div>
  );
}
