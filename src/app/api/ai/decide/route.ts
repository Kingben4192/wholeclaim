import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isAnthropicConfigured, callClaude } from "@/lib/anthropic/client";
import { checkUsageGate, logAiRun } from "@/lib/anthropic/rateLimit";
import { buildClaimContext, buildLibraryContext } from "@/lib/anthropic/context";
import { decidePrompt, PROMPT_VERSION } from "@/lib/anthropic/prompts";

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
  const offer = String(body.offer ?? "").trim();
  const estimate = String(body.estimate ?? "").trim();
  const months = String(body.months ?? "").trim();
  const disputed = String(body.disputed ?? "").trim();

  if (!claimId) {
    return NextResponse.json({ error: "claimId is required." }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const gate = await checkUsageGate(supabase, user.id, ip);
  if (!gate.allowed) {
    return NextResponse.json({ error: gate.reason }, { status: 429 });
  }

  const [ctx, lib] = await Promise.all([
    buildClaimContext(supabase, claimId),
    buildLibraryContext(supabase, user.id),
  ]);

  const prompt = decidePrompt(offer, estimate, months, disputed, ctx, lib);

  let result;
  try {
    result = await callClaude(prompt);
  } catch {
    return NextResponse.json(
      { error: "The analysis service hit an error — your binder is untouched. Try again." },
      { status: 502 },
    );
  }

  await logAiRun(supabase, {
    userId: user.id,
    claimId,
    tool: "decide",
    promptVersion: PROMPT_VERSION,
    output: result.text,
    tokensIn: result.usage.input_tokens,
    tokensOut: result.usage.output_tokens,
  });

  return NextResponse.json({ output: result.text });
}
