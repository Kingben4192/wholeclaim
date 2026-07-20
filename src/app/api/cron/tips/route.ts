import { NextResponse, type NextRequest } from "next/server";
import { isServiceRoleConfigured, getAdminClient } from "@/lib/supabase/admin";
import { isResendConfigured, getResendClient } from "@/lib/resend";
import { TIP_TEMPLATES, TIP_STAGE_DELAY_DAYS, type TipStage } from "@/lib/tips/copy";

// Triggered daily by Vercel Cron (see vercel.json) to advance the approved
// Day 1 / Day 4 / Day 8 / Day 12 documentation-tips sequence for leads who
// opted in at grading and haven't unsubscribed. Two independent gates, same
// shape as the deadline-check cron:
//   1. CRON_SECRET bearer auth.
//   2. TIPS_SENDING_ENABLED must be exactly "true" for a *real* send to
//      happen. Unset (the production default until explicitly flipped)
//      runs the identical eligibility query and reports what WOULD send,
//      without calling Resend, without calling the Auth admin API for a
//      magic link, and without writing to `leads` — safe to deploy and
//      schedule before real sending is approved.
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

  const live = process.env.TIPS_SENDING_ENABLED === "true";
  const admin = getAdminClient();
  const now = new Date();

  const results: { leadId: string; stage: TipStage; status: string }[] = [];

  for (const stage of [0, 1, 2, 3] as const satisfies readonly TipStage[]) {
    const delayDays = TIP_STAGE_DELAY_DAYS[stage];
    const cutoff = new Date(now.getTime() - delayDays * 24 * 60 * 60 * 1000).toISOString();
    // Stage 0 anchors off when the lead was created (graded); stages 1-3
    // anchor off when the previous tip actually went out.
    const anchorColumn = stage === 0 ? "created_at" : "last_tip_sent_at";

    const { data: eligible, error } = await admin
      .from("leads")
      .select("id, name, email, unsubscribe_token")
      .eq("consent", true)
      .eq("unsubscribed", false)
      .eq("tips_stage", stage)
      .lte(anchorColumn, cutoff);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    for (const lead of eligible ?? []) {
      if (!live) {
        results.push({ leadId: lead.id, stage, status: "dry-run: would send" });
        continue;
      }

      const template = TIP_TEMPLATES[stage];
      const unsubscribeLink = `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?token=${lead.unsubscribe_token}`;

      let claimFileLink = `${process.env.NEXT_PUBLIC_APP_URL}/login`;
      const { data: linkData } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email: lead.email,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/claim/from-grade`,
        },
      });
      if (linkData?.properties?.action_link) claimFileLink = linkData.properties.action_link;

      const from = process.env.RESEND_FROM_EMAIL || "WholeClaim <onboarding@resend.dev>";
      try {
        await getResendClient().emails.send({
          from,
          to: lead.email,
          subject: template.subject,
          text: template.body({ name: lead.name, claimFileLink, unsubscribeLink }),
        });
      } catch (err) {
        results.push({
          leadId: lead.id,
          stage,
          status: `send failed: ${err instanceof Error ? err.message : String(err)}`,
        });
        continue;
      }

      // Atomic conditional update — guards against double-advancing the
      // same lead if two cron runs ever overlap.
      const { error: updateError } = await admin
        .from("leads")
        .update({ tips_stage: stage + 1, last_tip_sent_at: now.toISOString() })
        .eq("id", lead.id)
        .eq("tips_stage", stage);

      results.push({
        leadId: lead.id,
        stage,
        status: updateError ? `sent but stage update failed: ${updateError.message}` : "sent",
      });
    }
  }

  return NextResponse.json({
    mode: live ? "live" : "dry-run",
    processed: results.length,
    results,
  });
}
