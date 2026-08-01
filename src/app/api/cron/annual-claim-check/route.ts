import { NextResponse, type NextRequest } from "next/server";
import { isServiceRoleConfigured, getAdminClient } from "@/lib/supabase/admin";
import { isResendConfigured, getResendClient } from "@/lib/resend";
import { computeDocumentationScore } from "@/lib/scoring/documentationScore";
import { filesForScoring } from "@/lib/scoringFileFilter";
import { annualCheckEmail } from "@/lib/annualCheck/copy";

// Triggered daily by Vercel Cron (see vercel.json). Annual Claim Health
// Check (Claim Grade A-Action-Center, approved 2026-08-01): re-runs the
// existing Documentation Score engine against an active claim once a
// year and emails a comparison against the prior check. Same two-gate
// shape as the tips cron (CRON_SECRET + an explicit *_SENDING_ENABLED
// flag defaulting to dry-run) -- safe to deploy and schedule before real
// sending is approved.
//
// All claims, free and Pro (founder decision, 2026-08-01): Documentation
// Score is already free-tier-visible, and gating the re-grade would
// contradict that. Active claims only -- a resolved/closed claim has no
// actionable next step from a re-grade.
//
// Daily send cap (founder decision, 2026-08-01): every existing claim
// starts with last_annual_check_at null, so the very first run after this
// ships would otherwise treat the entire backlog as due at once -- real
// users would all get emailed the same day the flag is first flipped on,
// instead of naturally staggering by claim age the way future claims
// will. Applied at the query stage (not just in the `live` branch) so a
// dry-run accurately previews what a live run would actually send, not a
// larger, uncapped set. Most-overdue-first (nulls first, then oldest
// last_annual_check_at) so the initial backlog drains in a sensible
// order rather than an arbitrary one. Same protection covers a future
// scenario where the cron lapses (e.g. deployment issue) and a backlog
// re-accumulates -- it always drains a few claims a day, never a burst.
const MAX_CLAIMS_PER_RUN = 5;

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!isServiceRoleConfigured() || !isResendConfigured()) {
    return NextResponse.json(
      { error: "This service isn't configured yet." },
      { status: 503 },
    );
  }

  const live = process.env.ANNUAL_CHECK_SENDING_ENABLED === "true";
  const admin = getAdminClient();
  const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();

  const { data: dueClaims, error: dueError } = await admin
    .from("claims")
    .select("id, user_id, date_of_loss, damage_category, offer_amount, last_annual_check_score, last_annual_check_grade")
    .eq("status", "active")
    .or(`last_annual_check_at.is.null,last_annual_check_at.lte.${oneYearAgo}`)
    .order("last_annual_check_at", { ascending: true, nullsFirst: true })
    .limit(MAX_CLAIMS_PER_RUN);

  if (dueError) {
    return NextResponse.json({ error: dueError.message }, { status: 500 });
  }

  const results: { claimId: string; status: string }[] = [];

  for (const claim of dueClaims ?? []) {
    const [{ data: entries }, { data: deadlines }, { data: evidenceItems }, { data: files }, { data: promisedItems }, { data: userData }] =
      await Promise.all([
        admin.from("entries").select("type, date, created_at").eq("claim_id", claim.id),
        admin.from("deadlines").select("title, due_date, created_at").eq("claim_id", claim.id),
        admin.from("evidence_items").select("label, checked, file_id, category, created_at").eq("claim_id", claim.id),
        admin.from("files").select("id, kind, original_name, uploaded_at").eq("claim_id", claim.id),
        admin.from("promised_items").select("file_id").eq("claim_id", claim.id),
        admin.auth.admin.getUserById(claim.user_id),
      ]);

    const email = userData?.user?.email;
    if (!email) {
      results.push({ claimId: claim.id, status: "skipped: no email on account" });
      continue;
    }

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

    if (!live) {
      results.push({ claimId: claim.id, status: `dry-run: would email ${email}, new grade ${score.grade} (${score.total})` });
      continue;
    }

    const from = process.env.RESEND_FROM_EMAIL || "WholeClaim <onboarding@resend.dev>";
    try {
      await getResendClient().emails.send({
        from,
        to: email,
        subject: "Your annual Claim Health Check",
        text: annualCheckEmail({
          priorGrade: claim.last_annual_check_grade,
          priorScore: claim.last_annual_check_score,
          currentGrade: score.grade,
          currentScore: score.total,
          claimLink: `${process.env.NEXT_PUBLIC_APP_URL}/claim/${claim.id}`,
        }),
      });
    } catch (err) {
      results.push({
        claimId: claim.id,
        status: `send failed: ${err instanceof Error ? err.message : String(err)}`,
      });
      continue;
    }

    const { error: updateError } = await admin
      .from("claims")
      .update({
        last_annual_check_at: new Date().toISOString(),
        last_annual_check_score: score.total,
        last_annual_check_grade: score.grade,
      })
      .eq("id", claim.id);
    if (updateError) {
      results.push({ claimId: claim.id, status: `sent but update failed: ${updateError.message}` });
      continue;
    }

    results.push({ claimId: claim.id, status: "sent" });
  }

  return NextResponse.json({ live, checkedAt: new Date().toISOString(), results });
}
