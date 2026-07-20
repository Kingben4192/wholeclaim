"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

// Free tier, Phase 1 (Roadmap). Pure deterministic math + static
// educational copy — no AI call, no rate limit, no cap, matching the
// Claim Health Score's "deterministic layer, no invented numbers" pattern
// (Decision #9, Invariant). Recoverable depreciation is a fixed formula,
// not something that needs case-specific generation.
export function DepreciationCalculator() {
  const [expanded, setExpanded] = useState(false);
  const [rcv, setRcv] = useState("");
  const [acv, setAcv] = useState("");

  const rcvNum = parseFloat(rcv);
  const acvNum = parseFloat(acv);
  const hasValidInputs = !Number.isNaN(rcvNum) && !Number.isNaN(acvNum) && rcvNum >= 0 && acvNum >= 0;
  const recoverable = hasValidInputs ? Math.max(rcvNum - acvNum, 0) : null;

  const currency = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  return (
    <div className="border border-ink/15 rounded-sm">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div>
          <div className="font-display font-bold text-sm">Depreciation Calculator</div>
          <div className="text-xs text-ink/50">
            Why your first check is smaller than the estimate, and what&apos;s still owed.
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
          <div className="text-sm text-ink/80 leading-relaxed">
            <p className="mb-2">
              Most policies pay in two parts. <strong>RCV (Replacement Cost Value)</strong>{" "}
              is the full cost to repair or replace the damage with new materials.{" "}
              <strong>ACV (Actual Cash Value)</strong> is RCV minus depreciation —
              an estimate of the damaged item&apos;s value accounting for its age
              and wear. Carriers typically pay ACV first; the difference,{" "}
              <strong>recoverable depreciation</strong>, is released after you
              complete the repairs and submit proof — usually invoices or
              paid receipts.
            </p>
          </div>

          <div className="flex gap-2">
            <label className="flex-1">
              <span className="block text-xs font-semibold uppercase tracking-wide mb-1 text-ink/60">
                RCV — full estimate ($)
              </span>
              <input
                value={rcv}
                onChange={(e) => setRcv(e.target.value)}
                inputMode="decimal"
                placeholder="27000"
                className="w-full text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white font-mono"
              />
            </label>
            <label className="flex-1">
              <span className="block text-xs font-semibold uppercase tracking-wide mb-1 text-ink/60">
                ACV — payment received ($)
              </span>
              <input
                value={acv}
                onChange={(e) => setAcv(e.target.value)}
                inputMode="decimal"
                placeholder="19500"
                className="w-full text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white font-mono"
              />
            </label>
          </div>

          {recoverable !== null && (
            <div className="border-2 border-ledger bg-ledger/10 rounded-sm p-4">
              <div className="font-display text-xs font-bold uppercase tracking-wide text-ledger mb-1">
                Recoverable depreciation
              </div>
              <div className="font-mono text-2xl font-extrabold text-ledger">
                {currency(recoverable)}
              </div>
              <p className="text-xs text-ink/60 mt-2">
                This is RCV minus the payment already received — the amount
                you can typically request once repairs are complete and
                documented. Exact requirements (deadlines, required proof,
                whether your policy pays RCV at all) vary by policy — verify
                yours before relying on this figure.
              </p>
            </div>
          )}

          <p className="text-xs text-ink/40 italic">
            WholeClaim is a self-help documentation tool, not legal or
            insurance advice. This is a general calculation, not a
            claim-specific determination.
          </p>
        </div>
      )}
    </div>
  );
}
