"use server";

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

      // A broken SMTP/mailer config surfaces as a 5xx that the SDK retries
      // and then wraps in an AuthRetryableFetchError — whose .message can
      // itself come through as the literal string "{}" (the SDK appears to
      // JSON.stringify an underlying Error somewhere, which drops the
      // message since Error.message is non-enumerable). Waiting does NOT
      // fix this one, so don't tell the user to wait.
      if (!error.message || /^[{[]/.test(error.message.trim())) {
        return {
          error:
            "Couldn't send the sign-in link — the email service is having trouble. This isn't something retrying will fix; check the mailer configuration.",
        };
      }

      return { error: error.message };
    }
    return { sent: true };
  } catch {
    return { error: "Could not send the sign-in link. Try again." };
  }
}
