"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function sendMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "Enter an email address." };
  }

  if (!isSupabaseConfigured()) {
    return {
      error: "Supabase isn't configured yet — add the env vars to .env.local first.",
    };
  }

  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });

    if (error) {
      // Genuine rate limiting: Supabase's built-in mailer caps sends per
      // project. Waiting actually resolves this one.
      if (error.status === 429 || error.code === "over_email_send_rate_limit") {
        return {
          error: "Please wait a minute before requesting another link.",
        };
      }

      // Hook error mapping (2026-08-02 follow-up): the hook itself now
      // returns 422 for a permanent failure (bad recipient address) vs
      // 502 for a transient one (send-email-hook/route.ts). Whether
      // Supabase's OTP endpoint relays that distinction through to the
      // client is unconfirmed -- every failure reproduced earlier this
      // session surfaced identically regardless of cause -- though
      // Supabase's own wrapper message format ("Unexpected status code
      // returned from hook: N") suggests the hook's real http_code may
      // appear in the message text even when the outer status stays 500.
      // Checked both ways so this doesn't depend on which turns out to
      // be true, and falls through to the transient framing below if
      // neither matches -- the safer default, since it invites a retry
      // rather than telling someone their address is wrong when it
      // might not be.
      if (error.status === 422 || /\b422\b/.test(error.message ?? "")) {
        return {
          error: "Couldn't send the sign-in link — check the email address you entered.",
        };
      }

      // A transient hook failure (mailer hiccup, brief Resend outage, or
      // any other non-address-specific cause) can surface as a 5xx that
      // the SDK retries and then wraps in an AuthRetryableFetchError —
      // whose .message can itself come through as the literal string
      // "{}" (the SDK appears to JSON.stringify an underlying Error
      // somewhere, which drops the message since Error.message is
      // non-enumerable). Previously framed as "retrying won't fix this,"
      // based on a theory (a persistently broken mailer config) a real
      // production failure has since shown to be wrong at least some of
      // the time — a low, intermittent rate is far more consistent with
      // occasional transient failures, which retrying (via "Resend the
      // email," already on this page) can and does resolve.
      if (!error.message || /^[{[]/.test(error.message.trim())) {
        return {
          error:
            "Couldn't send the sign-in link — a temporary problem on our end. Use \"Resend the email\" in a moment.",
        };
      }

      console.error("sendMagicLink: signInWithOtp failed:", error.message);
      return { error: "Couldn't send the sign-in link. Please try again in a moment." };
    }
    return { sent: true };
  } catch {
    return { error: "Could not send the sign-in link. Try again." };
  }
}

// Decision #41 (reopened 2026-07-23) — 6-digit-in-spec, 8-digit in this
// project's actual Supabase config (confirmed live via admin.generateLink()'s
// email_otp field, two separate requests, both 8 digits — not a guess).
// Fallback for the same signInWithOtp() email above; no second send, no
// second user action needed to get a code, since the Magic Link email
// template embeds {{ .Token }} alongside {{ .ConfirmationURL }}.
//
// type: "email" is deliberate, not "magiclink" -- the installed
// @supabase/auth-js SDK's own doc comment marks "magiclink" as deprecated
// for verifyOtp() ("note: `signup` and `magiclink` types are deprecated").
//
// Single combined error message for any failure, not split into
// "incorrect" vs "expired": confirmed live that GoTrue returns the exact
// same { code: "otp_expired", message: "Token has expired or is invalid" }
// for a flat-out wrong code AND for a stale code superseded by a newer
// request -- there's no signal in the API response to distinguish them,
// so a genuinely different message for each would be fabricating a
// distinction the backend can't actually confirm.
export async function verifyCode(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const token = String(formData.get("token") ?? "").trim();

  if (!email || !token) {
    return { error: "Enter the code from your email." };
  }

  if (!isSupabaseConfigured()) {
    return {
      error: "Supabase isn't configured yet — add the env vars to .env.local first.",
    };
  }

  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    if (error) {
      return { error: "That code is incorrect or has expired. Check your email or request a new one." };
    }
  } catch {
    return { error: "Could not verify that code. Try again." };
  }

  redirect("/account");
}
