import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeDocumentationScore, toClientView } from "@/lib/scoring/documentationScore";
import { filesForScoring } from "@/lib/scoringFileFilter";
import { getClaimDisplayTitle } from "@/lib/claimDisplay";
import { buildClaimBinderPdf } from "@/lib/pdf/claimBinder";

// Per-claim binder PDF (Claim Grade A-Action-Center, approved 2026-08-01).
// User-session-scoped, not the service-role client -- same pattern as
// /api/account/export, relies on RLS (auth.uid() = user_id) rather than
// an explicit ownership check for every query, plus one explicit check on
// the claim itself so a mismatched id 404s instead of returning an
// ambiguous empty PDF.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const { data: claim, error: claimError } = await supabase
    .from("claims")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (claimError) {
    return NextResponse.json({ error: claimError.message }, { status: 500 });
  }
  if (!claim) {
    return NextResponse.json({ error: "Claim not found." }, { status: 404 });
  }

  const [{ data: entries }, { data: deadlines }, { data: evidenceItems }, { data: files }, { data: promisedItems }] =
    await Promise.all([
      supabase.from("entries").select("type, date, summary, created_at").eq("claim_id", id).order("date", { ascending: false }),
      supabase.from("deadlines").select("title, due_date, created_at").eq("claim_id", id).order("due_date", { ascending: true }),
      supabase.from("evidence_items").select("label, checked, file_id, category, created_at").eq("claim_id", id),
      supabase.from("files").select("id, original_name, kind, uploaded_at").eq("claim_id", id).order("uploaded_at", { ascending: false }),
      supabase.from("promised_items").select("description, promised_by, target_date, file_id").eq("claim_id", id),
    ]);

  const score = computeDocumentationScore({
    claim: {
      dateOfLoss: claim.date_of_loss ?? null,
      damageCategory: claim.damage_category ?? null,
      offerAmount: claim.offer_amount !== null && claim.offer_amount !== undefined ? Number(claim.offer_amount) : null,
    },
    entries: entries ?? [],
    deadlines: deadlines ?? [],
    evidenceItems: evidenceItems ?? [],
    files: filesForScoring(files ?? [], evidenceItems ?? [], promisedItems ?? []),
  });

  const pdfBuffer = buildClaimBinderPdf({
    claim: {
      title: getClaimDisplayTitle(claim),
      carrier: claim.carrier,
      claimNumber: claim.claim_number,
      policyNumber: claim.policy_number,
      dateOfLoss: claim.date_of_loss,
      damageCategory: claim.damage_category,
      status: claim.status ?? "active",
    },
    score: toClientView(score),
    evidenceItems: evidenceItems ?? [],
    files: files ?? [],
    entries: entries ?? [],
    deadlines: deadlines ?? [],
    promisedItems: promisedItems ?? [],
  });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${getClaimDisplayTitle(claim).replace(/[^a-z0-9]+/gi, "-")}-binder.pdf"`,
    },
  });
}
