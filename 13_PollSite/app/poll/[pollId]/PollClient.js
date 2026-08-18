"use client";

// =============================================================================
// Client wrapper for a single poll page. app/poll/[pollId]/page.js has already
// resolved and validated the poll server-side (and 404'd if it isn't live), so
// this component never has to handle a null poll.
//
// TWO-STAGE HYDRATION, on purpose:
//
//   Stage 1, synchronous, in the render body: hydrate the voting adapter's
//   choice-count map from the one poll we already have. This has to happen
//   before PollView mounts, because PollView calls getPollResults() in a
//   mount effect and the adapter uses pollsById purely to size the counts
//   array. Without it, the first results render would zero-fill to length 0
//   and every bar would read 0% -- wrong, and wrong in the quiet way.
//
//   Stage 2, async, in an effect: fetch the rest of the live poll set and
//   hydrate the sync cache. This is what makes PollView's "Next poll →"
//   work -- goToNext() calls getLivePollsByCategory(poll.cat, now)
//   synchronously and needs a populated cache. Deferring it keeps the poll
//   itself interactive immediately; the only thing gated on stage 2 is the
//   next-poll button, which is disabled until then rather than silently
//   doing nothing.
//
// Fetching in the browser here (rather than passing the full set down from
// page.js) keeps page.js untouched and costs one anon-key read of public poll
// rows. If page.js is ever revised, passing `allPolls` in as a prop would be
// strictly better and this effect can go.
// =============================================================================

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { fetchLivePolls, hydratePolls, getCategoryMeta } from "@/lib/polls";
import { hydratePollsById, votingService } from "@/lib/votingService";
import PollView from "@/components/PollView";

export default function PollClient({ initialPoll }) {
  // Stage 1 -- synchronous, before PollView mounts.
  hydratePollsById([initialPoll]);

  const router = useRouter();
  const now = useRef(new Date()).current;

  const [votedChoice, setVotedChoice] = useState(undefined);
  const [votedLoaded, setVotedLoaded] = useState(false);
  const [toast, setToast] = useState("");
  const [cacheReady, setCacheReady] = useState(false);

  // Local "already voted" cache. This is a convenience read only -- the
  // server's voter_token cookie plus the (poll_id, voter_token) unique
  // constraint are the real enforcement. Clearing it just means the user
  // sees the choice buttons and gets an already_voted response instead of
  // the results appearing straight away.
  useEffect(() => {
    let cancelled = false;
    votingService
      .hasVotedLocally(initialPoll.id)
      .then((choice) => {
        if (cancelled) return;
        setVotedChoice(choice);
        setVotedLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setVotedLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [initialPoll.id]);

  // Stage 2 -- populate the sync cache so goToNext() has somewhere to go.
  useEffect(() => {
    let cancelled = false;
    fetchLivePolls()
      .then((polls) => {
        if (cancelled) return;
        hydratePolls(polls);
        hydratePollsById(polls);
        setCacheReady(true);
      })
      .catch(() => {
        // Next-poll stays unavailable; the poll itself still works fully.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // Hold the first paint until the local vote cache has been read. Without
  // this, a returning voter would see the choice buttons flash before the
  // results replaced them.
  if (!votedLoaded) return null;

  const meta = getCategoryMeta(initialPoll.cat) || {
    // A poll whose category isn't in CATEGORIES would otherwise crash
    // PollView, which reads meta.accent/meta.emoji/meta.label unguarded.
    id: initialPoll.cat,
    label: initialPoll.cat || "Poll",
    emoji: "",
    accent: "#6B7280",
  };

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px 80px" }}>
      <button
        onClick={() => router.push("/")}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          marginBottom: 18,
          fontSize: 13,
          color: "#6B7280",
          cursor: "pointer",
        }}
      >
        {"←"} All polls
      </button>

      <PollView
        poll={initialPoll}
        meta={meta}
        votedChoice={votedChoice}
        onVoteRecorded={(pollId, choiceIdx) => setVotedChoice(choiceIdx)}
        onShare={(message) => setToast(message)}
        onNextPoll={(nextId) => router.push(`/poll/${nextId}`)}
        now={now}
      />

      {!cacheReady && (
        <p style={{ fontSize: 11, color: "#C9C6B9", marginTop: 14 }}>
          Loading the rest of the polls&hellip;
        </p>
      )}

      {toast && (
        <div
          role="status"
          style={{
            position: "fixed",
            left: "50%",
            bottom: 24,
            transform: "translateX(-50%)",
            background: "#14171C",
            color: "#FBFAF7",
            padding: "10px 16px",
            borderRadius: 10,
            fontSize: 13,
            maxWidth: "90vw",
            textAlign: "center",
          }}
        >
          {toast}
        </div>
      )}
    </main>
  );
}
