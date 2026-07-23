"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Handles both magic-link shapes this app actually produces (Fix: magic-link
// auth flow, 2026-07-19):
//   - Implicit-style (#access_token=...&refresh_token=...) — the ONLY shape
//     admin.auth.admin.generateLink() can produce (grade/actions.ts's
//     results email). There's no requesting browser client at generateLink
//     time to hold a PKCE code-verifier, so GoTrue has no PKCE context to
//     use — inherent to that Admin API call, not a project setting.
//   - PKCE-style (?code=...) — what /login's signInWithOtp() already
//     correctly requests by default (@supabase/ssr's createServerClient
//     defaults to flowType: "pkce", confirmed live before this fix).
// Fragments never reach a server, so this can only be resolved client-side —
// a server Route Handler here can never see #access_token, which was the
// root cause: the previous route.ts only ever checked for ?code=.
export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      const supabase = createClient();
      const url = new URL(window.location.href);
      const next = url.searchParams.get("next") || "/account";

      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const access_token = hashParams.get("access_token");
      const refresh_token = hashParams.get("refresh_token");

      if (access_token && refresh_token) {
        const { error: setSessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (setSessionError) {
          setError("This sign-in link has expired. Enter the code from your email or request a new link.");
          return;
        }
        window.location.assign(next);
        return;
      }

      const code = url.searchParams.get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError("This sign-in link has expired. Enter the code from your email or request a new link.");
          return;
        }
        window.location.assign(next);
        return;
      }

      // Supabase redirects failed verifications here with its own error
      // info in the hash fragment (e.g. #error=access_denied&error_code=
      // otp_expired&...) rather than as access_token/refresh_token or
      // ?code=. Without this check that real, specific error was silently
      // discarded and every such failure showed the generic "invalid or
      // incomplete" message below, even when Supabase told us exactly what
      // went wrong (confirmed live, 2026-07-23: a token consumed once
      // before the real user's click reproducibly redirects here with
      // error_code=otp_expired).
      const hashError = hashParams.get("error_code") || hashParams.get("error");
      if (hashError) {
        if (hashError === "otp_expired") {
          setError("This sign-in link has expired. Enter the code from your email or request a new link.");
        } else {
          setError("This sign-in link is invalid or incomplete.");
        }
        return;
      }

      setError("This sign-in link is invalid or incomplete.");
    }
    run();
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        {error ? (
          <>
            <p className="text-sm text-red-700 mb-3">{error}</p>
            <a href="/login" className="text-sm font-semibold text-ledger underline">
              Back to sign in
            </a>
          </>
        ) : (
          <p className="text-sm text-ink/60">Signing you in…</p>
        )}
      </div>
    </main>
  );
}
