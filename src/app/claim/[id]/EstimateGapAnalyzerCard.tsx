"use client";

import { useState } from "react";
import { AIToolCard } from "./AIToolCard";

export function EstimateGapAnalyzerCard({ claimId }: { claimId: string }) {
  const [input, setInput] = useState("");

  async function run() {
    const res = await fetch("/api/ai/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool: "gap", claimId, input }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error ?? "Something went wrong. Try again." };
    }
    return { output: data.output as string };
  }

  return (
    <AIToolCard
      title="Estimate Gap Analyzer"
      description="Contractor-grade scrutiny of the carrier's scope — likely missing trades and underpaid items."
      runLabel="Audit the estimate"
      canRun={input.trim().length > 0}
      onRun={run}
    >
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Describe the carrier's estimate and the actual damage — trades covered, line items, scope..."
        rows={5}
        className="w-full text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white"
      />
    </AIToolCard>
  );
}
