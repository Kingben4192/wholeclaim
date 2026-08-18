"use client";

// =============================================================================
// Interactive half of the Top Story review screen.
//
// The screen is built around one idea: a strong story yields several angles,
// only one of which can hold the hero. So candidates are presented grouped by
// source story, and the group header states the constraint outright rather
// than leaving the reviewer to infer it from four identical-looking cards.
//
// Three outcomes, and "park" is the one that matters. Approving one angle
// must not throw away the other three -- they become drafts and re-enter the
// same review flow every other batch uses.
// =============================================================================

import { useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = ["politics", "health", "trending", "social", "home", "sports"];

// Questions that carry a built-in resolution date. Prediction framing produces
// these constantly ("...by the end of 2026", "...this cycle"), and published
// without an expiry they become the p19 trap: still rendering as votable after
// they resolve, while submit_vote() rejects every vote.
//
// This only *prompts* -- it never blocks or auto-fills a date. Guessing an
// expiry is worse than asking: "this year" in August and "this year" in
// December mean very different deadlines, and only a human knows which.
const TIME_BOUND = [
  /\b20\d\d\b/,
  /\bthis (year|cycle|season|term|quarter|month)\b/i,
  /\bnext (year|cycle|season|term|quarter|month)\b/i,
  /\bby the end of\b/i,
  /\bwithin the next\b/i,
  /\bmidterms?\b/i,
  /\belection\b/i,
];

function looksTimeBound(question) {
  return TIME_BOUND.some((re) => re.test(String(question || "")));
}

export default function TopStoryClient({ groups, currentTopStory }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [error, setError] = useState("");
  const [decided, setDecided] = useState({});

  async function runDraft() {
    setBusy(true);
    setError("");
    setRunResult(null);
    try {
      const res = await fetch("/api/admin/top-story/run", { method: "POST" });
      const body = await res.json();
      if (!body.ok) setError(body.note || body.error || "Run failed.");
      setRunResult(body);
      router.refresh();
    } catch (e) {
      setError("Couldn't reach the drafting endpoint.");
    } finally {
      setBusy(false);
    }
  }

  async function submitDecision(candidate, action, edits) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/top-story/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: candidate.id, action, ...edits }),
      });
      const body = await res.json();
      if (!body.ok) {
        setError(body.error === "invalid_choices" ? "Choices must be 2–4 non-empty options." : body.error);
        return;
      }
      setDecided((d) => ({ ...d, [candidate.id]: { action, pollId: body.publishedPollId } }));
      router.refresh();
    } catch (e) {
      setError("Couldn't submit that decision.");
    } finally {
      setBusy(false);
    }
  }

  const pending = groups.reduce((n, g) => n + g.candidates.filter((c) => !decided[c.id]).length, 0);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, margin: 0 }}>Top Story — review</h1>
        <a href="/admin" style={{ fontSize: 12, color: "#6B7280" }}>← Dashboard</a>
      </div>
      <p style={{ fontSize: 13, color: "#6B7280", marginTop: 0, marginBottom: 24 }}>
        Drafted candidates. Nothing here is public until you approve it.
      </p>

      <CurrentStory story={currentTopStory} />

      <section style={{ marginBottom: 28 }}>
        <button
          onClick={runDraft}
          disabled={busy}
          style={{
            background: "#14171C",
            color: "#FBFAF7",
            border: "none",
            borderRadius: 10,
            padding: "11px 18px",
            fontWeight: 600,
            fontSize: 14,
            opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? "Working…" : "Run drafting now"}
        </button>
        <span style={{ fontSize: 12, color: "#9CA3AF", marginLeft: 12 }}>
          Manual trigger — costs one model call (~$0.11). Nothing runs on a schedule.
        </span>
        {runResult && <RunSummary result={runResult} />}
        {error && (
          <p style={{ fontSize: 13, color: "#8A2E0F", background: "#FBEDE7", border: "1px solid #E9C4B4", borderRadius: 8, padding: "8px 10px", marginTop: 12 }}>
            {error}
          </p>
        )}
      </section>

      {groups.length === 0 ? (
        <p style={{ fontSize: 13, color: "#9CA3AF" }}>
          No candidates awaiting review. Run drafting to generate some.
        </p>
      ) : (
        <>
          <SectionLabel label={`${pending} candidate${pending === 1 ? "" : "s"} awaiting review`} />
          {groups.map((g) => (
            <StoryGroup
              key={g.key}
              group={g}
              decided={decided}
              busy={busy}
              onDecide={submitDecision}
            />
          ))}
        </>
      )}
    </div>
  );
}

function CurrentStory({ story }) {
  if (!story) {
    return (
      <div style={box()}>
        <SectionLabel label="Current Top Story" />
        <p style={{ fontSize: 13, color: "#9CA3AF", margin: 0 }}>No poll is currently featured.</p>
      </div>
    );
  }
  const age = story.ageHours == null ? null : Math.floor(story.ageHours);
  return (
    <div style={box(story.dueForReview ? "#E9C4B4" : "#E4E1D8")}>
      <SectionLabel label="Current Top Story" />
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{story.question}</div>
      <div style={{ fontSize: 12, color: "#6B7280", fontFamily: "'JetBrains Mono', monospace" }}>
        {story.id}
        {age !== null && ` · live ${age}h`}
      </div>
      {story.dueForReview && (
        <p style={{ fontSize: 13, color: "#8A2E0F", margin: "10px 0 0" }}>
          Past the 72-hour freshness mark — due for a look. This is a prompt, not a
          requirement: leaving it up is fine if nothing better has cleared the filter.
        </p>
      )}
    </div>
  );
}

function RunSummary({ result }) {
  const quiet = result.ok && result.drafted === 0;
  return (
    <div style={{ ...box(quiet ? "#E4E1D8" : "#C7DFD3"), marginTop: 14 }}>
      <div style={{ fontSize: 13 }}>
        {result.headlines != null && (
          <>
            <strong>{result.headlines}</strong> headlines ·{" "}
            <strong>{result.drafted ?? 0}</strong> passed the filter ·{" "}
            <strong>{result.rejected ?? 0}</strong> rejected
          </>
        )}
      </div>
      {result.usage && (
        <div style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "'JetBrains Mono', monospace", marginTop: 4 }}>
          {result.usage.input_tokens} in / {result.usage.output_tokens} out
          {result.servedBy && ` · served by ${result.servedBy}`}
        </div>
      )}
      {result.note && <p style={{ fontSize: 13, color: "#6B7280", margin: "8px 0 0" }}>{result.note}</p>}
      {result.sources && (
        <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6 }}>
          {result.sources.map((s) => `${s.label} ${s.error ? "(error)" : s.count}`).join(" · ")}
        </div>
      )}
    </div>
  );
}

function StoryGroup({ group, decided, busy, onDecide }) {
  const live = group.candidates.filter((c) => !decided[c.id]);
  const multi = group.candidates.length > 1;
  return (
    <div style={{ ...box(), marginBottom: 20 }}>
      <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "#6B7280", marginBottom: 4 }}>
        {group.runDate} · ONE STORY, {group.candidates.length} ANGLE{group.candidates.length === 1 ? "" : "S"}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
        {group.sourceLabel || "(source not recorded)"}
      </div>
      {group.sourceUrl && (
        <a href={group.sourceUrl} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#5B3A9E" }}>
          Check the framing against the original ↗
        </a>
      )}
      {multi && live.length > 1 && (
        <p style={{ fontSize: 12, color: "#8A6D2F", background: "#FBF7EA", border: "1px solid #E9DCB0", borderRadius: 8, padding: "8px 10px", margin: "10px 0 0" }}>
          Only one of these can hold the hero. Approve the strongest and <strong>park</strong> the
          rest — parked angles become drafts and stay available, rather than being discarded.
        </p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
        {group.candidates.map((c) => (
          <CandidateCard key={c.id} candidate={c} decision={decided[c.id]} busy={busy} onDecide={onDecide} />
        ))}
      </div>
    </div>
  );
}

function CandidateCard({ candidate, decision, busy, onDecide }) {
  const [editing, setEditing] = useState(false);
  const [question, setQuestion] = useState(candidate.question);
  const [choicesText, setChoicesText] = useState((candidate.choices || []).join("\n"));
  const [category, setCategory] = useState(candidate.category);
  const [expiresAt, setExpiresAt] = useState(""); // yyyy-mm-dd, "" = evergreen

  if (decision) {
    const label =
      decision.action === "approve"
        ? `Approved — now live as ${decision.pollId}`
        : decision.action === "park"
        ? `Parked as draft ${decision.pollId}`
        : "Rejected";
    return (
      <div style={{ ...inner(), background: "#F7F6F2" }}>
        <div style={{ fontSize: 13, color: "#6B7280" }}>{candidate.question}</div>
        <div style={{ fontSize: 12, fontWeight: 600, marginTop: 6 }}>{label}</div>
      </div>
    );
  }

  // expiresAt is sent on every decision, not only when the wording is being
  // edited -- setting a lifespan is a publish-time call even for a candidate
  // whose text is already fine.
  const edits = {
    ...(editing
      ? {
          question,
          choices: choicesText.split("\n").map((s) => s.trim()).filter(Boolean),
          category,
        }
      : {}),
    expiresAt: expiresAt ? `${expiresAt}T00:00:00Z` : null,
  };

  const timeBound = looksTimeBound(editing ? question : candidate.question);
  const needsExpiry = timeBound && !expiresAt;

  return (
    <div style={inner()}>
      {editing ? (
        <>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={2}
            style={field()}
          />
          <label style={lbl()}>Choices — one per line, 2 to 4</label>
          <textarea
            value={choicesText}
            onChange={(e) => setChoicesText(e.target.value)}
            rows={4}
            style={field()}
          />
          <label style={lbl()}>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={field()}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </>
      ) : (
        <>
          <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "#6B7280", marginBottom: 4 }}>
            {String(candidate.category).toUpperCase()}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.35, marginBottom: 8 }}>
            {candidate.question}
          </div>
          <div style={{ fontSize: 13, color: "#14171C", marginBottom: 8 }}>
            {(candidate.choices || []).join("  ·  ")}
          </div>
        </>
      )}

      {candidate.rationale && (
        <p style={{ fontSize: 12, color: "#6B7280", margin: "0 0 8px", fontStyle: "italic" }}>
          Why it passed: {candidate.rationale}
        </p>
      )}

      {(candidate.soft_flags || []).length > 0 && (
        <ul style={{ margin: "0 0 10px", paddingLeft: 18, fontSize: 12, color: "#8A6D2F" }}>
          {candidate.soft_flags.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
      )}

      <div
        style={{
          border: `1px solid ${needsExpiry ? "#E9DCB0" : "#E4E1D8"}`,
          background: needsExpiry ? "#FBF7EA" : "transparent",
          borderRadius: 8,
          padding: "10px 12px",
          marginBottom: 10,
        }}
      >
        <label style={lbl()}>
          Retire this poll on — leave blank for evergreen
        </label>
        <input
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          style={{ ...field(), marginBottom: needsExpiry ? 8 : 0, maxWidth: 200 }}
        />
        {needsExpiry && (
          <p style={{ fontSize: 12, color: "#8A6D2F", margin: 0 }}>
            This question has a resolution date in it. Without an expiry it keeps showing
            as votable after it resolves, while every vote is rejected — the same failure
            as the old World Cup poll. Set a date, or leave blank deliberately.
          </p>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => onDecide(candidate, "approve", edits)} disabled={busy} style={btn("#14171C", "#FBFAF7")}>
          Approve → Top Story
        </button>
        <button onClick={() => onDecide(candidate, "park", edits)} disabled={busy} style={btn("#F4B41A", "#14171C")}>
          Park as draft
        </button>
        <button onClick={() => onDecide(candidate, "reject", {})} disabled={busy} style={btn("#fff", "#8A2E0F", "#E9C4B4")}>
          Reject
        </button>
        <button onClick={() => setEditing((v) => !v)} disabled={busy} style={btn("#fff", "#6B7280", "#E4E1D8")}>
          {editing ? "Cancel edit" : "Edit"}
        </button>
      </div>
    </div>
  );
}

function SectionLabel({ label }) {
  return (
    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B7280", marginBottom: 10 }}>
      {label}
    </div>
  );
}

const box = (border = "#E4E1D8") => ({ border: `1.5px solid ${border}`, borderRadius: 12, padding: "16px 18px", marginBottom: 24, background: "#fff" });
const inner = () => ({ border: "1px solid #E4E1D8", borderRadius: 10, padding: "14px 16px", background: "#fff" });
const field = () => ({ width: "100%", padding: "8px 10px", border: "1.5px solid #E4E1D8", borderRadius: 8, fontSize: 14, marginBottom: 8, fontFamily: "inherit" });
const lbl = () => ({ display: "block", fontSize: 11, color: "#6B7280", marginBottom: 4 });
const btn = (bg, fg, border = "transparent") => ({ background: bg, color: fg, border: `1px solid ${border}`, borderRadius: 8, padding: "8px 14px", fontWeight: 600, fontSize: 13 });
