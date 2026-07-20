"use client";

import { useState } from "react";
import { AIToolCard } from "./AIToolCard";

export function DecisionAssistantCard({ claimId }: { claimId: string }) {
  const [offer, setOffer] = useState("");
  const [estimate, setEstimate] = useState("");
  const [months, setMonths] = useState("");
  const [disputed, setDisputed] = useState("");

  async function run() {
    const res = await fetch("/api/ai/decide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claimId, offer, estimate, months, disputed }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error ?? "Something went wrong. Try again." };
    }
    return { output: data.output as string };
  }

  return (
    <AIToolCard
      title="Decision Assistant"
      description="A sign-or-accept framework for evaluating a settlement offer — the decision is always yours."
      runLabel="Build my decision framework"
      canRun={offer.trim().length > 0 && estimate.trim().length > 0}
      onRun={run}
    >
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <label className="flex-1">
            <span className="block text-xs font-semibold uppercase tracking-wide mb-1 text-ink/60">
              Carrier offer ($)
            </span>
            <input
              value={offer}
              onChange={(e) => setOffer(e.target.value)}
              inputMode="numeric"
              placeholder="18500"
              className="w-full text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white font-mono"
            />
          </label>
          <label className="flex-1">
            <span className="block text-xs font-semibold uppercase tracking-wide mb-1 text-ink/60">
              Your estimate ($)
            </span>
            <input
              value={estimate}
              onChange={(e) => setEstimate(e.target.value)}
              inputMode="numeric"
              placeholder="27000"
              className="w-full text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white font-mono"
            />
          </label>
        </div>
        <label>
          <span className="block text-xs font-semibold uppercase tracking-wide mb-1 text-ink/60">
            Months claim has been open
          </span>
          <input
            value={months}
            onChange={(e) => setMonths(e.target.value)}
            inputMode="numeric"
            placeholder="6"
            className="w-full text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white font-mono"
          />
        </label>
        <label>
          <span className="block text-xs font-semibold uppercase tracking-wide mb-1 text-ink/60">
            What&apos;s disputed (optional)
          </span>
          <textarea
            value={disputed}
            onChange={(e) => setDisputed(e.target.value)}
            placeholder="Roof depreciation schedule, missing trades, matching..."
            rows={2}
            className="w-full text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white"
          />
        </label>
      </div>
    </AIToolCard>
  );
}
