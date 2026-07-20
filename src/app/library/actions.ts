"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured, getAdminClient } from "@/lib/supabase/admin";
import { isAnthropicConfigured, callClaude } from "@/lib/anthropic/client";
import { checkUsageGate, logAiRun } from "@/lib/anthropic/rateLimit";
import { ingestPrompt, PROMPT_VERSION } from "@/lib/anthropic/prompts";

// No role system exists in this app yet (profiles has no role column) — the
// approve action promotes a draft to a globally-curated entry, which
// requires bypassing RLS (owner_id: null can't be set by a normal
// authenticated write, by design — see 0002_ai.sql). Rather than let
// ordinary claim-page auth reach that, this is a real, if minimal, gate:
// one allow-listed email, checked before any service-role write.
function isAdmin(email: string | null | undefined): boolean {
  const allowed = process.env.ADMIN_EMAIL?.toLowerCase();
  return Boolean(allowed && email && email.toLowerCase() === allowed);
}

export async function ingestDraft(formData: FormData) {
  const raw = String(formData.get("raw") ?? "").trim();
  if (!raw) throw new Error("Paste something to structure first.");

  if (!isAnthropicConfigured()) {
    throw new Error("AI isn't configured yet.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in required.");

  // Same cost-attack protection as every other AI route — this makes a
  // real Anthropic call too.
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const gate = await checkUsageGate(supabase, user.id, null, ip);
  if (!gate.allowed) throw new Error(gate.reason);

  const prompt = ingestPrompt(raw);
  const result = await callClaude(prompt);

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
    throw new Error(
      "Could not parse draft entries from the model's response. Nothing was added.",
    );
  }
  if (!Array.isArray(drafts)) {
    throw new Error("Unexpected response shape from the model. Nothing was added.");
  }

  const rows = drafts.map((d) => ({
    owner_id: user.id,
    type: d.type,
    jurisdiction: d.jurisdiction,
    cite: d.cite,
    summary: d.summary,
    confidence: d.confidence,
    verify_note: d.verify_note,
    status: "pending" as const,
    active: false,
  }));

  const { error } = await supabase.from("library_entries").insert(rows);
  if (error) throw new Error(error.message);

  revalidatePath("/library");
}

export async function approveEntry(entryId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) {
    throw new Error("Not authorized to approve library entries.");
  }
  if (!isServiceRoleConfigured()) {
    throw new Error("This service isn't configured yet.");
  }

  const admin = getAdminClient();
  const { error } = await admin
    .from("library_entries")
    .update({ owner_id: null, status: "approved", active: true })
    .eq("id", entryId);
  if (error) throw new Error(error.message);

  revalidatePath("/library");
}

export async function rejectEntry(entryId: string) {
  // Own-row only, enforced by RLS (library_entries: owner update) — no
  // admin gate needed, a user can only ever affect their own draft.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in required.");

  const { error } = await supabase
    .from("library_entries")
    .update({ status: "rejected" })
    .eq("id", entryId)
    .eq("owner_id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/library");
}
