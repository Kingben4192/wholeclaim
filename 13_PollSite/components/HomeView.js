"use client";

// Extracted verbatim from the current artifact source. Includes
// fetchTotals (helper), HomeView (the screen), and SectionLabel (only used
// within HomeView -- do not duplicate it elsewhere).
//
// TRENDING_THRESHOLD now lives in ./shared (exported there, not here) since
// CategoryView.js also depends on it -- import it from there rather than
// redefining it in this file.

import { useState, useEffect } from "react";
// getLivePolls was used at line ~38 but missing from this import list in the
// extracted source -- a ReferenceError on first render. Import line only; the
// component body is unchanged.
import { CATEGORIES, getCategoryMeta, getLivePolls, getLivePollsByCategory } from "@/lib/polls";
import { votingService } from "@/lib/votingService";
import FeaturedCard from "./FeaturedCard";
import HomeModules from "./HomeModules";

// Fetch current totals for a set of polls in parallel. Used by the homepage
// "Most answered" list and category trending badges. Honest by
// construction: it only ever reports counts actually returned by
// votingService, never an estimate or a fabricated delta.
async function fetchTotals(polls) {
  const pairs = await Promise.all(
    polls.map((p) =>
      votingService
        .getPollResults(p.id)
        .then(({ total }) => [p.id, total])
        .catch(() => [p.id, null])
    )
  );
  const map = {};
  pairs.forEach(([id, total]) => {
    if (total !== null) map[id] = total;
  });
  return map;
}

function HomeView({ featuredPoll, onOpenPoll, onOpenCategory, now }) {
  const [totals, setTotals] = useState(null); // null = loading
  const livePolls = getLivePolls(now);

  useEffect(() => {
    let cancelled = false;
    fetchTotals(livePolls).then((map) => {
      if (!cancelled) setTotals(map);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // "Most answered" -- an honest, real-data version of a trending rail.
  // Ranked purely by total votes recorded, not by a fabricated velocity
  // score (no votesLastHour/sharesLast24h data exists in this demo).
  const mostAnswered = totals
    ? [...livePolls]
        .filter((p) => (totals[p.id] || 0) > 0)
        .sort((a, b) => (totals[b.id] || 0) - (totals[a.id] || 0))
        .slice(0, 3)
    : [];

  // "People are answering" -- one live poll per category, as a topic
  // teaser. No vote counts shown here on purpose; it's a discovery strip,
  // not a leaderboard.
  const categoryTeasers = CATEGORIES.map((c) => ({
    cat: c,
    poll: getLivePollsByCategory(c.id, now)[0],
  })).filter((t) => t.poll);

  return (
    <div>
      <p
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          color: "#6B7280",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        For people who don't usually get asked
      </p>
      <h1
        className="poll-question"
        style={{ fontFamily: "'Fraunces', serif", fontSize: 32, lineHeight: 1.15, margin: "0 0 10px", maxWidth: 480 }}
      >
        Vote. See the count. Know what the count actually means.
      </h1>
      <p style={{ fontSize: 13, color: "#6B7280", maxWidth: 460, margin: "0 0 26px" }}>
        These results reflect people who chose to participate. They are not a
        random or representative sample, and they aren't weighted to
        represent the general population.
      </p>

      {featuredPoll && <FeaturedCard poll={featuredPoll} onOpenPoll={onOpenPoll} />}

      {/* Ticket 2: Newest / Biggest movers / Most controversial. Sits below
          the hero; "Most answered" and the category grid below are untouched. */}
      <HomeModules now={now} onOpenPoll={onOpenPoll} />

      <SectionLabel emoji={"\u{1F440}"} label="People are answering" />
      <div className="cat-grid" style={{ marginBottom: 30 }}>
        {categoryTeasers.map(({ cat, poll }) => (
          <button
            key={cat.id}
            onClick={() => onOpenPoll(poll.id)}
            aria-label={`${cat.label}: ${poll.q}`}
            style={{
              textAlign: "left",
              background: "#fff",
              border: "1.5px solid #E4E1D8",
              borderRadius: 12,
              padding: "14px 15px",
            }}
          >
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                letterSpacing: "0.06em",
                color: cat.accent,
                fontWeight: 700,
                marginBottom: 5,
              }}
            >
              <span aria-hidden="true">{cat.emoji} </span>
              {cat.label.toUpperCase()}
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.35 }}>{poll.q}</div>
          </button>
        ))}
      </div>

      {mostAnswered.length > 0 && (
        <>
          <SectionLabel emoji={"\u{1F525}"} label="Most answered" />
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 30 }}>
            {mostAnswered.map((p) => (
              <button
                key={p.id}
                onClick={() => onOpenPoll(p.id)}
                aria-label={`${p.q}, ${totals[p.id]} votes`}
                style={{
                  textAlign: "left",
                  background: "#fff",
                  border: "1.5px solid #E4E1D8",
                  borderRadius: 10,
                  padding: "13px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 500 }}>{p.q}</span>
                <span
                  aria-hidden="true"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#D9481E",
                    flexShrink: 0,
                  }}
                >
                  {totals[p.id]} votes
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      <SectionLabel label="Explore" />
      <div className="cat-grid">
        {CATEGORIES.map((c) => {
          const count = getLivePollsByCategory(c.id).length;
          return (
            <button
              key={c.id}
              className="cat-card"
              onClick={() => onOpenCategory(c.id)}
              aria-label={`${c.label}, ${count} poll${count !== 1 ? "s" : ""}`}
              style={{
                textAlign: "left",
                background: "#fff",
                border: "2px solid #14171C",
                borderRadius: 14,
                padding: "18px 16px",
                boxShadow: "0 4px 0 rgba(20,23,28,0.9)",
                transition: "transform 0.12s ease, box-shadow 0.12s ease",
              }}
            >
              <div aria-hidden="true" style={{ fontSize: 26, marginBottom: 8 }}>{c.emoji}</div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{c.label}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#6B7280", marginTop: 4 }}>
                {count} poll{count !== 1 ? "s" : ""}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SectionLabel({ emoji, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
      {emoji && <span aria-hidden="true" style={{ fontSize: 13 }}>{emoji}</span>}
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          letterSpacing: "0.1em",
          color: "#6B7280",
          fontWeight: 700,
        }}
      >
        {label.toUpperCase()}
      </span>
    </div>
  );
}


export default HomeView;
