import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isAnthropicConfigured, callClaude } from "@/lib/anthropic/client";
import { checkAiAccess, logAiRun } from "@/lib/anthropic/rateLimit";
import { buildClaimContext, buildLibraryContext } from "@/lib/anthropic/context";
import { letterPrompt, PROMPT_VERSION, type LetterType } from "@/lib/anthropic/prompts";

const VALID_TYPES: LetterType[] = ["supplement", "delay", "doi", "nonrenewal"];

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
  const type = body.type as LetterType;
  const claimId = String(body.claimId ?? "");
  const facts = String(body.facts ?? "").trim();

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "Unknown letter type." }, { status: 400 });
  }
  if (!claimId) {
    return NextResponse.json({ error: "claimId is required." }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const gate = await checkAiAccess(supabase, user.id, claimId, ip);
  if (!gate.allowed) {
    return NextResponse.json({ error: gate.reason }, { status: 429 });
  }

  const [ctx, lib] = await Promise.all([
    buildClaimContext(supabase, claimId),
    buildLibraryContext(supabase, user.id),
  ]);

  const prompt = letterPrompt(type, facts, ctx, lib);

  let result;
  try {
    result = await callClaude(prompt);
  } catch (err) {
    console.error("letter route: callClaude threw:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "The analysis service hit an error — your binder is untouched. Try again." },
      { status: 502 },
    );
  }

  await logAiRun(supabase, {
    userId: user.id,
    claimId,
    tool: `letter:${type}`,
    promptVersion: PROMPT_VERSION,
    output: result.text,
    tokensIn: result.usage.input_tokens,
    tokensOut: result.usage.output_tokens,
  });

  return NextResponse.json({ output: result.text });
}
