// =============================================================================
// / -- the homepage. Server component shell: fetches the live poll set once,
// server-side, and hands it to the client shell. Doing the fetch here (rather
// than from the browser on mount) means the poll data is in the initial HTML
// and the page has something to render before JS runs.
//
// The featured poll is selected server-side too, via selectFeaturedPoll()'s
// featured -> evergreen -> first-live fallback, so "Today's Question" is
// decided in one place rather than recomputed per client render.
//
// Interactivity lives in HomeClient (a client component) because HomeView and
// CategoryView both use useState/useEffect. This split mirrors the one
// app/poll/[pollId]/page.js already uses with PollClient.
// =============================================================================

import { fetchLivePolls, selectFeaturedPoll } from "@/lib/polls";
import HomeClient from "./HomeClient";

// Render per request, never prerender.
//
// Without this Next statically prerenders this page at build time and serves
// it from cache forever (X-Nextjs-Prerender: 1, X-Vercel-Cache: HIT). The
// homepage then freezes whatever poll data existed at build: the featured
// hero, the category counts, the per-category teasers, and Newest Polls all
// stop reflecting the database. Approving a new Top Story changed `featured`
// in Postgres and the homepage kept showing the old one -- the poll's own
// page was correct the whole time, because /poll/[pollId] is dynamic.
//
// This is the same "looks live but isn't" failure as the p19 expired-poll
// trap, one layer up: the data is stale rather than wrong, and nothing
// errors, so it reads as working. For a product whose entire claim is a live
// count, a cached homepage is the wrong default.
//
// Cost is one Supabase read per homepage request. If traffic ever makes that
// matter, `export const revalidate = 30` is the tuning knob -- but it
// reintroduces a staleness window, so only trade it deliberately.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "What Do People Think?",
  description:
    "Vote and see what real people think. Not a scientific poll — just an honest, voluntary count.",
};

export default async function HomePage() {
  const polls = await fetchLivePolls();
  const featuredPoll = selectFeaturedPoll(polls);

  return <HomeClient polls={polls} featuredPoll={featuredPoll} />;
}
