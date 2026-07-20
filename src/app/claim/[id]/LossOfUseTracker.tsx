"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { addLossOfUseExpense, deleteLossOfUseExpense } from "../actions";
import {
  LOSS_OF_USE_CATEGORIES,
  computeLossOfUseSummary,
  type LossOfUseExpense,
} from "@/lib/lossOfUse";
import { UpgradeOptions } from "./UpgradeOptions";

const currency = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export function LossOfUseTracker({
  claimId,
  expenses,
  isPro,
}: {
  claimId: string;
  expenses: LossOfUseExpense[];
  isPro: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const summary = computeLossOfUseSummary(expenses);

  return (
    <div className="border border-ink/15 rounded-sm">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div>
          <div className="font-display font-bold text-sm">Loss-of-Use Tracker</div>
          <div className="text-xs text-ink/50">
            Hotels, meals, laundry, storage, mileage, pet boarding — logged and summarized.
          </div>
        </div>
        {expanded ? (
          <ChevronUp size={16} className="text-ink/40 shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-ink/40 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-ink/10 pt-4 flex flex-col gap-4">
          {!isPro ? (
            <>
              <p className="text-sm text-ink/70 leading-relaxed">
                Most policies with loss-of-use (Coverage D) reimburse
                reasonable additional living expenses while your home is
                uninhabitable. This tracker logs each expense as you go and
                totals them by category so you have a clean reimbursement
                record — no spreadsheet required. Loss-of-Use Tracker is a
                Pro feature.
              </p>
              <UpgradeOptions claimId={claimId} />
            </>
          ) : (
            <>
              <form
                action={async (formData) => {
                  await addLossOfUseExpense(claimId, formData);
                }}
                className="flex flex-col gap-2"
              >
                <div className="flex gap-2">
                  <input
                    type="date"
                    name="date"
                    required
                    className="text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white font-mono"
                  />
                  <select
                    name="category"
                    defaultValue="hotel"
                    className="flex-1 text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white"
                  >
                    {LOSS_OF_USE_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <input
                    name="amount"
                    inputMode="decimal"
                    placeholder="Amount ($)"
                    required
                    className="w-28 text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white font-mono"
                  />
                </div>
                <input
                  name="description"
                  placeholder="Note — hotel name, mileage detail, etc. (optional)"
                  className="text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white"
                />
                <button className="self-start bg-ledger text-paper px-4 py-2 rounded-sm font-semibold text-sm">
                  Log expense
                </button>
              </form>

              <div className="border border-ink/15 rounded-sm">
                {expenses.length > 0 ? (
                  expenses.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm border-t border-ink/10 first:border-t-0"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-ink/50">{e.date}</span>
                          <span className="text-xs font-mono uppercase text-ledger">
                            {LOSS_OF_USE_CATEGORIES.find((c) => c.value === e.category)?.label ??
                              e.category}
                          </span>
                        </div>
                        {e.description && (
                          <p className="text-xs text-ink/60 truncate">{e.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-mono text-sm">{currency(e.amount)}</span>
                        <form
                          action={async () => {
                            await deleteLossOfUseExpense(claimId, e.id);
                          }}
                        >
                          <button
                            type="submit"
                            aria-label="Delete expense"
                            className="text-ink/30 hover:text-red-700"
                          >
                            <Trash2 size={14} />
                          </button>
                        </form>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="px-3 py-3 text-sm text-ink/50">
                    Nothing logged yet. Add the first expense above.
                  </p>
                )}
              </div>

              {expenses.length > 0 && (
                <div className="border-2 border-ledger bg-ledger/10 rounded-sm p-4">
                  <div className="font-display text-xs font-bold uppercase tracking-wide text-ledger mb-2">
                    Reimbursement summary
                  </div>
                  <div className="flex flex-col gap-1 mb-3">
                    {summary.byCategory.map((c) => (
                      <div key={c.category} className="flex justify-between text-sm">
                        <span className="text-ink/70">
                          {c.label} ({c.count})
                        </span>
                        <span className="font-mono">{currency(c.total)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between font-mono text-lg font-extrabold text-ledger border-t border-ledger/30 pt-2">
                    <span className="font-display text-xs font-bold uppercase tracking-wide self-center">
                      Total
                    </span>
                    <span>{currency(summary.total)}</span>
                  </div>
                </div>
              )}

              <p className="text-xs text-ink/40 italic">
                WholeClaim is a self-help documentation tool, not legal or
                insurance advice. Keep receipts for everything logged here —
                most carriers require proof of payment for reimbursement.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
