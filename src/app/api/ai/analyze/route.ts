import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isAnthropicConfigured, callClaude } from "@/lib/anthropic/client";
import { checkAiAccess, requireProAiAccess, logAiRun } from "@/lib/anthropic/rateLimit";
import {
  buildClaimContext,
  buildLibraryContext,
  buildEscalationSignals,
  formatEscalationSignals,
  buildMoldSignals,
  formatMoldSignals,
} from "@/lib/anthropic/context";
import { analyzePrompt, PROMPT_VERSION, type AnalyzeTool } from "@/lib/anthropic/prompts";

const VALID_TOOLS: AnalyzeTool[] = ["policy", "gap", "loss", "mold"];
// MC (mold) is auto-detected from the claim's own tracked data — no
// freeform paste is required from the user, unlike PD/GA/LC.
const NO_INPUT_REQUIRED: AnalyzeTool[] = ["mold"];

// Emergency same-day disable (2026-08-10, founder-authorized): matches the
// hard block on the corresponding UI cards in
// src/app/claim/[id]/page.tsx (AI_TOOLS_LIVE) -- stops a direct request
// from reaching real analysis even with the cards hidden. Pending Section
// 8 attorney review.
const AI_TOOLS_LIVE = false;

export async function POST(request: NextRequest) {
  if (!AI_TOOLS_LIVE) {
    return NextResponse.json(
      { error: "This tool isn't available right now.", featureDisabled: true },
      { status: 503 },
    );
  }

  if (!isSupabaseConfigured() || !isAnthropicConfigured()) {
    return NextResponse.json(
      { error: "This service isn't configured yet." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await request.json();
  const tool = body.tool as AnalyzeTool;
  const claimId = String(body.claimId ?? "");
  const input = String(body.input ?? "").trim();

  if (!VALID_TOOLS.includes(tool)) {
    return NextResponse.json({ error: "Unknown analysis tool." }, { status: 400 });
  }
  if (!claimId || (!input && !NO_INPUT_REQUIRED.includes(tool))) {
    return NextResponse.json(
      { error: "claimId and input are required." },
      { status: 400 },
    );
  }

  // Billing Build Order Step 5: Mold Coverage Timeline is a Pro-tier
  // homeowner feature with no free allowance (unlike PD/GA/LC below) — the
  // approved pricing model's own explicit classification.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const gate =
    tool === "mold"
      ? await requireProAiAccess(supabase, claimId, user.id)
      : await checkAiAccess(supabase, user.id, claimId, ip);
  if (!gate.allowed) {
    return NextResponse.json({ error: gate.reason }, { status: 429 });
  }

  const [ctx, lib, signals] = await Promise.all([
    buildClaimContext(supabase, claimId),
    buildLibraryContext(supabase, user.id),
    // Only LC (loss) and MC (mold) use this — skip the extra queries for policy/gap.
    tool === "loss"
      ? buildEscalationSignals(supabase, claimId, user.id).then(formatEscalationSignals)
      : tool === "mold"
        ? buildMoldSignals(supabase, claimId).then(formatMoldSignals)
        : Promise.resolve(""),
  ]);

  const prompt = analyzePrompt(tool, input, ctx, lib, signals);

  let result;
  try {
    result = await callClaude(prompt);
  } catch (err) {
    console.error("analyze route: callClaude threw:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "The analysis service hit an error — your binder is untouched. Try again." },
      { status: 502 },
    );
  }

  await logAiRun(supabase, {
    userId: user.id,
    claimId,
    tool: `analyze:${tool}`,
    promptVersion: PROMPT_VERSION,
    output: result.text,
    tokensIn: result.usage.input_tokens,
    tokensOut: result.usage.output_tokens,
  });

  return NextResponse.json({ output: result.text });
}
