"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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
