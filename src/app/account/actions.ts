"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { isClaimCategory } from "@/lib/claimCategories";
import { isAcquisitionSource } from "@/lib/acquisitionSource";

// Welcome Flow (Onboarding Step 3) — dismissal only writes a UI-state
// timestamp (profiles.onboarding_seen_at, migration 0015). Never touches
// claim data, evidence, or anything the scoring engine reads.
export async function dismissWelcome(destination: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("profiles")
    .update({ onboarding_seen_at: new Date().toISOString() })
    .eq("id", user.id);

  redirect(destination);
}

// Signup Category + Acquisition Source Tracking (Decision #45) — required
// dispute-category question plus passive acquisition capture. Deliberately
// does not touch onboarding_seen_at: that field's meaning stays scoped to
// WelcomeFlow dismissal only, so this gate and WelcomeFlow's gate stay
// independent and compose correctly (a direct signup answers this, then
// still sees WelcomeFlow right after; a grader-converted user answers this
// and goes straight to their normal dashboard since they already have a
// claim).
export async function saveSignupIntent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const signupCategory = formData.get("signup_category");
  if (!isClaimCategory(signupCategory)) {
    throw new Error("Select a valid category.");
  }

  const referralSourceRaw = formData.get("referral_source");
  const referralSource = isAcquisitionSource(referralSourceRaw) ? referralSourceRaw : null;

  const update: Record<string, string | null> = { signup_category: signupCategory };

  const cookieStore = await cookies();
  const attributionCookie = cookieStore.get("wc_attribution")?.value;
  if (attributionCookie) {
    try {
      const parsed = JSON.parse(attributionCookie) as {
        campaign?: string | null;
        landingPath?: string | null;
      };
      update.referral_source = referralSource;
      update.acquisition_campaign = parsed.campaign ?? null;
      update.landing_path = parsed.landingPath ?? null;
    } catch {
      update.referral_source = referralSource;
    }
  } else if (referralSource) {
    update.referral_source = referralSource;
  }

  await supabase.from("profiles").update(update).eq("id", user.id);

  redirect("/account");
}

export type AccountDeletionSummary = {
  claims: number;
  files: number;
  entries: number;
  deadlines: number;
};

// Pre-delete dialog (2026-07-26) -- names exactly what will be lost before
// the irreversible action, rather than a generic warning. RLS-scoped counts
// only (the normal session client, not admin) -- this is the user's own
// data, same access they already have everywhere else in the app.
export async function getAccountDeletionSummary(): Promise<AccountDeletionSummary> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ count: claims }, { count: files }, { count: entries }, { count: deadlines }] = await Promise.all([
    supabase.from("claims").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("files").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("entries").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("deadlines").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  return {
    claims: claims ?? 0,
    files: files ?? 0,
    entries: entries ?? 0,
    deadlines: deadlines ?? 0,
  };
}
