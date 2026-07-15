"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createClaim(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const carrier = String(formData.get("carrier") ?? "").trim() || null;
  const claim_number = String(formData.get("claim_number") ?? "").trim() || null;
  const policy_number = String(formData.get("policy_number") ?? "").trim() || null;
  const date_of_loss = String(formData.get("date_of_loss") ?? "").trim() || null;
  const damage_category = String(formData.get("damage_category") ?? "").trim() || null;
  const us_state = String(formData.get("us_state") ?? "").trim() || null;

  const { data, error } = await supabase
    .from("claims")
    .insert({
      user_id: user.id,
      carrier,
      claim_number,
      policy_number,
      date_of_loss,
      damage_category,
      us_state,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not create claim.");
  }

  redirect(`/claim/${data.id}`);
}

export async function addEntry(claimId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const type = String(formData.get("type") ?? "note");
  const contact = String(formData.get("contact") ?? "").trim() || null;
  const summary = String(formData.get("summary") ?? "").trim();
  if (!summary) throw new Error("Entry needs a summary.");

  const { error } = await supabase.from("entries").insert({
    claim_id: claimId,
    user_id: user.id,
    type,
    contact,
    summary,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/claim/${claimId}`);
}

export async function addDeadline(claimId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const title = String(formData.get("title") ?? "").trim();
  const due_date = String(formData.get("due_date") ?? "").trim();
  if (!title || !due_date) throw new Error("Deadline needs a title and date.");

  const { error } = await supabase.from("deadlines").insert({
    claim_id: claimId,
    user_id: user.id,
    title,
    due_date,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/claim/${claimId}`);
}

export async function addEvidenceItem(claimId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const label = String(formData.get("label") ?? "").trim();
  if (!label) throw new Error("Evidence item needs a label.");

  const { error } = await supabase.from("evidence_items").insert({
    claim_id: claimId,
    user_id: user.id,
    label,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/claim/${claimId}`);
}

export async function toggleEvidenceItem(
  claimId: string,
  itemId: string,
  checked: boolean,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("evidence_items")
    .update({ checked })
    .eq("id", itemId);
  if (error) throw new Error(error.message);

  revalidatePath(`/claim/${claimId}`);
}
