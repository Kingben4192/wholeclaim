import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isAnthropicConfigured, callClaude } from "@/lib/anthropic/client";
import { checkUsageGate, logAiRun } from "@/lib/anthropic/rateLimit";
import { ingestPrompt, PROMPT_VERSION } from "@/lib/anthropic/prompts";

// Drafts only — per Decision Log #10 (owner-approval gate on the Knowledge
// Library), nothing here is inserted into library_entries. The owner reviews
// and approves each draft through a separate action before it becomes active.
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
  const raw = String(body.raw ?? "").trim();
  if (!raw) {
    return NextResponse.json({ error: "raw material is required." }, { status: 400 });
  }

  // No claim context — Knowledge Library ingestion is admin-only (Decision
  // #10) and outside Decision #32's per-claim scope. Unchanged behavior:
  // claimId: null keeps the original global-per-user, 1-lifetime-call rule.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const gate = await checkUsageGate(supabase, user.id, null, ip);
  if (!gate.allowed) {
    return NextResponse.json({ error: gate.reason }, { status: 429 });
  }

  const prompt = ingestPrompt(raw);

  let result;
  try {
    result = await callClaude(prompt);
  } catch (err) {
    console.error("ingest route: callClaude threw:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "The analysis service hit an error — your binder is untouched. Try again." },
      { status: 502 },
    );
  }

  await logAiRun(supabase, {
    userId: user.id,
    claimId: null,
    tool: "ingest",
    promptVersion: PROMPT_VERSION,
    output: result.text,
    tokensIn: result.usage.input_tokens,
    tokensOut: result.usage.output_tokens,
  });

  let drafts: unknown;
  try {
    drafts = JSON.parse(result.text);
  } catch {
    return NextResponse.json(
      {
        error:
          "Could not parse draft entries from the model's response. Nothing was added to your library.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ drafts });
}
