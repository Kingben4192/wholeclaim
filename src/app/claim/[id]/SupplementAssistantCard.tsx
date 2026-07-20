"use client";

import { useState } from "react";
import { AIToolCard } from "./AIToolCard";

// Pro, Phase 1 (Roadmap): "Explains what a supplement is, identifies gaps
// between carrier and contractor estimates, drafts a supplement request
// from the user's own evidence." Distinct from the Estimate Gap Analyzer
// (single freeform blob, analysis only) — this takes two structured
// estimates and ends in a ready-to-copy letter, same shape discipline as
// Letter Builder's own supplement type (supplement-not-new-occurrence,
// 14-day deadline, self-help closing line).
export function SupplementAssistantCard({ claimId }: { claimId: string }) {
  const [carrierEstimate, setCarrierEstimate] = useState("");
  const [contractorEstimate, setContractorEstimate] = useState("");

  async function run() {
    const res = await fetch("/api/ai/supplement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claimId, carrierEstimate, contractorEstimate }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error ?? "Something went wrong. Try again." };
    }
    return { output: data.output as string };
  }

  return (
    <AIToolCard
      title="Supplement Assistant"
      description="Compare the carrier's estimate to your contractor's — find the gaps, draft the request."
      runLabel="Find gaps and draft request"
      canRun={carrierEstimate.trim().length > 0 || contractorEstimate.trim().length > 0}
      onRun={run}
    >
      <div className="flex flex-col gap-2">
        <label>
          <span className="block text-xs font-semibold uppercase tracking-wide mb-1 text-ink/60">
            Carrier estimate (line items or summary)
          </span>
          <textarea
            value={carrierEstimate}
            onChange={(e) => setCarrierEstimate(e.target.value)}
            placeholder="Paste or type the carrier's estimate line items..."
            rows={4}
            className="w-full text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white"
          />
        </label>
        <label>
          <span className="block text-xs font-semibold uppercase tracking-wide mb-1 text-ink/60">
            Contractor estimate or your own scope of damage
          </span>
          <textarea
            value={contractorEstimate}
            onChange={(e) => setContractorEstimate(e.target.value)}
            placeholder="Paste your contractor's estimate, or describe what's actually damaged..."
            rows={4}
            className="w-full text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white"
          />
        </label>
      </div>
    </AIToolCard>
  );
}
