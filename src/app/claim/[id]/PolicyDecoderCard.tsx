"use client";

import { useState } from "react";
import { AIToolCard } from "./AIToolCard";

export function PolicyDecoderCard({ claimId }: { claimId: string }) {
  const [input, setInput] = useState("");

  async function run() {
    const res = await fetch("/api/ai/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool: "policy", claimId, input }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error ?? "Something went wrong. Try again." };
    }
    return { output: data.output as string };
  }

  return (
    <AIToolCard
      title="Policy Decoder"
      description="Paste your policy language — coverage, exclusions, deadlines, in plain English."
      runLabel="Decode my policy"
      canRun={input.trim().length > 0}
      onRun={run}
    >
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Paste the relevant policy section, or describe your coverage situation..."
        rows={5}
        className="w-full text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white"
      />
    </AIToolCard>
  );
}
