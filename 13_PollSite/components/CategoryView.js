"use client";

// Extracted verbatim from the current artifact source.

import { useState, useEffect } from "react";
import { getCategoryMeta, getLivePollsByCategory } from "@/lib/polls";
import { votingService } from "@/lib/votingService";
import { TRENDING_THRESHOLD } from "./shared";

function CategoryView({ catId, now, votedMap, onOpenPoll }) {
  const meta = getCategoryMeta(catId);
  const polls = getLivePollsByCategory(catId, now);
  const [totals, setTotals] = useState({});

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      polls.map((p) =>
        votingService
          .getPollResults(p.id)
          .then(({ total }) => [p.id, total])
          .catch(() => [p.id, null])
      )
    ).then((pairs) => {
      if (cancelled) return;
      const map = {};
      pairs.forEach(([id, total]) => {
        if (total !== null) map[id] = total;
      });
      setTotals(map);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catId]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <span aria-hidden="true" style={{ fontSize: 28 }}>{meta.emoji}</span>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, margin: 0 }}>{meta.label}</h2>
      </div>
      {polls.length === 0 ? (
        <p style={{ fontSize: 13, color: "#6B7280" }}>No polls are live in this category right now.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {polls.map((p) => {
            const total = totals[p.id];
            const isTrending = typeof total === "number" && total >= TRENDING_THRESHOLD;
            return (
              <button
                key={p.id}
                onClick={() => onOpenPoll(p.id)}
                aria-label={
                  [
                    p.q,
                    votedMap[p.id] !== undefined ? "You already voted." : null,
                    isTrending ? "Trending." : null,
                  ]
                    .filter(Boolean)
                    .join(" ")
                }
                style={{
                  textAlign: "left",
                  background: "#fff",
                  border: "1.5px solid #E4E1D8",
                  borderRadius: 10,
                  padding: "16px 18px",
                  fontSize: 15,
                  fontWeight: 500,
                  color: "#14171C",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <span>{p.q}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  {isTrending && (
                    <span
                      aria-hidden="true"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 10,
                        color: "#D9481E",
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                      }}
                    >
                      {"\u{1F525}"} {total}
                    </span>
                  )}
                  {votedMap[p.id] !== undefined && (
                    <span
                      aria-hidden="true"
                      style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#1F8A6F" }}
                    >
                      VOTED
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CategoryView;
