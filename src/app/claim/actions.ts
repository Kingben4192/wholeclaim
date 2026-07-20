"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isPro } from "@/lib/entitlements";
import { checkUploadAccess } from "@/lib/uploadGate";
import { FREE_UPLOAD_LIMIT_PER_CLAIM } from "@/lib/uploadLimits";
import {
  isGuaranteeChecklistKey,
  setGuaranteeChecklistItem,
  finalizeGuaranteeIfComplete,
} from "@/lib/guarantee";

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

const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15MB — plenty for phone photos and scanned PDFs.

function kindForFile(file: File): "photo" | "pdf" | "doc" {
  if (file.type === "application/pdf") return "pdf";
  if (file.type.startsWith("image/")) return "photo";
  return "doc";
}

const KIND_LABEL: Record<ReturnType<typeof kindForFile>, string> = {
  photo: "Photo",
  pdf: "PDF",
  doc: "Document",
};

export async function uploadFile(
  claimId: string,
  evidenceItemId: string | null,
  formData: FormData,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Step 6, item 2: confirm claim ownership before anything else. RLS
  // (auth.uid() = user_id on `claims`) already makes a mismatched claimId
  // return no row via this authenticated client — this makes the rejection
  // explicit rather than incidental, same reasoning as the Step 4 checkout
  // ownership check.
  const { data: claim, error: claimError } = await supabase
    .from("claims")
    .select("id")
    .eq("id", claimId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (claimError) throw new Error("Could not verify this claim. Try again.");
  if (!claim) throw new Error("You don't have access to this claim.");

  // Step 6: free-tier evidence upload cap. Pro (any grant) skips this
  // entirely — checkUploadAccess() never even runs the count query for a
  // Pro user, since isPro() is checked first and short-circuits. Runs
  // BEFORE the file itself is validated/uploaded/inserted anywhere, so a
  // blocked attempt touches neither Storage nor the database.
  const gate = await checkUploadAccess(supabase, user.id, claimId);
  if (!gate.allowed) {
    throw new Error(
      `Free plan includes ${FREE_UPLOAD_LIMIT_PER_CLAIM} uploads per claim. Upgrade to Pro for unlimited uploads.`,
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Choose a photo or PDF to upload.");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("That file is larger than 15MB.");
  }

  const kind = kindForFile(file);
  const storagePath = `${user.id}/${claimId}/${crypto.randomUUID()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("evidence")
    .upload(storagePath, file, {
      contentType: file.type || undefined,
    });
  if (uploadError) throw new Error(uploadError.message);

  const { data: fileRow, error: insertError } = await supabase
    .from("files")
    .insert({
      claim_id: claimId,
      user_id: user.id,
      storage_path: storagePath,
      kind,
      original_name: file.name,
    })
    .select("id")
    .single();
  if (insertError || !fileRow) {
    await supabase.storage.from("evidence").remove([storagePath]);
    throw new Error(insertError?.message ?? "Could not save the upload.");
  }

  if (evidenceItemId) {
    const { error: linkError } = await supabase
      .from("evidence_items")
      .update({ file_id: fileRow.id, checked: true })
      .eq("id", evidenceItemId)
      .eq("claim_id", claimId);
    if (linkError) throw new Error(linkError.message);
  } else {
    // General Vault upload (CameraCapture, PendingPhotoUploader) — not tied
    // to an existing checklist row. Previously this left the file
    // completely unlinked from evidence_items, so it never moved the
    // Evidence score: scoreEvidence() (src/lib/claimHealth.ts) only reads
    // evidence_items, never `files` directly. Create a real checklist row
    // instead, labeled from what was actually uploaded — never an invented
    // description (Product Bible: "Never auto-generates entries the user
    // didn't make").
    const { error: createError } = await supabase.from("evidence_items").insert({
      claim_id: claimId,
      user_id: user.id,
      label: `${KIND_LABEL[kind]} — ${file.name}`,
      checked: true,
      file_id: fileRow.id,
    });
    if (createError) throw new Error(createError.message);
  }

  revalidatePath(`/claim/${claimId}`);
}

// Loss-of-Use Tracker (Roadmap Phase 1, Pro). Billing Build Order Step 5:
// rewritten to use isPro(claimId, userId) instead of a flat profiles.plan
// check — a lifetime entitlement on THIS claim now correctly unlocks the
// tracker for THIS claim, which the old plan-only check couldn't express
// at all (plan is account-wide, a lifetime unlock isn't). No free
// allowance (approved pricing model) — isPro only, same as Mold/Supplement.
// RLS only enforces ownership (auth.uid() = user_id), not entitlement,
// matching how every other table in this schema works — the entitlement
// check happens here, in the application layer, same boundary
// checkAiAccess/requireProAiAccess use for the AI tools. This remains the
// standard pattern every gate in the app follows.
async function requireProAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  claimId: string,
  userId: string,
) {
  const pro = await isPro(supabase, claimId, userId);
  if (!pro) {
    throw new Error("Loss-of-Use Tracker is a Pro feature. Upgrade to log expenses.");
  }
}

export async function addLossOfUseExpense(claimId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await requireProAccess(supabase, claimId, user.id);

  const date = String(formData.get("date") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;

  const amount = parseFloat(amountRaw);
  if (!date || !category || !amountRaw || Number.isNaN(amount) || amount < 0) {
    throw new Error("Expense needs a date, category, and a valid amount.");
  }

  const { error } = await supabase.from("loss_of_use_expenses").insert({
    claim_id: claimId,
    user_id: user.id,
    date,
    category,
    amount,
    description,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/claim/${claimId}`);
}

export async function deleteLossOfUseExpense(claimId: string, expenseId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("loss_of_use_expenses")
    .delete()
    .eq("id", expenseId)
    .eq("claim_id", claimId);
  if (error) throw new Error(error.message);

  revalidatePath(`/claim/${claimId}`);
}

// Success Guarantee checklist (Decision #36, Billing Build Order Step 7 —
// eligibility foundation only, no refund trigger). Thin wrapper: auth,
// ownership, then the real logic in src/lib/guarantee.ts.
export async function toggleGuaranteeItem(claimId: string, itemKey: string, value: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: claim } = await supabase
    .from("claims")
    .select("id")
    .eq("id", claimId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!claim) throw new Error("You don't have access to this claim.");

  if (!isGuaranteeChecklistKey(itemKey)) throw new Error("Unknown checklist item.");

  await setGuaranteeChecklistItem(claimId, user.id, itemKey, value);
  await finalizeGuaranteeIfComplete(supabase, claimId, user.id);

  revalidatePath(`/claim/${claimId}`);
}

export async function deleteFile(
  claimId: string,
  fileId: string,
  storagePath: string,
) {
  const supabase = await createClient();

  const { error: storageError } = await supabase.storage
    .from("evidence")
    .remove([storagePath]);
  if (storageError) throw new Error(storageError.message);

  const { error } = await supabase.from("files").delete().eq("id", fileId);
  if (error) throw new Error(error.message);

  revalidatePath(`/claim/${claimId}`);
}
