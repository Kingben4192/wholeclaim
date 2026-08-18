// =============================================================================
// /admin/top-story — the human gate for the Top Story pipeline.
//
// Server component: all data fetching happens here with the service-role
// client, so nothing privileged reaches the browser. middleware.js already
// gates every /admin* route; the session check below is defence in depth, so
// the guarantee doesn't rest on middleware.js staying correct forever.
//
// Read-only elsewhere in /admin is a deliberate constraint. This route is the
// deliberate exception — it is the only place in the product where a human
// decision writes to `polls`. Worth naming rather than letting it erode.
// =============================================================================

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, isValidSession } from "@/lib/adminAuth";
import { listPendingGrouped, getCurrentTopStory } from "@/lib/topstory/store";
import TopStoryClient from "./TopStoryClient";

export const dynamic = "force-dynamic";

export default async function TopStoryPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!(await isValidSession(session))) {
    redirect("/admin/login");
  }

  let groups = [];
  let currentTopStory = null;
  let loadError = null;

  try {
    [groups, currentTopStory] = await Promise.all([listPendingGrouped(), getCurrentTopStory()]);
  } catch (e) {
    // Same rule as the dashboard: surface the failure, never substitute a
    // fabricated empty state that reads as "nothing to review".
    loadError = e.message || String(e);
  }

  if (loadError) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }}>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 26 }}>Top Story — review</h1>
        <p style={{ border: "1.5px solid #D9481E", background: "#FBEDE7", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#8A2E0F" }}>
          Couldn&rsquo;t load candidates: {loadError}
        </p>
        <p style={{ fontSize: 13, color: "#6B7280" }}>
          If this says the relation does not exist, <code>migration-003-top-story.sql</code> has not
          been run against this project.
        </p>
      </div>
    );
  }

  return <TopStoryClient groups={groups} currentTopStory={currentTopStory} />;
}
