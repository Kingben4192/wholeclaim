import { NextResponse, type NextRequest } from "next/server";
import { isServiceRoleConfigured, getAdminClient } from "@/lib/supabase/admin";
import { isWebPushConfigured, sendPush } from "@/lib/webpush";

// Triggered daily by Vercel Cron (see vercel.json) to push reminders for
// deadlines coming due soon. Runs server-to-server with no user session, so
// it needs the service-role client to read across every user's deadlines —
// same pattern as the Stripe webhook route.

const REMINDER_WINDOW_DAYS = 3;

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!isServiceRoleConfigured() || !isWebPushConfigured()) {
    return NextResponse.json(
      { error: "This service isn't configured yet." },
      { status: 503 },
    );
  }

  const supabase = getAdminClient();

  const today = new Date();
  const windowEnd = new Date(today);
  windowEnd.setDate(windowEnd.getDate() + REMINDER_WINDOW_DAYS);
  const todayStr = today.toISOString().slice(0, 10);
  const windowEndStr = windowEnd.toISOString().slice(0, 10);

  const { data: dueDeadlines, error: deadlinesError } = await supabase
    .from("deadlines")
    .select("id, claim_id, user_id, title, due_date")
    .is("reminder_sent_at", null)
    .lte("due_date", windowEndStr)
    .order("due_date", { ascending: true });

  if (deadlinesError) {
    return NextResponse.json({ error: deadlinesError.message }, { status: 500 });
  }

  let notified = 0;
  let skippedNoSubscription = 0;

  for (const deadline of dueDeadlines ?? []) {
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", deadline.user_id);

    if (!subs || subs.length === 0) {
      skippedNoSubscription++;
      continue;
    }

    const overdue = deadline.due_date < todayStr;
    const body = overdue
      ? `Overdue since ${deadline.due_date}`
      : `Due ${deadline.due_date}`;

    let deliveredAny = false;
    for (const sub of subs) {
      const result = await sendPush(sub, {
        title: `Deadline: ${deadline.title}`,
        body,
        url: `/claim/${deadline.claim_id}`,
      });
      if (result.delivered) deliveredAny = true;
      if (result.expired) {
        await supabase.from("push_subscriptions").delete().eq("id", sub.id);
      }
    }

    if (deliveredAny) {
      notified++;
      await supabase
        .from("deadlines")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", deadline.id);
    }
  }

  return NextResponse.json({
    checked: dueDeadlines?.length ?? 0,
    notified,
    skippedNoSubscription,
  });
}
