import { NextResponse, type NextRequest } from "next/server";
import { Webhook } from "standardwebhooks";
import * as Sentry from "@sentry/nextjs";
import { getResendClient, isResendConfigured } from "@/lib/resend";
import { sendWithRetry, classifyResendFailure } from "@/lib/resendRetry";

// Supabase Auth "Send Email" Hook (Decision #41, 2026-07-23) — replaces
// Supabase's built-in SMTP-based email sending entirely for auth emails.
// Root cause of the outage this bypasses was never actually nailed down:
// Resend's own SMTP relay + verified sender domain (mail.getwholeclaim.com)
// were directly confirmed working from an independent path, which ruled
// out Resend as the problem and left something specific to Supabase's own
// SMTP execution as the remaining suspect — this hook sidesteps that
// entirely by sending through the same Resend HTTP API this app already
// uses successfully for the Claim Grade results email, under our own
// control end to end.
//
// Payload/verification shape confirmed against Supabase's own docs+source
// (not guessed): https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook
// and the official Resend example. Signature verification uses the
// `standardwebhooks` library, matching Supabase's own reference
// implementation exactly.

type SendEmailHookPayload = {
  // id confirmed present in Supabase's actual documented payload
  // (supabase.com/docs/guides/auth/auth-hooks/send-email-hook), not
  // previously declared here since this file only used email before.
  user: { id: string; email: string };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
  };
};

// Retry/timeout fix for the Resend send below (2026-08-02 bug
// investigation) -- see src/lib/resendRetry.ts for the full reasoning
// and implementation. Extracted there rather than kept inline, matching
// this codebase's own convention (uploadValidation.ts, storageStatus.ts,
// betaMetrics.ts): pure logic lives in src/lib/, not inside a route
// handler, so it's directly unit-testable.

export async function POST(request: NextRequest) {
  const hookSecretRaw = process.env.SEND_EMAIL_HOOK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!hookSecretRaw || !supabaseUrl || !appUrl || !isResendConfigured()) {
    // 2026-07-30 -- diagnostic instrumentation for the ongoing intermittent
    // magic-link send-failure investigation. Vercel's own log tooling (CLI
    // history, CLI --follow) returned nothing for this route even against a
    // guaranteed-good control request, so Sentry is the only channel proven
    // reachable from outside this runtime. Booleans only -- never log the
    // actual secret values.
    Sentry.captureMessage("send-email-hook: missing required config", {
      level: "error",
      extra: {
        hasHookSecret: Boolean(hookSecretRaw),
        hasSupabaseUrl: Boolean(supabaseUrl),
        hasAppUrl: Boolean(appUrl),
        isResendConfigured: isResendConfigured(),
      },
    });
    await Sentry.flush(2000);
    return NextResponse.json(
      { error: { http_code: 500, message: "Send email hook isn't fully configured." } },
      { status: 500 },
    );
  }

  const payload = await request.text();
  const headers = Object.fromEntries(request.headers);

  // Supabase's dashboard generates the secret as "v1,whsec_<base64>" — the
  // standardwebhooks library wants the bare secret, not the "v1,whsec_"
  // prefix, matching the official example exactly.
  const hookSecret = hookSecretRaw.replace("v1,whsec_", "");
  const wh = new Webhook(hookSecret);

  let verified: SendEmailHookPayload;
  try {
    verified = wh.verify(payload, headers) as SendEmailHookPayload;
  } catch (err) {
    // Distinguishes a genuine signature/secret mismatch from a timestamp
    // tolerance issue or missing headers -- wh.verify()'s own thrown
    // WebhookVerificationError carries which of those it was in .message,
    // previously discarded by the bare `catch {}` this replaced.
    Sentry.captureException(err, {
      extra: { stage: "signature_verification" },
    });
    await Sentry.flush(2000);
    return NextResponse.json(
      { error: { http_code: 401, message: "Invalid webhook signature." } },
      { status: 401 },
    );
  }

  const { user, email_data } = verified;
  const { token, token_hash, email_action_type, redirect_to } = email_data;

  // Same format Supabase's own generateLink() produces (confirmed
  // directly from the installed @supabase/auth-js SDK's own type comment
  // earlier this session, not guessed): auth/v1/verify?type=...&token=...
  // &redirect_to=...
  const confirmationUrl =
    `${supabaseUrl}/auth/v1/verify?type=${encodeURIComponent(email_action_type)}` +
    `&token=${encodeURIComponent(token_hash)}&redirect_to=${encodeURIComponent(redirect_to)}`;

  // Same fragment-wrapped scanner defense as the rest of this app's auth
  // flow (src/app/auth/confirm/page.tsx) — the real verify URL never
  // appears in a query string an automated scanner could prefetch.
  const wrappedLink = `${appUrl}/auth/confirm#link=${encodeURIComponent(confirmationUrl)}`;

  const html = `
    <h2>Sign in to WholeClaim</h2>
    <p>Click the button below to sign in instantly:</p>
    <p>
      <a href="${wrappedLink}"
         style="display:inline-block;background-color:#1E4B3C;color:#ffffff;padding:12px 24px;border-radius:4px;text-decoration:none;font-weight:600;">
        Sign in to WholeClaim
      </a>
    </p>
    <p style="color:#666666;font-size:14px;margin-top:24px;">
      Having trouble with the link? Enter this code instead:
    </p>
    <p style="font-family:monospace;font-size:24px;font-weight:700;letter-spacing:4px;">
      ${token}
    </p>
    <p style="color:#999999;font-size:12px;">
      If you didn't request this email, you can safely ignore it.
    </p>
  `;

  const from = process.env.RESEND_FROM_EMAIL || "WholeClaim <onboarding@resend.dev>";

  try {
    const resend = getResendClient();
    await sendWithRetry(resend, {
      from,
      to: user.email,
      subject: "Sign in to WholeClaim",
      html,
    });
  } catch (err) {
    // Resend's own error objects aren't `instanceof Error` -- logging the
    // raw value server-side (visible in Vercel function logs) instead of
    // relying on a generic message, since a prior version of this catch
    // silently swallowed the real reason behind a static fallback string.
    console.error("send-email-hook: Resend send failed:", err);
    // Correlate by user ID, not email (security/PII audit, 2026-08-01) --
    // an internal identifier is enough to trace a failure back to an
    // account without sending the person's actual email address to a
    // third-party error-monitoring service.
    Sentry.captureException(err, {
      extra: { stage: "resend_send", recipientUserId: user.id },
    });
    await Sentry.flush(2000);

    // Error mapping (2026-08-02 follow-up): distinguishes a permanent
    // send failure (bad recipient address) from a transient one, using
    // the same classification the retry logic itself relies on. Whether
    // Supabase's OTP endpoint actually relays http_code/message through
    // to the client, as opposed to generically wrapping every non-2xx
    // hook response the same way, is unconfirmed -- every failure
    // reproduced earlier this session surfaced identically on the client
    // regardless of the underlying cause, which suggests it might not.
    // login/actions.ts's own client-side handling is written to degrade
    // safely to the transient framing either way, so this doesn't depend
    // on Supabase's relay behavior to still be correct.
    const { kind } = classifyResendFailure(err);
    const message =
      err && typeof err === "object" && "message" in err
        ? String((err as { message: unknown }).message)
        : "Could not send the email.";
    return NextResponse.json(
      { error: { http_code: kind === "invalid_address" ? 422 : 502, message } },
      { status: kind === "invalid_address" ? 422 : 502 },
    );
  }

  // Success-path logging (2026-08-02 follow-up): records which from
  // address was actually used, so a real send can be checked against
  // RESEND_FROM_EMAIL actually being set in production rather than
  // silently falling back to the onboarding@resend.dev default. Sentry
  // is the one channel already confirmed reachable this session (the
  // founder found event 6c010966 directly), unlike Vercel's own log
  // tooling or the Resend dashboard's send history via this API key.
  Sentry.captureMessage("send-email-hook: sent", {
    level: "info",
    extra: { from, recipientUserId: user.id },
  });
  await Sentry.flush(2000);

  return NextResponse.json({});
}
