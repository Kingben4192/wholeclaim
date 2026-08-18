"use client";

// =============================================================================
// Ticket 2 — the three homepage feature modules, rendered below the hero:
//   1. Newest Polls        — most recently published (ordered by publish_at)
//   2. Biggest Movers      — fastest vote growth in the last 24h
//   3. Most Controversial  — closest to an even split
//
// Deliberately a separate file. HomeView is a near-verbatim port of the
// artifact; keeping these here means the only change to that file is one
// import and one line, so "Most answered" and the category grid stay
// untouched as the ticket requires.
//
// HONESTY RULES, carried over from the rest of the site:
//   - Nothing here invents a number. Every figure comes from a real query.
//   - Empty is shown as empty. With zero votes recorded, Biggest Movers and
//     Most Controversial legitimately have nothing to show, and they say so
//     rather than displaying a placeholder or a zero that looks like data.
//   - A failed query renders an error, never a fabricated fallback -- the
//     same rule the admin dashboard follows.
//
// Data comes from two anon-callable aggregates added in
// supabase/migration-002-homepage-modules.sql. Until that migration is run
// the two vote-derived modules show their error state; Newest Polls still
// works, because it reads poll metadata that is already public.
// =============================================================================

import { useState, useEffect } from "react";
import { getLivePolls, getCategoryMeta } from "@/lib/polls";
import { supabasePublic } from "@/lib/supabasePublic";

const MIN_VOTES_FOR_CONTROVERSY = 5; // below this, a "split" is noise, not signal
const ROW_LIMIT = 3;

// How evenly a poll's votes are divided. 1.0 = dead heat between the top two
// choices, 0 = one choice has everything. Using the top-two gap rather than
// full entropy keeps it meaningful for 4- and 5-choice polls alike: what
// makes a poll feel contested is that no single answer is running away with
// it, not that every option is equally popular.
function contestedness(counts) {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  const sorted = [...counts].sort((a, b) => b - a);
  const lead = (sorted[0] - (sorted[1] || 0)) / total;
  return 1 - lead;
}

export default function HomeModules({ now, onOpenPoll }) {
  const [state, setState] = useState({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [totalsRes, recentRes] = await Promise.all([
          supabasePublic.rpc("get_poll_totals_bulk"),
          supabasePublic.rpc("get_recent_vote_counts", { p_hours: 24 }),
        ]);
        if (totalsRes.error) throw totalsRes.error;
        if (recentRes.error) throw recentRes.error;
        if (!cancelled) {
          setState({ status: "ready", totals: totalsRes.data || [], recent: recentRes.data || [] });
        }
      } catch (e) {
        if (!cancelled) setState({ status: "error", message: e.message || String(e) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const live = getLivePolls(now);

  // 1. Newest — publish_at descending. Poll metadata is already public, so
  // this module works even if the migration has not been run yet.
  const newest = [...live]
    .filter((p) => p.publishAt)
    .sort((a, b) => new Date(b.publishAt) - new Date(a.publishAt))
    .slice(0, ROW_LIMIT);

  let movers = [];
  let contested = [];
  if (state.status === "ready") {
    const byId = {};
    live.forEach((p) => (byId[p.id] = p));

    movers = (state.recent || [])
      .filter((r) => byId[r.poll_id])
      .sort((a, b) => Number(b.recent_votes) - Number(a.recent_votes))
      .slice(0, ROW_LIMIT);

    const counts = {};
    (state.totals || []).forEach((r) => {
      if (!byId[r.poll_id]) return;
      const width = byId[r.poll_id].choices.length;
      if (!counts[r.poll_id]) counts[r.poll_id] = new Array(width).fill(0);
      if (r.choice_index >= 0 && r.choice_index < width) {
        counts[r.poll_id][r.choice_index] = Number(r.vote_count);
      }
    });
    contested = Object.entries(counts)
      .map(([id, c]) => ({ id, total: c.reduce((a, b) => a + b, 0), score: contestedness(c) }))
      .filter((x) => x.total >= MIN_VOTES_FOR_CONTROVERSY)
      .sort((a, b) => b.score - a.score || b.total - a.total)
      .slice(0, ROW_LIMIT)
      .map((x) => ({ ...x, poll: byId[x.id] }));
  }

  return (
    <>
      <Module emoji={"\u{1F195}"} label="Newest polls">
        {newest.length === 0 ? (
          <Empty text="Nothing published yet." />
        ) : (
          newest.map((p) => <Row key={p.id} poll={p} onOpenPoll={onOpenPoll} />)
        )}
      </Module>

      <Module emoji={"\u{1F4C8}"} label="Biggest movers">
        {state.status === "loading" ? (
          <Empty text="Loading…" />
        ) : state.status === "error" ? (
          <ErrBox text="Couldn't load recent activity." />
        ) : movers.length === 0 ? (
          <Empty text="No votes in the last 24 hours yet." />
        ) : (
          movers.map((m) => (
            <Row
              key={m.poll_id}
              poll={live.find((p) => p.id === m.poll_id)}
              onOpenPoll={onOpenPoll}
              meta={`${m.recent_votes} vote${Number(m.recent_votes) === 1 ? "" : "s"} today`}
            />
          ))
        )}
      </Module>

      <Module emoji={"⚖️"} label="Most controversial">
        {state.status === "loading" ? (
          <Empty text="Loading…" />
        ) : state.status === "error" ? (
          <ErrBox text="Couldn't load results." />
        ) : contested.length === 0 ? (
          <Empty text={`Needs at least ${MIN_VOTES_FOR_CONTROVERSY} votes on a poll before a split means anything.`} />
        ) : (
          contested.map((c) => (
            <Row
              key={c.id}
              poll={c.poll}
              onOpenPoll={onOpenPoll}
              meta={`${c.total} vote${c.total === 1 ? "" : "s"}, nearly even`}
            />
          ))
        )}
      </Module>
    </>
  );
}

function Module({ emoji, label, children }) {
  return (
    <section style={{ marginTop: 30 }}>
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          letterSpacing: "0.09em",
          textTransform: "uppercase",
          color: "#6B7280",
          marginBottom: 10,
        }}
      >
        <span aria-hidden="true">{emoji} </span>
        {label}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>
    </section>
  );
}

function Row({ poll, onOpenPoll, meta }) {
  if (!poll) return null;
  const cat = getCategoryMeta(poll.cat);
  return (
    <button
      onClick={() => onOpenPoll(poll.id)}
      style={{
        textAlign: "left",
        border: "1px solid #E4E1D8",
        borderRadius: 10,
        padding: "12px 14px",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: cat ? cat.accent : "#6B7280" }}>
        {cat ? `${cat.emoji} ${cat.label.toUpperCase()}` : poll.cat}
      </span>
      <span style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.35 }}>{poll.q}</span>
      {meta && (
        <span style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "'JetBrains Mono', monospace" }}>{meta}</span>
      )}
    </button>
  );
}

function Empty({ text }) {
  return <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0 }}>{text}</p>;
}

function ErrBox({ text }) {
  return (
    <p style={{ fontSize: 12, color: "#8A2E0F", background: "#FBEDE7", border: "1px solid #E9C4B4", borderRadius: 8, padding: "8px 10px", margin: 0 }}>
      {text}
    </p>
  );
}
