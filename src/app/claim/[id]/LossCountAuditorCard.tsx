"use client";

import { useState } from "react";
import { AIToolCard } from "./AIToolCard";

export function LossCountAuditorCard({ claimId }: { claimId: string }) {
  const [input, setInput] = useState("");

  async function run() {
    const res = await fetch("/api/ai/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool: "loss", claimId, input }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error ?? "Something went wrong. Try again." };
    }
    return { output: data.output as string };
  }

  return (
    <AIToolCard
      title="Loss-Count Auditor"
      description="Checks whether a supplemental payment could be getting counted as a separate occurrence."
      runLabel="Audit my occurrence count"
      canRun={input.trim().length > 0}
      onRun={run}
    >
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Describe the claim and payment history — dates, amounts, claim numbers, any non-renewal notice..."
        rows={5}
        className="w-full text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white"
      />
    </AIToolCard>
  );
}
