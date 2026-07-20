"use client";

import { useState } from "react";
import { AIToolCard } from "./AIToolCard";

const LETTER_TYPES = [
  { value: "supplement", label: "Supplement Request" },
  { value: "delay", label: "Claim Status & Delay Demand" },
  { value: "doi", label: "State Regulator Complaint" },
  { value: "nonrenewal", label: "Non-Renewal Challenge" },
] as const;

export function LetterBuilderCard({ claimId }: { claimId: string }) {
  const [type, setType] = useState<(typeof LETTER_TYPES)[number]["value"]>("supplement");
  const [facts, setFacts] = useState("");

  async function run() {
    const res = await fetch("/api/ai/letter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claimId, type, facts }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error ?? "Something went wrong. Try again." };
    }
    return { output: data.output as string };
  }

  return (
    <AIToolCard
      title="Letter Builder"
      description="A professional draft for you to review, edit, and send yourself — WholeClaim never sends anything."
      runLabel="Draft the letter"
      onRun={run}
    >
      <div className="flex flex-col gap-2">
        <label>
          <span className="block text-xs font-semibold uppercase tracking-wide mb-1 text-ink/60">
            Letter type
          </span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            className="w-full text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white"
          >
            {LETTER_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="block text-xs font-semibold uppercase tracking-wide mb-1 text-ink/60">
            Key facts (optional — works from your claim file either way)
          </span>
          <textarea
            value={facts}
            onChange={(e) => setFacts(e.target.value)}
            placeholder="Anything specific to include — dates, amounts, prior conversations..."
            rows={4}
            className="w-full text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white"
          />
        </label>
        <p className="text-xs text-amber-700">
          In active litigation? Route every draft through your attorney
          before sending.
        </p>
      </div>
    </AIToolCard>
  );
}
