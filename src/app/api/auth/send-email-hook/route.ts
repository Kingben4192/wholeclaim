import { NextResponse, type NextRequest } from "next/server";
import { Webhook } from "standardwebhooks";
import { getResendClient, isResendConfigured } from "@/lib/resend";

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
  user: { email: string };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
  };
};

export async function POST(request: NextRequest) {
  const hookSecretRaw = process.env.SEND_EMAIL_HOOK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!hookSecretRaw || !supabaseUrl || !appUrl || !isResendConfigured()) {
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
  } catch {
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

  try {
    const resend = getResendClient();
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "WholeClaim <onboarding@resend.dev>",
      to: user.email,
      subject: "Sign in to WholeClaim",
      html,
    });
    if (error) throw error;
  } catch (err) {
    // Resend's own error objects aren't `instanceof Error` -- logging the
    // raw value server-side (visible in Vercel function logs) instead of
    // relying on a generic message, since a prior version of this catch
    // silently swallowed the real reason behind a static fallback string.
    console.error("send-email-hook: Resend send failed:", err);
    const message =
      err && typeof err === "object" && "message" in err
        ? String((err as { message: unknown }).message)
        : "Could not send the email.";
    return NextResponse.json(
      { error: { http_code: 500, message } },
      { status: 500 },
    );
  }

  return NextResponse.json({});
}
