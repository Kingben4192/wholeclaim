"use client";

// =============================================================================
// Small shared pieces used across the poll UI: percentage formatting, the
// tally-mark decoration, loading/error lines. Extracted verbatim from the
// current artifact source (poll-prototype.jsx) -- not reconstructed.
// =============================================================================

function fmtPct(n) {
  return `${Math.round(n)}%`;
}

function maxCountFor(counts) {
  return counts.length > 0 ? Math.max(...counts) : 0;
}

function TallyMark({ count }) {
  const groups = Math.floor(count / 5);
  const rem = count % 5;
  const items = [];
  for (let i = 0; i < groups; i++) items.push(5);
  if (rem > 0) items.push(rem);
  return (
    <span
      aria-hidden="true"
      style={{ display: "inline-flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}
    >
      {items.map((n, gi) => (
        <span key={gi} style={{ position: "relative", display: "inline-flex", gap: 2 }}>
          {Array.from({ length: n }).map((_, i) => (
            <span
              key={i}
              style={{ width: 2, height: 14, background: "#14171C", display: "inline-block" }}
            />
          ))}
          {n === 5 && (
            <span
              style={{
                position: "absolute",
                left: -1,
                top: 6,
                width: 16,
                height: 2,
                background: "#14171C",
                transform: "rotate(-32deg)",
                transformOrigin: "left center",
              }}
            />
          )}
        </span>
      ))}
    </span>
  );
}

function LoadingLine({ label }) {
  return (
    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#6B7280" }}>
      {label}
    </p>
  );
}

function ErrorLine({ label, onRetry }) {
  return (
    <div
      role="alert"
      style={{
        border: "1.5px solid #D9481E",
        background: "#FBEDE7",
        borderRadius: 10,
        padding: "12px 14px",
        fontSize: 13,
        color: "#8A2E0F",
      }}
    >
      {label}
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            display: "block",
            marginTop: 8,
            background: "none",
            border: "1px solid #8A2E0F",
            borderRadius: 6,
            padding: "4px 10px",
            fontSize: 12,
            fontWeight: 600,
            color: "#8A2E0F",
          }}
        >
          Try again
        </button>
      )}
    </div>
  );
}

export { fmtPct, maxCountFor, TallyMark, LoadingLine, ErrorLine };

// Minimum total votes before a poll is badged as trending in a category
// list. Simple volume threshold, not a velocity/rate calculation -- see
// the fuller comment in CategoryView.js where it's applied.
export const TRENDING_THRESHOLD = 15;
