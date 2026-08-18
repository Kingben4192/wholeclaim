import { useState, useEffect, useCallback, useRef } from "react";

// =============================================================================
// SECTION 1: DESIGN TOKENS
// Ink #14171C, Paper #FBFAF7, Signal Yellow #F4B41A, Deep Violet #5B3A9E,
// Slate #6B7280, Line #E4E1D8
// Display: Fraunces (serif) -- questions. Body: Inter -- UI chrome.
// Mono: JetBrains Mono -- counts, percentages, tally marks.
// =============================================================================

// =============================================================================
// SECTION 2: DATA / CONFIG
// In a real deployment this section becomes its own module (e.g. data/polls.js)
// loaded from a CMS or database. It is kept in this file only because a
// single-file artifact can't import across files.
//
// Poll shape:
//   id, cat, q, choices[], source?, featured?, status, publishAt?, expiresAt?,
//   promotion?  (explicit, opt-in -- never inferred from category)
//
// status: "draft" | "published" | "archived"
//   - only "published" polls, within their publish/expire window, are shown.
// =============================================================================

const CATEGORIES = [
  { id: "politics", label: "Politics", emoji: "\u{1F5F3}\uFE0F", accent: "#5B3A9E" },
  { id: "health", label: "Health", emoji: "\u{1FA7A}", accent: "#1F8A6F" },
  { id: "trending", label: "Trending", emoji: "\u{1F525}", accent: "#D9481E" },
  { id: "social", label: "Social Media", emoji: "\u{1F4F1}", accent: "#1D6FBF" },
  { id: "home", label: "Home & Money", emoji: "\u{1F3E0}", accent: "#8A6D2F" },
  { id: "sports", label: "Sports & Entertainment", emoji: "\u26BD", accent: "#B8281F" },
];

// ---------------------------------------------------------------------------
// CURATION GOVERNANCE -- read before adding, editing, or selecting polls.
//
// Phase 1 objective: measure voluntary participation and demand for a place
// that asks people who don't usually get asked. NOT short-term traffic
// maximization. Timely/event-based polls (fashion weeks, World Cup, awards
// season, etc.) are an OPTIONAL rotation on top of the evergreen six-category
// base -- never the core strategy. If a "trending" pick and the Phase 1
// mission conflict, the mission wins.
//
// Standing safety rule for any topic, timely or evergreen:
//   1. No polls anchored to specific real minors or incidents involving
//      them, even indirectly.
//   2. Do not amplify a real-world event when the topic's traction depends
//      on participation, imitation, or copycat behavior.
//   3. Abstract the legitimate underlying question and remove identifying
//      incident details before it's eligible to become a poll.
//   4. When uncertain, skip the topic. Lost traffic from a skipped topic is
//      trivial; the downside of platforming something copycat-prone isn't.
//
// Freshness rule (added on this hardening pass): a poll tied to a specific
// news cycle rather than a known, dated calendar event (a tournament, an
// awards show, a fashion week) should not be published without an
// expiresAt, and should not lean on "this week" framing that will read as
// stale once it isn't. Prefer the evergreen version of the underlying
// question when a specific event isn't clearly dated. When a current
// question doesn't have a concrete, checkable source, don't invent one --
// either drop the source field or hold the poll in "draft" until it does.
//
// No user-created polls, comments, or a social feed in this phase -- every
// poll here is curated. Polls marked `featured: true` are eligible for the
// homepage "Today's Question" rotation via selectFeaturedPoll(); that flag
// is optional per poll, not required, and the selector always falls back to
// an evergreen published poll if nothing qualifies. "Today's Question" does
// not have to be about today's news -- it's whichever curated question is
// live right now.
//
// Promotion is opt-in metadata on a poll (`promotion: {...}`), never an
// implicit rule keyed off category. The polling product should not become a
// silent WholeClaim funnel -- if a poll carries promotion, that's a visible,
// deliberate editorial choice, not a side effect of its category.
// ---------------------------------------------------------------------------

const POLLS = [
  { id: "p1", cat: "politics", status: "published", q: "Should local elections be held on weekends to boost turnout?", choices: ["Yes", "No", "Only for major elections", "Not sure"] },
  { id: "p2", cat: "politics", status: "published", q: "Is ranked-choice voting a good idea for your state?", choices: ["Yes", "No", "Need to learn more", "Doesn't matter to me"] },
  { id: "p3", cat: "health", status: "published", q: "Do you track your sleep with an app or wearable?", choices: ["Every night", "Sometimes", "Used to, stopped", "Never"] },
  { id: "p4", cat: "health", status: "published", q: "What's your biggest barrier to eating healthier?", choices: ["Cost", "Time", "Motivation", "Not sure what's actually healthy"] },
  { id: "p5", cat: "trending", status: "published", q: "Are AI-generated images ruining social feeds?", choices: ["Yes, mostly", "No, they're fine", "Depends on the use", "Haven't noticed"] },
  { id: "p6", cat: "trending", status: "published", q: "Four-day work week: would you take a pay cut for it?", choices: ["Yes, gladly", "No, need full pay", "Small cut only", "Prefer 5 days"] },
  { id: "p7", cat: "social", status: "published", q: "Which platform has the best discovery algorithm right now?", choices: ["TikTok", "Instagram", "YouTube", "X"], source: { label: "Ongoing creator debate across platforms, not tied to one post", url: null } },
  { id: "p8", cat: "social", status: "published", q: "Do you trust product reviews you see on social media?", choices: ["Yes, usually", "Rarely", "Only from creators I follow", "Never"] },
  { id: "p9", cat: "home", status: "published", q: "Would you pay $19 for a tool that helps you document your home's condition, room by room?", choices: ["Yes", "No", "Maybe, depends what's included", "I'd want it free"], promotion: { label: "If this is on your mind: The Homeowner's Property Record Kit", url: "https://www.getwholeclaim.com" } },
  { id: "p10", cat: "home", status: "published", q: "Have you ever wished you'd documented your home's condition before something went wrong?", choices: ["Yes", "No", "Never thought about it", "I already do this"], promotion: { label: "If this is on your mind: The Homeowner's Property Record Kit", url: "https://www.getwholeclaim.com" } },
  { id: "p11", cat: "home", status: "published", q: "What worries you most about a home renovation project?", choices: ["Cost overruns", "Finding a trustworthy contractor", "Timeline delays", "Permits/inspections"] },
  { id: "p12", cat: "sports", status: "published", q: "Should college athletes be paid a salary by their schools?", choices: ["Yes", "No", "Only revenue sports", "NIL deals are enough"] },
  { id: "p13", cat: "sports", status: "published", q: "Are award shows still relevant to how you discover new shows/movies?", choices: ["Yes", "No", "Only for buzz, not decisions", "I don't watch them"] },
  { id: "p14", cat: "trending", status: "published", q: "When a post claims a common habit is 'secretly ruining your productivity,' do you believe claims like this without a source?", choices: ["No, I want a source", "Sometimes, if it sounds plausible", "Yes, if enough people agree", "I ignore these posts"], source: { label: "General pattern seen in productivity-hack virality, not tied to one post", url: null } },
  { id: "p15", cat: "health", status: "published", q: "Would you trust a symptom-checker app over calling a doctor's office?", choices: ["Yes, for minor things", "No, always call", "Only to decide if I should call", "Never used one"] },
  { id: "p16", cat: "trending", status: "published", featured: true, q: "Internet nostalgia cycles come back often \u2014 does that say something real about how people feel about right now?", choices: ["Yes, it's a mood signal", "No, it's just a content format", "A bit of both", "Haven't noticed the trend"], source: { label: "Recurring nostalgia-cycle pattern across TikTok/Instagram, not tied to one post", url: null } },
  { id: "p17", cat: "trending", status: "published", q: "Should companies have to tell you when AI, not a person, made a decision about you (hiring, a loan, a claim)?", choices: ["Yes, always disclose", "Only for major decisions", "No, doesn't matter how it's made", "Not sure"] },
  // p18 (military deployment length): held back on this pass. The original
  // version leaned on "this week's coverage" without a checkable source and
  // will read as stale almost immediately. Revised to an evergreen framing
  // with no invented citation; left in "draft" for a deliberate publish
  // decision rather than shipped by default.
  { id: "p18", cat: "politics", status: "draft", q: "Should military deployment lengths be fixed in advance, or flexible based on need?", choices: ["Fixed, set in advance", "Flexible based on need", "Depends on the mission", "Not sure"] },
  // p19 (World Cup): originally seeded 'published' with expiresAt in the
  // future relative to authoring time. By deployment time (2026-08-16) the
  // tournament had already concluded (final was July 19), making this
  // stale on substance, not just past its window -- it would render as a
  // normal votable poll while silently rejecting every vote as expired.
  // Archived rather than deleted, so it stays as a record. If a World Cup
  // poll is wanted again, write a new past-tense question instead of
  // reviving this one.
  { id: "p19", cat: "sports", status: "archived", q: "The 2026 World Cup is being hosted across the US, Canada, and Mexico \u2014 are you planning to watch?", choices: ["Yes, in person if I can", "Yes, on TV/streaming", "I'll catch highlights only", "Not really into it"], expiresAt: "2026-07-20T00:00:00Z" },
  { id: "p20", cat: "social", status: "published", q: "During fashion week season, do you actually follow runway shows, or just the recap posts?", choices: ["I watch full shows", "Just recaps/highlights", "Only if a favorite creator covers it", "Don't follow fashion week at all"], expiresAt: "2026-10-10T00:00:00Z" },
  { id: "p21", cat: "trending", status: "published", q: "During back-to-school season, what stresses you out most?", choices: ["Cost of supplies/clothes", "Schedule/childcare logistics", "Screen time & social media rules", "Nothing, we're in a good routine"], expiresAt: "2026-09-20T00:00:00Z" },
  { id: "p22", cat: "sports", status: "published", q: "Should college football expand the playoff again, or is the current format enough?", choices: ["Expand it further", "Current format is fine", "Actually roll it back", "Don't follow college football"] },
  { id: "p23", cat: "social", status: "published", q: "Are you more likely to try a product after seeing it in a 'worth every penny' style list than a traditional ad?", choices: ["Yes, much more likely", "No difference to me", "No, I trust ads more", "I ignore both"], source: { label: "Reflects a recurring list-style trend on TikTok/Instagram, not tied to one post", url: null } },
];

// =============================================================================
// SECTION 3: DATA HELPERS
// =============================================================================

function isPollLive(poll, now) {
  if (poll.status !== "published") return false;
  if (poll.publishAt && new Date(poll.publishAt) > now) return false;
  if (poll.expiresAt && new Date(poll.expiresAt) < now) return false;
  return true;
}

function getLivePolls(now = new Date()) {
  return POLLS.filter((p) => isPollLive(p, now));
}

function getLivePollsByCategory(catId, now = new Date()) {
  return getLivePolls(now).filter((p) => p.cat === catId);
}

function getLivePollById(pollId, now = new Date()) {
  const poll = POLLS.find((p) => p.id === pollId);
  if (!poll || !isPollLive(poll, now)) return null;
  return poll;
}

// Deliberate "Today's Question" selection: prefer a currently-live featured
// poll; if none qualifies (expired, not yet published, or none flagged),
// fall back to an evergreen live poll rather than showing nothing.
function selectFeaturedPoll(now = new Date()) {
  const live = getLivePolls(now);
  const featuredLive = live.filter((p) => p.featured);
  if (featuredLive.length > 0) return featuredLive[0];
  const evergreen = live.filter((p) => !p.expiresAt);
  if (evergreen.length > 0) return evergreen[0];
  return live[0] || null;
}

function getCategoryMeta(catId) {
  return CATEGORIES.find((c) => c.id === catId);
}

// =============================================================================
// SECTION 4: VOTING SERVICE ABSTRACTION
// The UI depends only on this interface:
//   getPollResults(pollId)      -> Promise<{ counts: number[], total: number }>
//   submitVote(pollId, choiceIndex) -> Promise<{ counts: number[], total: number }>
//   hasVotedLocally(pollId)     -> choiceIndex | undefined
//   recordLocalVote(pollId, choiceIndex)
//
// DemoVotingAdapter below is a clearly-labeled, isolated stand-in backed by
// window.storage. It is NOT a production voting backend:
//   - it does a client-side get -> increment -> set, which can lose votes
//     under concurrent writes (last-write-wins)
//   - "one vote" is enforced only by a local flag in this browser's storage,
//     not a server-side identity/session/rate-limit check
//   - totals are not authoritative and should never be trusted as reported
//     public data
// A production adapter must replace this with real API calls that validate
// poll id + choice index server-side, record votes atomically, rate-limit
// submissions, and reject duplicate/expired/unpublished polls server-side.
// The client should never be the source of truth for a vote total.
// =============================================================================

const DemoVotingAdapter = {
  async getPollResults(pollId) {
    const poll = POLLS.find((p) => p.id === pollId);
    const width = poll ? poll.choices.length : 0;
    try {
      const res = await window.storage.get(`votes:${pollId}`, true);
      if (res && res.value) {
        const counts = JSON.parse(res.value);
        return { counts, total: counts.reduce((a, b) => a + b, 0) };
      }
    } catch (e) {
      // no votes recorded yet for this poll
    }
    const counts = new Array(width).fill(0);
    return { counts, total: 0 };
  },

  async submitVote(pollId, choiceIndex) {
    // DEMO ONLY: not atomic. See module note above.
    const { counts: current } = await this.getPollResults(pollId);
    const updated = [...current];
    updated[choiceIndex] = (updated[choiceIndex] || 0) + 1;
    const result = await window.storage.set(`votes:${pollId}`, JSON.stringify(updated), true);
    if (!result) throw new Error("Vote could not be saved");
    return { counts: updated, total: updated.reduce((a, b) => a + b, 0) };
  },

  async hasVotedLocally(pollId) {
    try {
      const res = await window.storage.get("voted-polls", false);
      if (res && res.value) {
        const map = JSON.parse(res.value);
        return map[pollId];
      }
    } catch (e) {
      // no record yet
    }
    return undefined;
  },

  async recordLocalVote(pollId, choiceIndex) {
    let map = {};
    try {
      const res = await window.storage.get("voted-polls", false);
      if (res && res.value) map = JSON.parse(res.value);
    } catch (e) {
      // no record yet
    }
    map[pollId] = choiceIndex;
    await window.storage.set("voted-polls", JSON.stringify(map), false);
    return map;
  },

  async getAllVotedLocally() {
    try {
      const res = await window.storage.get("voted-polls", false);
      if (res && res.value) return JSON.parse(res.value);
    } catch (e) {
      // no record yet
    }
    return {};
  },
};

// Swap this for a real backend-backed adapter when one exists. Everything
// else in the UI talks to `votingService`, not to window.storage directly.
const votingService = DemoVotingAdapter;

// =============================================================================
// SECTION 5: ROUTING HELPERS (prototype-only hash routing)
// Kept intentionally thin so /poll/:pollId can become a real server route
// later without rewriting PollView.
// =============================================================================

function pollUrl(pollId) {
  const base = (typeof window !== "undefined" && window.location) ? window.location.href.split("#")[0] : "";
  return `${base}#/poll/${pollId}`;
}

function getPollIdFromHash() {
  if (typeof window === "undefined") return null;
  const m = window.location.hash.match(/#\/poll\/(\w+)/);
  return m ? m[1] : null;
}

function setPollHash(pollId) {
  if (typeof window !== "undefined") window.location.hash = `/poll/${pollId}`;
}

function clearHash() {
  if (typeof window !== "undefined") window.location.hash = "";
}

// =============================================================================
// SECTION 6: SMALL PRESENTATIONAL COMPONENTS
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

// =============================================================================
// SECTION 7: APP
// =============================================================================

export default function PollApp() {
  const [screen, setScreen] = useState("boot"); // boot | home | category | poll
  const [activeCat, setActiveCat] = useState(null);
  const [activePollId, setActivePollId] = useState(null);
  const [votedMap, setVotedMap] = useState({});
  const [toast, setToast] = useState("");
  const now = useRef(new Date()).current;

  // Initial boot: load local vote history, then honor a deep link if present.
  useEffect(() => {
    (async () => {
      const voted = await votingService.getAllVotedLocally();
      setVotedMap(voted);
      const linkedId = getPollIdFromHash();
      const linkedPoll = linkedId ? getLivePollById(linkedId, now) : null;
      if (linkedPoll) {
        setActivePollId(linkedPoll.id);
        setScreen("poll");
      } else {
        setScreen("home");
      }
    })();
  }, [now]);

  // Respond to back/forward or manual hash changes while the app is open.
  useEffect(() => {
    function onHashChange() {
      const linkedId = getPollIdFromHash();
      if (!linkedId) {
        setScreen((s) => (s === "poll" ? "home" : s));
        return;
      }
      const linkedPoll = getLivePollById(linkedId, now);
      if (linkedPoll) {
        setActivePollId(linkedPoll.id);
        setScreen("poll");
      }
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [now]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 2400);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const goHome = useCallback(() => {
    setScreen("home");
    setActiveCat(null);
    setActivePollId(null);
    clearHash();
  }, []);

  const openCategory = useCallback((catId) => {
    setActiveCat(catId);
    setScreen("category");
    clearHash();
  }, []);

  const openPoll = useCallback((pollId) => {
    setActivePollId(pollId);
    setScreen("poll");
    setPollHash(pollId);
  }, []);

  const activePoll = activePollId ? getLivePollById(activePollId, now) : null;
  const featuredPoll = selectFeaturedPoll(now);

  return (
    <div
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        background: "#FBFAF7",
        color: "#14171C",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
        * { box-sizing: border-box; }
        button { font-family: inherit; cursor: pointer; }
        .choice-btn:hover:not(:disabled) { border-color: #14171C !important; background: #F4F1E8 !important; }
        .choice-btn:focus-visible { outline: 3px solid #5B3A9E; outline-offset: 2px; }
        .cat-card:hover { transform: translateY(-2px); box-shadow: 0 6px 0 rgba(20,23,28,0.9); }
        .cat-card:focus-visible { outline: 3px solid #5B3A9E; outline-offset: 3px; }
        a:focus-visible, button:focus-visible { outline: 3px solid #5B3A9E; outline-offset: 2px; }
        .cat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 420px) {
          .cat-grid { grid-template-columns: 1fr; }
          .app-title { font-size: 19px !important; }
          .poll-question { font-size: 22px !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .cat-card, .bar-fill { transition: none !important; }
        }
      `}</style>

      <header
        style={{
          width: "100%",
          borderBottom: "1px solid #E4E1D8",
          padding: "18px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          maxWidth: 720,
          gap: 12,
        }}
      >
        <button
          className="app-title"
          onClick={goHome}
          aria-label="Go to home screen"
          style={{
            background: "none",
            border: "none",
            padding: 0,
            fontFamily: "'Fraunces', serif",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "#14171C",
            textAlign: "left",
          }}
        >
          What Do People Think?
        </button>
        {screen !== "home" && screen !== "boot" && (
          <button
            onClick={goHome}
            style={{
              flexShrink: 0,
              background: "none",
              border: "1px solid #14171C",
              borderRadius: 20,
              padding: "6px 14px",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            All categories
          </button>
        )}
      </header>

      <main style={{ width: "100%", maxWidth: 720, padding: "28px 20px 80px", flex: 1 }}>
        {screen === "boot" && <LoadingLine label="Loading\u2026" />}

        {screen === "home" && (
          <HomeView
            featuredPoll={featuredPoll}
            onOpenPoll={openPoll}
            onOpenCategory={openCategory}
            now={now}
          />
        )}

        {screen === "category" && activeCat && (
          <CategoryView
            catId={activeCat}
            now={now}
            votedMap={votedMap}
            onOpenPoll={openPoll}
          />
        )}

        {screen === "poll" && activePollId && (
          activePoll ? (
            <PollView
              key={activePoll.id}
              poll={activePoll}
              meta={getCategoryMeta(activePoll.cat)}
              votedChoice={votedMap[activePoll.id]}
              onVoteRecorded={(pollId, choiceIndex) =>
                setVotedMap((m) => ({ ...m, [pollId]: choiceIndex }))
              }
              onShare={setToast}
              onNextPoll={openPoll}
              now={now}
            />
          ) : (
            <ErrorLine label="This poll isn't available right now \u2014 it may have expired or been unpublished." />
          )
        )}
      </main>

      {toast && (
        <div
          role="status"
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#14171C",
            color: "#FBFAF7",
            padding: "10px 18px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            maxWidth: "90vw",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SECTION 8: SCREENS
// =============================================================================

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

// Minimum total votes before a poll is badged as trending in a category
// list. This is a simple volume threshold, not a velocity/rate calculation
// -- the demo adapter only stores aggregate counts, not timestamped events,
// so "trending" here means "has real traction," not "moving fast right
// now." A production backend with a vote event log could upgrade this to a
// true recent-velocity signal.
const TRENDING_THRESHOLD = 15;

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
    const url = pollUrl(poll.id);
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

      {hasVoted && (
        <p style={{ fontSize: 11, color: "#B0AEA3", marginTop: 18 }}>
          Prototype note: this demo's vote counts and one-vote check are not a
          production voting backend — see the votingService module notes
          in source for what production requires.
        </p>
      )}
    </div>
  );
}
