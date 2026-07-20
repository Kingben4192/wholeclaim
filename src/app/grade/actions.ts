"use server";

import { createClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured, getAdminClient } from "@/lib/supabase/admin";
import { isResendConfigured, getResendClient } from "@/lib/resend";
import { scoreGrader, type GraderAnswers } from "@/lib/grader/rubric";

export type SubmitGradeInput = {
  answers: GraderAnswers;
  name: string;
  email: string;
  usState: string;
  consent: boolean;
};

export type SubmitGradeResult =
  | { ok: true; grade: string; score: number; scores: Record<string, number>; line: string; emailed: boolean }
  | { ok: false; error: string };

export async function submitGrade(input: SubmitGradeInput): Promise<SubmitGradeResult> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const usState = input.usState.trim();

  if (!name) return { ok: false, error: "Enter your first name." };
  if (!email.includes("@")) return { ok: false, error: "Enter a valid email." };
  // Product Bible, Claim Grade: "Never emails without consent."
  if (!input.consent) return { ok: false, error: "Consent is required to send your results." };

  const { scores, total, band } = scoreGrader(input.answers);

  const supabase = await createClient();
  // No .select() here: anon has an INSERT policy on `leads` but deliberately
  // no SELECT policy (leads are owner-by-email or admin readable only), and
  // .insert().select() requires RETURNING to pass RLS too — chaining it
  // turns a valid insert into a false RLS failure. We don't need the row
  // back anyway; nothing below uses the generated id.
  const { error: insertError } = await supabase.from("leads").insert({
    name,
    email,
    us_state: usState || null,
    grade: band.g,
    score: total,
    answers: input.answers,
    // Previously computed and required above, then discarded — never
    // persisted. Consent is meaningless as a control if it isn't stored;
    // this is the actual fix (2026-07-19).
    consent: input.consent,
  });

  if (insertError) {
    return { ok: false, error: insertError.message };
  }

  let emailed = false;
  if (isResendConfigured() && isServiceRoleConfigured()) {
    try {
      emailed = await sendResultsEmail({ name, email, grade: band.g, score: total, line: band.line, scores });
    } catch (err) {
      console.error("Grader results email failed:", err);
    }
  }

  return { ok: true, grade: band.g, score: total, scores, line: band.line, emailed };
}

async function sendResultsEmail(args: {
  name: string;
  email: string;
  grade: string;
  score: number;
  line: string;
  scores: Record<string, number>;
}): Promise<boolean> {
  const admin = getAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: args.email,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/claim/from-grade`,
    },
  });
  if (error || !data?.properties?.action_link) {
    console.error("Magic link generation failed:", error);
    return false;
  }

  const resend = getResendClient();
  const breakdown = Object.entries(args.scores)
    .map(([cat, pts]) => `${cat}: ${pts}/20`)
    .join(" · ");

  // No domain is confirmed yet — Decision Log #17 (name clearance) is still
  // Open. RESEND_FROM_EMAIL must be a domain verified in Resend before this
  // can actually send; falls back to Resend's shared test sender otherwise.
  const from = process.env.RESEND_FROM_EMAIL || "WholeClaim <onboarding@resend.dev>";

  await resend.emails.send({
    from,
    to: args.email,
    subject: `Your Claim Grade: ${args.grade}`,
    text: `${args.name}, your claim grade is ${args.grade} (${args.score}/100).

${args.line}

${breakdown}

Create your claim file — pre-filled from what you already told us: ${data.properties.action_link}

WholeClaim is a self-help documentation tool, not legal or insurance advice.`,
  });

  return true;
}
