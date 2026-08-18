"use client";

// =============================================================================
// Client shell for the homepage. Three jobs, and deliberately nothing else:
//
//   1. Hydrate the sync poll cache (lib/polls.js) and the voting adapter's
//      choice-count map (lib/votingService.js) from the server-fetched polls,
//      BEFORE any child renders.
//   2. Hold the home/category screen switch, since CategoryView has no route
//      of its own (see note below).
//   3. Turn the components' onOpenPoll/onOpenCategory callbacks into real
//      navigation.
//
// HYDRATION ORDER MATTERS. Both hydrate calls run in this component's render
// body, which executes before HomeView or CategoryView render and contains no
// await. That is what lets those components call getLivePolls(now) and
// getLivePollsByCategory(catId, now) synchronously, exactly as the artifact
// did, and get real arrays back on the first paint.
//
// WHY CATEGORY BROWSING IS STATE, NOT A ROUTE. HomeView's "Explore" grid calls
// onOpenCategory(catId), but there is no app/category/[catId] route in this
// build and adding one was outside the authorized scope. Rather than wire
// those tiles to a URL that would 404, the category list renders in place
// here. If a shareable per-category URL is wanted later, this is the piece to
// replace -- CategoryView itself needs no changes for that.
// =============================================================================

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { hydratePolls, getCategoryMeta } from "@/lib/polls";
import { hydratePollsById, votingService } from "@/lib/votingService";
import HomeView from "@/components/HomeView";
import CategoryView from "@/components/CategoryView";

export default function HomeClient({ polls, featuredPoll }) {
  // Runs before children render, synchronously. Idempotent.
  hydratePolls(polls);
  hydratePollsById(polls);

  const router = useRouter();
  // One fixed "now" for the whole session, matching the artifact's PollApp --
  // so a poll can't blink out mid-interaction because a re-render advanced
  // the clock past its expiresAt.
  const now = useRef(new Date()).current;

  const [activeCat, setActiveCat] = useState(null);
  const [votedMap, setVotedMap] = useState({});

  useEffect(() => {
    let cancelled = false;
    votingService.getAllVotedLocally().then((map) => {
      if (!cancelled) setVotedMap(map || {});
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function openPoll(pollId) {
    router.push(`/poll/${pollId}`);
  }

  if (activeCat) {
    const meta = getCategoryMeta(activeCat);
    return (
      <main style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px 80px" }}>
        <button
          onClick={() => setActiveCat(null)}
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
          {"←"} All categories
        </button>
        <CategoryView catId={activeCat} now={now} votedMap={votedMap} onOpenPoll={openPoll} />
        {!meta && (
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>That category doesn&rsquo;t exist.</p>
        )}
      </main>
    );
  }

  // Ticket 1: decorative wordmark behind the hero. Rendered only on the home
  // screen, not the category screen, since it is positioned against the hero
  // specifically. aria-hidden so it is never announced or read as content --
  // it duplicates the site name that already appears as real text.
  return (
    <div style={{ position: "relative", overflow: "hidden" }}>
      <div className="wordmark-layer" aria-hidden="true">
        <span>whatdopeoplethink</span>
      </div>
      <main
        className="page-content"
        style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px 80px" }}
      >
        <HomeView
          featuredPoll={featuredPoll}
          onOpenPoll={openPoll}
          onOpenCategory={setActiveCat}
          now={now}
        />
      </main>
    </div>
  );
}
