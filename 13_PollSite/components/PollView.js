"use client";

// Extracted verbatim from the current artifact source, then hardened.
// This is the actual voting UI: choices pre-vote, hero percentage + full
// breakdown post-vote, share, next-poll. shareCurrent() below builds a
// real /poll/[pollId] URL directly -- the artifact's original pollUrl()
// hash-routing helper (#/poll/p7) was never imported into this file and
// would have thrown a ReferenceError at runtime; it's not used here.

import { useState, useEffect, useCallback } from "react";
import { fmtPct, maxCountFor, TallyMark } from "./shared";
import { LoadingLine, ErrorLine } from "./shared";
import { getLivePollsByCategory } from "@/lib/polls";
import { votingService } from "@/lib/votingService";

function PollView({ poll, meta, votedChoice, onVoteRecorded, onShare, onNextPoll, now }) {
  const [resultsState, setResultsState] = useState({ status: "loading", counts: null, total: 0 });
  const [voteState, setVoteState] = useState({ status: "idle" }); // idle | submitting | error
  const [justVotedRank, setJustVotedRank] = useState(null); // total at the moment THIS vote was recorded, this session only
  const hasVoted = votedChoice !== undefined;

  const loadResults = useCallback(async () => {
    setResultsState({ status: "loading", counts: null, total: 0 });
    try {
      const { counts, total } = await votingService.getPollResults(poll.id);
      setResultsState({ status: "ready", counts, total });
    } catch (e) {
      setResultsState({ status: "error", counts: null, total: 0 });
    }
  }, [poll.id]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  async function castVote(choiceIdx) {
    if (hasVoted || voteState.status === "submitting") return;
    setVoteState({ status: "submitting" });
    try {
      const { counts, total } = await votingService.submitVote(poll.id, choiceIdx);
      await votingService.recordLocalVote(poll.id, choiceIdx);
      setResultsState({ status: "ready", counts, total });
      setJustVotedRank(total);
      onVoteRecorded(poll.id, choiceIdx);
      setVoteState({ status: "idle" });
    } catch (e) {
      setVoteState({ status: "error" });
    }
  }

  async function shareCurrent() {
    // Real production URL, not the artifact's hash-routing helper
    // (pollUrl(), which built "#/poll/p7" and isn't imported here --
    // calling it would throw a ReferenceError). NEXT_PUBLIC_SITE_URL is
    // already required/validated at boot by app/poll/[pollId]/page.js;
    // this reuses the same env var for consistency.
    const url = `${process.env.NEXT_PUBLIC_SITE_URL}/poll/${poll.id}`;
    let text = `"${poll.q}" \u2014 vote here`;
    if (hasVoted && resultsState.status === "ready" && total > 0) {
      const leaderIdx = counts.indexOf(maxCountFor(counts));
      const leaderPct = fmtPct((counts[leaderIdx] / total) * 100);
      text = `"${poll.q}" \u2014 ${leaderPct} say "${poll.choices[leaderIdx]}" (${total} votes). Vote here`;
    }
    if (navigator.share) {
      try {
        await navigator.share({ title: "What Do People Think?", text, url });
        return;
      } catch (e) {
        // user cancelled or share failed; fall through to clipboard
      }
    }
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(`${text}: ${url}`);
        onShare("Link copied \u2014 takes people straight to this poll");
        return;
      } catch (e) {
        // clipboard blocked; nothing more we can do silently
      }
    }
    onShare("Copy this poll's link from your address bar to share it");
  }

  function goToNext() {
    const inCat = getLivePollsByCategory(poll.cat, now);
    const idx = inCat.findIndex((p) => p.id === poll.id);
    const next = inCat[(idx + 1) % inCat.length];
    if (next) onNextPoll(next.id);
  }

  const counts = resultsState.counts || new Array(poll.choices.length).fill(0);
  const total = resultsState.total;

  return (
    <div>
      <div
        style={{
          display: "inline-block",
          background: meta.accent,
          color: "#fff",
          fontSize: 11,
          fontWeight: 700,
          padding: "4px 10px",
          borderRadius: 20,
          marginBottom: 14,
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        <span aria-hidden="true">{meta.emoji} </span>
        {meta.label.toUpperCase()}
      </div>
      <h2 className="poll-question" style={{ fontFamily: "'Fraunces', serif", fontSize: 26, lineHeight: 1.25, margin: "0 0 22px" }}>
        {poll.q}
      </h2>

      {poll.source && (
        <p style={{ fontSize: 12, color: "#6B7280", marginTop: -14, marginBottom: 20 }}>
          Context: {poll.source.label}
          {poll.source.url ? (
            <>
              {" \u2014 "}
              <a href={poll.source.url} target="_blank" rel="noreferrer" style={{ color: "#5B3A9E" }}>
                source
              </a>
            </>
          ) : null}
        </p>
      )}

      {resultsState.status === "loading" && <LoadingLine label="Loading results\u2026" />}
      {resultsState.status === "error" && (
        <ErrorLine label="Results couldn't be loaded right now." onRetry={loadResults} />
      )}

      {resultsState.status !== "loading" && !hasVoted && (
        <div role="group" aria-label="Poll choices" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {poll.choices.map((choice, idx) => (
            <button
              key={idx}
              className="choice-btn"
              disabled={voteState.status === "submitting"}
              aria-label={`Vote for ${choice}`}
              onClick={() => castVote(idx)}
              style={{
                textAlign: "left",
                border: "2px solid #E4E1D8",
                borderRadius: 10,
                padding: "14px 16px",
                background: "#fff",
                fontWeight: 500,
                fontSize: 15,
              }}
            >
              {choice}
            </button>
          ))}
        </div>
      )}

      {resultsState.status !== "loading" && hasVoted && (() => {
        const leaderIdx = counts.indexOf(maxCountFor(counts));
        const leaderPct = total > 0 ? (counts[leaderIdx] / total) * 100 : 0;
        return (
          <>
            {total > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 56,
                    fontWeight: 700,
                    color: "#14171C",
                    lineHeight: 1,
                  }}
                >
                  {fmtPct(leaderPct)}
                </div>
                <div style={{ fontSize: 14, color: "#6B7280", marginTop: 4 }}>
                  of voters say <strong style={{ color: "#14171C" }}>{poll.choices[leaderIdx]}</strong>
                </div>
              </div>
            )}
            <div role="group" aria-label="Poll results" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {poll.choices.map((choice, idx) => {
                const n = counts[idx] || 0;
                const pct = total > 0 ? (n / total) * 100 : 0;
                const isWinner = idx === leaderIdx;
                const isSelected = votedChoice === idx;
                return (
                  <div
                    key={idx}
                    aria-label={`${choice}: ${fmtPct(pct)}, ${n} vote${n !== 1 ? "s" : ""}${isSelected ? ", your answer" : ""}`}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: 6 }}>
                      <span style={{ fontWeight: isSelected ? 700 : 500, fontSize: 15 }}>
                        {choice} {isSelected && <span aria-hidden="true">{"\u2713"}</span>}
                      </span>
                      <span
                        aria-hidden="true"
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 16,
                          fontWeight: 700,
                          minWidth: 48,
                          textAlign: "right",
                          flexShrink: 0,
                          color: isWinner ? "#14171C" : "#6B7280",
                        }}
                      >
                        {fmtPct(pct)}
                      </span>
                    </div>
                    <div
                      aria-hidden="true"
                      style={{
                        height: 10,
                        borderRadius: 6,
                        background: "#F0EEE6",
                        overflow: "hidden",
                        border: isSelected ? "1.5px solid #14171C" : "none",
                      }}
                    >
                      <div
                        className="bar-fill"
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: isWinner ? "#F4B41A" : "#C9C6B9",
                          borderRadius: 6,
                          transition: "width 0.5s ease",
                        }}
                      />
                    </div>
                    <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>
                      {n} vote{n !== 1 ? "s" : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        );
      })()}

      {voteState.status === "error" && (
        <div style={{ marginTop: 12 }}>
          <ErrorLine label="Your vote didn't save. Please try again." />
        </div>
      )}

      {hasVoted && resultsState.status === "ready" && (
        <div style={{ marginTop: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <p style={{ fontSize: 13, color: "#14171C", fontWeight: 600, margin: 0 }}>
              {"\u{1F525}"} {total} {total !== 1 ? "people have" : "person has"} answered
            </p>
            <TallyMark count={total} />
          </div>
          {justVotedRank !== null && (
            <p style={{ fontSize: 12, color: "#8A6D2F", fontWeight: 600, margin: "2px 0 0" }}>
              You just became voter #{justVotedRank}.
            </p>
          )}
          <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 10, lineHeight: 1.5 }}>
            This shows what people who voted here think and experience —
            not a scientific survey, and not medical or political fact.
            Results aren't weighted or adjusted to represent any wider
            population.
          </p>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 26, flexWrap: "wrap" }}>
        {hasVoted ? (
          <>
            <button
              onClick={shareCurrent}
              style={{
                flex: "1 1 140px",
                background: "#14171C",
                color: "#FBFAF7",
                border: "none",
                borderRadius: 10,
                padding: "13px 16px",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Share this poll
            </button>
            <button
              onClick={goToNext}
              style={{
                flex: "1 1 140px",
                background: "#F4B41A",
                color: "#14171C",
                border: "none",
                borderRadius: 10,
                padding: "13px 16px",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              Next poll {"\u2192"}
            </button>
          </>
        ) : (
          <p style={{ fontSize: 12, color: "#9CA3AF" }}>Tap a choice to vote — one vote per poll, per browser.</p>
        )}
      </div>

      {hasVoted && poll.promotion && (
        <div
          style={{
            marginTop: 22,
            padding: "14px 16px",
            background: "#FBF7EA",
            border: "1px solid #E9DCB0",
            borderRadius: 10,
          }}
        >
          <p style={{ fontSize: 13, margin: 0, lineHeight: 1.5 }}>
            {poll.promotion.label}
            {poll.promotion.url && (
              <>
                {" "}
                <a href={poll.promotion.url} target="_blank" rel="noreferrer" style={{ color: "#8A6D2F", fontWeight: 600 }}>
                  Take a look {"\u2192"}
                </a>
              </>
            )}
          </p>
        </div>
      )}

    </div>
  );
}

export default PollView;
