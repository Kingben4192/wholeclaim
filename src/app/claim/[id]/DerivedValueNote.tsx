// Derived-value labeling pattern (Decision #56, 2026-07-26) — a caption
// distinguishing a value the system reads (stored fact, user-entered)
// from a value it derives: "ai-read" (AI extracted/restated it from text
// the user provided) or "computed" (deterministic app logic derived it
// from other stored data). Deliberately excludes the Documentation Score
// -- that's WholeClaim's own authoritative measurement, not an estimate
// of an external fact, and this pattern must never read as "unconfirmed."
// Both default notes name a resolution path, not just an absence of
// confirmation. Reuses the always-visible caption convention already
// shipped for the WindHail safety guardrail (EvidenceRow.tsx) rather than
// a hover-only tooltip, for the same reason: works on mobile, no extra
// interaction required to see it.

export type DerivationSource = "ai-read" | "computed";

const DEFAULT_NOTE: Record<DerivationSource, string> = {
  "ai-read":
    "Read by AI from text you provided — not confirmed. Compare it to your original document to verify.",
  computed:
    "Calculated by WholeClaim from the dates and entries in your file. Review those entries to confirm — updating them recalculates this automatically.",
};

export function DerivedValueNote({
  source,
  children,
  className,
}: {
  source: DerivationSource;
  children?: string;
  className?: string;
}) {
  return (
    <span className={`block text-xs text-brass mt-0.5 ${className ?? ""}`}>
      {children ?? DEFAULT_NOTE[source]}
    </span>
  );
}
