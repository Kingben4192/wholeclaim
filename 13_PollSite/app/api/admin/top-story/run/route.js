// =============================================================================
// POST /api/admin/top-story/run — trigger a drafting run.
//
// DECISION 2 (run mechanism): MANUAL TRIGGER, not a Vercel cron.
//
// Reasoning, recorded here because the ticket asked for it:
//
//   1. It matches the cadence. Decision 5 is publish-when-warranted with no
//      daily quota. A cron creates a daily rhythm the product deliberately
//      doesn't have, and a queue of unreviewed candidates aging in the
//      database is a standing invitation to publish something mediocre
//      because it's already sitting there.
//   2. No unattended spend. Every run costs a real Opus 5 call (~$0.11
//      measured). A manual trigger spends only when the operator is present
//      and about to review; a cron spends every day whether or not anyone
//      looks.
//   3. It matches this product's established pattern. There is no git
//      deployment hook and no auto-deploy -- releases go out via explicit
//      `vercel --prod`. The operator initiates; nothing fires on its own.
//   4. Cron is a strictly later addition. The drafting function is identical
//      either way; adding a scheduled caller is a small change if the cadence
//      ever justifies it. Starting with cron and removing it is not as cheap.
//
// Gated by middleware.js like every other /api/admin* route.
// =============================================================================

import { NextResponse } from "next/server";
import { fetchRecentHeadlines } from "@/lib/topstory/sources";
import { draftCandidates } from "@/lib/topstory/draft";
import { saveRun } from "@/lib/topstory/store";

// A drafting run fetches seven feeds and makes an Opus 5 call; the default
// serverless timeout is too short for that.
export const maxDuration = 300;

export async function POST() {
  try {
    const { items, sources } = await fetchRecentHeadlines();

    if (items.length === 0) {
      // Decision 4, thin-day behaviour: no candidates, no substitution. The
      // existing Top Story stays exactly where it is.
      return NextResponse.json({
        ok: true,
        headlines: 0,
        sources,
        drafted: 0,
        rejected: 0,
        note: "No headlines in the window. Existing Top Story left in place.",
      });
    }

    const result = await draftCandidates(items);

    if (result.refused) {
      return NextResponse.json(
        {
          ok: false,
          error: "refused",
          category: result.refusalCategory,
          note: "Safety classifiers declined this run. Existing Top Story left in place.",
        },
        { status: 200 }
      );
    }

    const { inserted } = await saveRun(result);

    return NextResponse.json({
      ok: true,
      headlines: items.length,
      sources,
      drafted: result.candidates.length,
      rejected: result.rejected.length,
      inserted,
      servedBy: result.servedBy,
      usage: result.usage
        ? { input_tokens: result.usage.input_tokens, output_tokens: result.usage.output_tokens }
        : null,
      // Decision 4/5 again, stated in the response so the UI can say it
      // plainly: zero passing candidates is a valid outcome, not a failure.
      note:
        result.candidates.length === 0
          ? "Nothing cleared the governance filter. Existing Top Story left in place."
          : null,
    });
  } catch (e) {
    console.error("top-story run failed:", e);
    return NextResponse.json({ ok: false, error: e.message || "run_failed" }, { status: 500 });
  }
}
