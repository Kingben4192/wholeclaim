import type { SupabaseClient } from "@supabase/supabase-js";

export async function buildClaimContext(
  supabase: SupabaseClient,
  claimId: string,
) {
  const [{ data: claim }, { count }] = await Promise.all([
    supabase.from("claims").select("*").eq("id", claimId).single(),
    supabase
      .from("entries")
      .select("id", { count: "exact", head: true })
      .eq("claim_id", claimId),
  ]);

  if (!claim) return "CLAIM CONTEXT\n(No claim found.)";

  return `CLAIM CONTEXT\nCarrier: ${claim.carrier || "—"}\nClaim number: ${claim.claim_number || "—"}\nPolicy number: ${claim.policy_number || "—"}\nDate of loss: ${claim.date_of_loss || "—"}\nDamage: ${claim.damage_desc || claim.damage_category || "—"} (${claim.damage_category || "—"})\nState: ${claim.us_state || "—"}\nCarrier offer or paid to date: ${claim.offer_amount ?? "—"}\nChronology entries on file: ${count ?? 0}`;
}

// Mirrors libraryContext() in the prototype: up to 12 active entries, owned by
// this user or globally curated (owner_id null).
export async function buildLibraryContext(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data } = await supabase
    .from("library_entries")
    .select("type, jurisdiction, cite, summary, verified_date")
    .eq("active", true)
    .or(`owner_id.eq.${userId},owner_id.is.null`)
    .order("verified_date", { ascending: false })
    .limit(12);

  if (!data || data.length === 0) {
    return "KNOWLEDGE LIBRARY: no approved entries yet. Rely on general knowledge and tell the user to verify specifics for their state.";
  }

  return (
    "OWNER-APPROVED KNOWLEDGE LIBRARY (verified entries; prefer these over general knowledge and reference them where they apply; still tell the user to verify final details):\n" +
    data
      .map(
        (e) =>
          `[${(e.type || "").toUpperCase()} | ${e.jurisdiction} | verified ${e.verified_date ?? "—"}] ${e.cite}: ${e.summary}`,
      )
      .join("\n")
  );
}
