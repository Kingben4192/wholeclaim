// =============================================================================
// POST /api/admin/top-story/decide
// Body: { candidateId: number, action: "approve"|"park"|"reject",
//         question?: string, choices?: string[], category?: string }
//
// The human gate. Nothing in the Top Story pipeline reaches the public site
// except through this route, and only on an explicit approve.
//
// Gated by middleware.js like every other /api/admin* route.
// =============================================================================

import { NextResponse } from "next/server";
import { decide } from "@/lib/topstory/store";

const ACTIONS = ["approve", "park", "reject"];
const CATEGORIES = ["politics", "health", "trending", "social", "home", "sports"];

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: "invalid_request_body" }, { status: 400 });
  }

  const { candidateId, action, question, choices, category, expiresAt } = body || {};

  if (!Number.isInteger(candidateId)) {
    return NextResponse.json({ error: "invalid_candidate_id" }, { status: 400 });
  }
  if (!ACTIONS.includes(action)) {
    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  }

  // Edits arrive from a text field, so validate them to the same shape the
  // drafting schema enforces -- an approve must not be able to write a poll
  // the rest of the app considers malformed.
  const edits = {};
  if (question !== undefined) {
    if (typeof question !== "string" || !question.trim()) {
      return NextResponse.json({ error: "invalid_question" }, { status: 400 });
    }
    edits.question = question.trim();
  }
  if (choices !== undefined) {
    if (
      !Array.isArray(choices) ||
      choices.length < 2 ||
      choices.length > 4 ||
      choices.some((c) => typeof c !== "string" || !c.trim())
    ) {
      return NextResponse.json({ error: "invalid_choices" }, { status: 400 });
    }
    edits.choices = choices.map((c) => c.trim());
  }
  if (category !== undefined) {
    if (!CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "invalid_category" }, { status: 400 });
    }
    edits.category = category;
  }
  // expires_at retires a poll once its question has resolved. Null is a valid,
  // explicit "evergreen". A date already in the past is rejected: it would
  // publish a poll that is dead on arrival -- visible in /admin as EXPIRED,
  // 404 to the public, and rejecting every vote.
  if (expiresAt !== undefined) {
    if (expiresAt === null || expiresAt === "") {
      edits.expiresAt = null;
    } else if (typeof expiresAt !== "string" || Number.isNaN(Date.parse(expiresAt))) {
      return NextResponse.json({ error: "invalid_expires_at" }, { status: 400 });
    } else if (Date.parse(expiresAt) <= Date.now()) {
      return NextResponse.json({ error: "expires_at_in_the_past" }, { status: 400 });
    } else {
      edits.expiresAt = new Date(expiresAt).toISOString();
    }
  }

  try {
    const result = await decide(candidateId, action, edits);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e.message || "decide_failed";
    // "already approved/parked/rejected" is a conflict, not a server fault --
    // most likely a double-click or two tabs open on the same candidate.
    const conflict = /already/.test(msg) || /not found/.test(msg);
    console.error("top-story decide failed:", e);
    return NextResponse.json({ ok: false, error: msg }, { status: conflict ? 409 : 500 });
  }
}
