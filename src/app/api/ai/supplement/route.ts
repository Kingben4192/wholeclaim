import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isAnthropicConfigured, callClaude } from "@/lib/anthropic/client";
import { requireProAiAccess, logAiRun } from "@/lib/anthropic/rateLimit";
import { buildClaimContext, buildLibraryContext } from "@/lib/anthropic/context";
import { supplementPrompt, PROMPT_VERSION } from "@/lib/anthropic/prompts";

export async function POST(request: NextRequest) {
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
  const claimId = String(body.claimId ?? "");
  const carrierEstimate = String(body.carrierEstimate ?? "").trim();
  const contractorEstimate = String(body.contractorEstimate ?? "").trim();

  if (!claimId) {
    return NextResponse.json({ error: "claimId is required." }, { status: 400 });
  }
  if (!carrierEstimate && !contractorEstimate) {
    return NextResponse.json(
      { error: "At least one of the carrier or contractor estimate is required." },
      { status: 400 },
    );
  }

  // Supplement Assistant is a Pro-tier homeowner feature with no free
  // allowance (approved pricing model) — isPro only, no checkUsageGate.
  const gate = await requireProAiAccess(supabase, claimId, user.id);
  if (!gate.allowed) {
    return NextResponse.json({ error: gate.reason }, { status: 429 });
  }

  const [ctx, lib] = await Promise.all([
    buildClaimContext(supabase, claimId),
    buildLibraryContext(supabase, user.id),
  ]);

  const prompt = supplementPrompt(carrierEstimate, contractorEstimate, ctx, lib);

  let result;
  try {
    result = await callClaude(prompt);
  } catch (err) {
    console.error("supplement route: callClaude threw:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "The analysis service hit an error — your binder is untouched. Try again." },
      { status: 502 },
    );
  }

  await logAiRun(supabase, {
    userId: user.id,
    claimId,
    tool: "supplement",
    promptVersion: PROMPT_VERSION,
    output: result.text,
    tokensIn: result.usage.input_tokens,
    tokensOut: result.usage.output_tokens,
  });

  return NextResponse.json({ output: result.text });
}
