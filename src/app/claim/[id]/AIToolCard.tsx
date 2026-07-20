"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Loader2, Copy, Check } from "lucide-react";

interface AIToolCardProps {
  title: string;
  description: string;
  runLabel?: string;
  canRun?: boolean;
  onRun: () => Promise<{ output?: string; error?: string }>;
  children?: React.ReactNode;
}

// Shared shell for every AI tool (PD/GA/LC/DA/LB): collapsed trigger ->
// input fields (children) -> loading -> result panel -> disclaimer. The
// disclaimer, error/rate-limit surfacing, and copy-to-clipboard live here
// once, not per-tool, so every tool gets the same safety discipline
// automatically. Copy matters most for LB — the whole point of a letter is
// the user copying it out to send themselves (never sends anything).
export function AIToolCard({
  title,
  description,
  runLabel = "Run analysis",
  canRun = true,
  onRun,
  children,
}: AIToolCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleRun() {
    setLoading(true);
    setError(null);
    const res = await onRun();
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      setOutput(res.output ?? null);
    }
  }

  return (
    <div className="border border-ink/15 rounded-sm">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div>
          <div className="font-display font-bold text-sm">{title}</div>
          <div className="text-xs text-ink/50">{description}</div>
        </div>
        {expanded ? (
          <ChevronUp size={16} className="text-ink/40 shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-ink/40 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-ink/10 pt-4">
          {!output && (
            <>
              {children}
              <button
                type="button"
                onClick={handleRun}
                disabled={loading || !canRun}
                className="mt-3 inline-flex items-center gap-2 bg-ledger text-paper px-4 py-2 rounded-sm font-semibold text-sm disabled:opacity-50"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {loading ? "Analyzing…" : runLabel}
              </button>
              {error && <p className="text-sm text-red-700 mt-2">{error}</p>}
            </>
          )}

          {output && (
            <>
              <div className="border border-ink/15 rounded-sm p-4 bg-white whitespace-pre-wrap text-sm leading-relaxed">
                {output}
              </div>
              <p className="text-xs text-ink/40 italic mt-3">
                WholeClaim is a self-help documentation tool, not legal or
                insurance advice. A documented individual result — results
                vary by case; verify specifics for your situation.
              </p>
              <div className="flex gap-4 mt-3">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(output).then(() => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    });
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-ledger uppercase tracking-wide"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOutput(null);
                    setError(null);
                    setCopied(false);
                  }}
                  className="text-xs font-semibold text-ledger uppercase tracking-wide"
                >
                  Run again
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
