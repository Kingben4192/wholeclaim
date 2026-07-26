"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { addPromisedItem, deletePromisedItem } from "../actions";
import { EvidenceUpload } from "./EvidenceUpload";
import { statusForPromisedItem, type PromisedItemStatus } from "@/lib/promisedItems";
import { DerivedValueNote } from "./DerivedValueNote";

type PromisedItem = {
  id: string;
  description: string;
  promised_by: string | null;
  promised_date: string;
  target_date: string | null;
  file_id: string | null;
};

const STATUS_LABEL: Record<PromisedItemStatus, string> = {
  received: "Received",
  overdue: "Overdue",
  aging: "Aging",
  promised: "Promised",
};

const STATUS_COLOR: Record<PromisedItemStatus, string> = {
  received: "text-emerald-700 bg-emerald-50",
  overdue: "text-red-700 bg-red-50",
  aging: "text-amber-700 bg-amber-50",
  promised: "text-ink/60 bg-ink/5",
};

function Row({ claimId, item }: { claimId: string; item: PromisedItem }) {
  const [pending, startTransition] = useTransition();
  const status = statusForPromisedItem(item);

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 text-sm border-t border-ink/10 first:border-t-0">
      <div className="flex-1 min-w-0">
        <p className="truncate">{item.description}</p>
        <p className="text-xs text-ink/50">
          {item.promised_by && `${item.promised_by} — `}
          promised {item.promised_date}
          {item.target_date && `, expected ${item.target_date}`}
        </p>
      </div>
      <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${STATUS_COLOR[status]}`}>
        {STATUS_LABEL[status]}
      </span>
      {status !== "received" && <EvidenceUpload claimId={claimId} promisedItemId={item.id} />}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm(`Remove "${item.description}" from the tracker?`)) return;
          startTransition(() => {
            deletePromisedItem(claimId, item.id);
          });
        }}
        className="text-ink/40 hover:text-red-700 disabled:opacity-50"
        aria-label={`Remove ${item.description}`}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

export function PromisedDocumentTracker({ claimId, items }: { claimId: string; items: PromisedItem[] }) {
  const boundAdd = addPromisedItem.bind(null, claimId);

  return (
    <section>
      <h2 className="font-display text-xs font-bold uppercase tracking-[0.1em] text-ink/60 mb-1">
        Promised Documents
      </h2>
      <DerivedValueNote source="computed" className="mb-3">
        Status below is calculated from the dates you enter, not read from
        any document. Update a date if it changes — the status recalculates
        automatically.
      </DerivedValueNote>
      <div className="border border-ink/15 rounded-sm mb-4">
        {items.length > 0 ? (
          items.map((item) => <Row key={item.id} claimId={claimId} item={item} />)
        ) : (
          <p className="px-3 py-3 text-sm text-ink/50">
            Nothing tracked yet. Log it when a carrier says a document is coming.
          </p>
        )}
      </div>
      <form action={boundAdd} className="flex flex-col gap-2">
        <input
          name="description"
          required
          placeholder="What was promised (e.g. Denial letter)"
          className="text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white"
        />
        <div className="flex gap-2">
          <input
            name="promised_by"
            placeholder="Who said it (optional)"
            className="flex-1 text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white"
          />
          <input
            name="target_date"
            type="date"
            aria-label="Expected date (optional)"
            className="text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white"
          />
        </div>
        <button className="self-start bg-ledger text-paper px-4 py-2 rounded-sm font-semibold text-sm">
          Track it
        </button>
      </form>
    </section>
  );
}
