"use client";

// Extracted verbatim from the current artifact source (poll-prototype.jsx).
// Uses fmtPct/maxCountFor from ./shared, votingService and getCategoryMeta
// as noted in components/WIRING_NOTES.md -- wire the two imports below to
// the real modules (lib/votingService, lib/polls) before using this file;
// they're written as placeholders pointing at where Claude Code's own
// lib/polls.js already exports CATEGORIES/getCategoryMeta/getFeaturedPoll,
// per its own report -- adjust the import path/names only if they differ.

import { useState, useEffect } from "react";
import { fmtPct, maxCountFor } from "./shared";
import { getCategoryMeta } from "@/lib/polls";
import { votingService } from "@/lib/votingService";

function FeaturedCard({ poll, onOpenPoll }) {
  const [results, setResults] = useState({ status: "loading", counts: null, total: 0 });

  useEffect(() => {
    let cancelled = false;
    setResults({ status: "loading", counts: null, total: 0 });
    votingService
      .getPollResults(poll.id)
      .then(({ counts, total }) => {
        if (!cancelled) setResults({ status: "ready", counts, total });
      })
      .catch(() => {
        if (!cancelled) setResults({ status: "error", counts: null, total: 0 });
      });
    return () => {
      cancelled = true;
    };
  }, [poll.id]);

  const meta = getCategoryMeta(poll.cat);
  const counts = results.counts || new Array(poll.choices.length).fill(0);
  const total = results.total;
  const maxCount = total > 0 ? Math.max(...counts) : 0;

  return (
    <button
      onClick={() => onOpenPoll(poll.id)}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        background: "#14171C",
        color: "#FBFAF7",
        border: "2px solid #F4B41A",
        borderRadius: 16,
        padding: "20px 22px",
        marginBottom: 26,
        cursor: "pointer",
        boxShadow: "0 0 0 4px rgba(244,180,26,0.15), 0 8px 0 rgba(20,23,28,0.9)",
      }}
    >
      <div style={{ marginBottom: 14 }}>
        <span
          aria-hidden="true"
          style={{
            display: "block",
            fontSize: 40,
            lineHeight: 1,
            marginBottom: 6,
            filter: "drop-shadow(0 0 10px rgba(244,180,26,0.6))",
          }}
        >
          {"\u{1F525}"}
        </span>
        <span
          style={{
            display: "block",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            letterSpacing: "0.14em",
            color: "#F4B41A",
            fontWeight: 700,
          }}
        >
          TODAY'S QUESTION
        </span>
        <span
          style={{
            display: "block",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            letterSpacing: "0.08em",
            color: "#8A8672",
            fontWeight: 600,
            marginTop: 2,
          }}
        >
          {meta.label.toUpperCase()}
        </span>
      </div>

      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 21, lineHeight: 1.3, marginBottom: 18 }}>
        {poll.q}
      </div>

      {results.status === "loading" && (
        <p style={{ fontSize: 12, color: "#9CA3AF", fontFamily: "'JetBrains Mono', monospace" }}>
          {"Loading results\u2026"}
        </p>
      )}

      {results.status === "ready" && total > 0 && (() => {
        const leaderIdx = counts.indexOf(maxCount);
        const leaderPct = (counts[leaderIdx] / total) * 100;
        return (
          <>
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 52,
                  fontWeight: 700,
                  color: "#F4B41A",
                  lineHeight: 1,
                }}
              >
                {fmtPct(leaderPct)}
              </div>
              <div style={{ fontSize: 13, color: "#D9D6C9", marginTop: 4 }}>
                of voters say <strong style={{ color: "#FBFAF7" }}>{poll.choices[leaderIdx]}</strong>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 }}>
              {poll.choices.map((choice, idx) => {
                const n = counts[idx] || 0;
                const pct = total > 0 ? (n / total) * 100 : 0;
                const isTop = idx === leaderIdx;
                return (
                  <div key={idx}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
                      <span style={{ fontSize: 12.5, color: isTop ? "#FBFAF7" : "#D9D6C9", fontWeight: isTop ? 700 : 500 }}>
                        {choice}
                      </span>
                      <span
                        aria-hidden="true"
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 13,
                          fontWeight: 700,
                          minWidth: 38,
                          textAlign: "right",
                          flexShrink: 0,
                          color: isTop ? "#F4B41A" : "#9CA3AF",
                        }}
                      >
                        {fmtPct(pct)}
                      </span>
                    </div>
                    <div
                      aria-hidden="true"
                      style={{
                        height: 6,
                        borderRadius: 4,
                        background: "rgba(255,255,255,0.12)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: isTop ? "#F4B41A" : "#6B7280",
                          borderRadius: 4,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        );
      })()}

      {results.status === "ready" && total === 0 && (
        <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 14 }}>Be the first to vote.</p>
      )}

      {results.status === "error" && (
        <p style={{ fontSize: 12, color: "#D9481E", marginBottom: 14 }}>Results couldn't load right now.</p>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 12,
          color: "#9CA3AF",
        }}
      >
        <span>
          {results.status === "ready" && total > 0
            ? `${"\u{1F525}"} ${total} people have answered`
            : "\u00A0"}
        </span>
        <span style={{ color: "#F4B41A", fontWeight: 700 }}>Vote {"\u2192"}</span>
      </div>
    </button>
  );
}

export default FeaturedCard;
