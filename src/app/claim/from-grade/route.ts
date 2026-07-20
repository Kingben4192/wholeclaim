import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { answerValue, type GraderAnswers } from "@/lib/grader/rubric";

// Grader-first onboarding (Decision #29, Brief §12.3): on first authentication
// after the magic link, map the grader's already-answered questions onto a
// new claim. Maps only what was answered — never fabricates dates, carriers,
// or claim numbers the grader never asked about.

const DAMAGE_CATEGORY_MAP: Record<string, string> = {
  water: "Water / plumbing",
  roof: "Roof / storm",
  fire: "Fire",
  // "other" is left unmapped — the grader doesn't know enough to guess.
};

export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const { data: lead } = await supabase
    .from("leads")
    .select("id, us_state, grade, answers, claim_id, claim_prefilled_at")
    .eq("email", user.email.toLowerCase())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!lead) {
    return NextResponse.redirect(`${origin}/claim`);
  }

  if (lead.claim_prefilled_at) {
    // Already converted — don't create a second claim.
    return NextResponse.redirect(
      `${origin}${lead.claim_id ? `/claim/${lead.claim_id}` : "/claim"}`,
    );
  }

  const answers = (lead.answers ?? {}) as GraderAnswers;
  const damageValue = answerValue("damage", answers);
  const damageCategory = damageValue ? DAMAGE_CATEGORY_MAP[damageValue] ?? null : null;

  const { data: claim, error: claimError } = await supabase
    .from("claims")
    .insert({
      user_id: user.id,
      us_state: lead.us_state,
      damage_category: damageCategory,
      baseline_grade: lead.grade,
    })
    .select("id")
    .single();

  if (claimError || !claim) {
    console.error("Grader claim prefill failed:", claimError);
    return NextResponse.redirect(`${origin}/claim`);
  }

  // Pre-checked evidence items — only for what the grader answer actually
  // established, at the confidence level the answer supports.
  const photosChoice = answers["photos"];
  if (photosChoice !== undefined) {
    await supabase.from("evidence_items").insert({
      claim_id: claim.id,
      user_id: user.id,
      label: "Damage photos / video",
      checked: photosChoice === 0,
    });
  }
  const logChoice = answers["log"];
  if (logChoice !== undefined) {
    await supabase.from("evidence_items").insert({
      claim_id: claim.id,
      user_id: user.id,
      label: "Written contact log (calls & emails)",
      checked: logChoice === 0,
    });
  }

  await supabase
    .from("leads")
    .update({
      claim_id: claim.id,
      claim_prefilled_at: new Date().toISOString(),
      account_created_at: new Date().toISOString(),
    })
    .eq("id", lead.id);

  // "Never heard of" the suit limitation clause: seed the deadline quick-add
  // with a title only — the user picks the real date from their own policy,
  // nothing computed or guessed gets persisted.
  const suitChoice = answers["suit"];
  const seed = suitChoice === 2 ? "?seed=suit" : "";

  return NextResponse.redirect(`${origin}/claim/${claim.id}${seed}`);
}
