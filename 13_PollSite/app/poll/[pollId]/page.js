// =============================================================================
// /poll/[pollId] -- a real, server-rendered route (not the hash-routing
// prototype used "#/poll/p7"). This is what makes:
//   - a shared link work even if JS hasn't loaded yet
//   - Facebook's link-preview crawler (which does NOT execute JS) see real
//     question/description/image content instead of a blank shell
//
// generateMetadata runs server-side per request and produces the Open
// Graph tags Facebook reads when someone pastes this URL into a post.
//
// NOTE: in this Next.js version, `params` is a Promise and must be awaited
// -- both here and in generateMetadata. Passing the unresolved Promise into
// getPollById() will not work as written; this was caught in review before
// deploy, not discovered live.
// =============================================================================

import { notFound } from "next/navigation";
import { getPollById } from "@/lib/polls"; // server-side poll lookup (DB or config)
import PollClient from "./PollClient"; // the interactive client component (voting UI)

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;
if (!SITE_URL) {
  // Fail loudly at build/boot time rather than silently shipping
  // "undefined/og-default.png" into every Facebook share preview.
  throw new Error(
    "NEXT_PUBLIC_SITE_URL is not set. Set it in the Vercel project's " +
      "environment variables before deploying -- required for correct " +
      "Open Graph / Facebook link-preview URLs."
  );
}

export async function generateMetadata({ params }) {
  const { pollId } = await params;
  const poll = await getPollById(pollId);

  if (!poll) {
    return {
      title: "Poll not found \u2014 What Do People Think?",
      description: "This poll may have expired or been unpublished.",
    };
  }

  // poll.q, not poll.question -- lib/polls.js toPoll() maps the `question`
  // column to the artifact's field name `q`. Reading .question here produced
  // "undefined \u2014 What Do People Think?" in og:title, caught in live testing.
  const title = `${poll.q} \u2014 What Do People Think?`;
  const description =
    "Vote and see what real people think. Not a scientific poll \u2014 just an honest, voluntary count.";
  // A per-poll OG image is worth building once this is live (e.g. an
  // /api/og/[pollId] route that renders the question + current % as an
  // image using @vercel/og). Until that exists, fall back to one static
  // branded image so Facebook always has *something* to show rather than
  // a blank/broken preview.
  const ogImage = `${SITE_URL}/og-default.png`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/poll/${poll.id}`,
      siteName: "What Do People Think?",
      images: [{ url: ogImage, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function PollPage({ params }) {
  const { pollId } = await params;
  const poll = await getPollById(pollId);

  if (!poll) {
    // A shared link to an expired/unpublished/nonexistent poll should hit a
    // real 404, not silently render the interactive poll UI with a null
    // poll object (which the client component isn't built to handle safely).
    notFound();
  }

  return <PollClient initialPoll={poll} />;
}
