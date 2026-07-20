"use client";

import { AIToolCard } from "./AIToolCard";

// Pro, Phase 1 (Roadmap): "Detects water-loss dates, warns when
// documentation/reporting deadlines may become important, encourages
// prompt mitigation — never a legal conclusion." Unlike PD/GA, this tool
// needs no freeform paste — the timeline is auto-detected from the claim's
// own date_of_loss, entries, and evidence checklist (buildMoldSignals in
// src/lib/anthropic/context.ts), so it's a single Run button.
export function MoldTimelineCard({ claimId }: { claimId: string }) {
  async function run() {
    const res = await fetch("/api/ai/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool: "mold", claimId, input: "" }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error ?? "Something went wrong. Try again." };
    }
    return { output: data.output as string };
  }

  return (
    <AIToolCard
      title="Mold Coverage Timeline"
      description="Builds a timeline from your date of loss and logged entries — why timing matters and what to document now."
      runLabel="Build my timeline"
      canRun={true}
      onRun={run}
    />
  );
}
