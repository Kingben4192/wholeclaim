"use client";

import { useEffect, useState } from "react";

// Fragment-wrapped confirmation interstitial — defends the magic-link email
// against automated link scanners (Gmail's link/image proxy, Office 365
// Safe Links, corporate mail gateways) consuming the single-use token
// before the real user clicks. Confirmed live via Supabase Auth Logs
// (2026-07-21): Google-owned IPs were hitting Supabase's /verify endpoint
// directly and burning the token before or instead of the real click.
//
// How this defeats it: the real confirmation URL is never in the emailed
// link's query string — it's embedded in a URL FRAGMENT
// (/auth/confirm#link=...). Fragments are never transmitted in an HTTP
// request, to any server or any prefetcher — only client-side JavaScript
// running in a real browser can read window.location.hash. This page does
// exactly that, but does NOT auto-navigate: the extracted link only
// becomes reachable as a real <a href>, which requires an actual click
// (browser-simulated clicks from a rendering/screenshot scanner would be
// the one residual gap — not addressed here, flagged as a known limit).
//
// Requires a matching change to the Supabase Auth email template (Magic
// Link) to point here instead of directly at {{ .ConfirmationURL }} — not
// yet applied; this page does nothing until that template change ships.
// /auth/callback itself is unchanged — once the user clicks through, the
// flow proceeds exactly as it does today.
export default function AuthConfirmPage() {
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const raw = params.get("link");

    if (!raw) {
      setError("This sign-in link is missing its confirmation details. Request a new one from the login page.");
      return;
    }

    try {
      const decoded = decodeURIComponent(raw);
      // Only ever navigate to Supabase's own auth verification host — a
      // malformed or tampered fragment should fail closed, not open an
      // arbitrary redirect.
      const parsed = new URL(decoded);
      if (!parsed.hostname.endsWith(".supabase.co")) {
        setError("This sign-in link couldn't be verified. Request a new one from the login page.");
        return;
      }
      setLink(decoded);
    } catch {
      setError("This sign-in link couldn't be read. Request a new one from the login page.");
    }
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <h1 className="font-display text-xl font-extrabold mb-3">Confirm sign-in</h1>
        {error ? (
          <>
            <p className="text-sm text-red-700 mb-6">{error}</p>
            <a href="/login" className="text-sm font-semibold text-ledger underline">
              Back to sign in
            </a>
          </>
        ) : link ? (
          <>
            <p className="text-sm text-ink/60 mb-6">
              For your security, this sign-in link needs one more click to
              finish — this keeps it safe from automated email scanners.
            </p>
            <a href={link} className="inline-block bg-ledger text-paper px-6 py-3 rounded-sm font-semibold text-sm">
              Continue signing in
            </a>
          </>
        ) : (
          <p className="text-sm text-ink/50">Loading…</p>
        )}
      </div>
    </main>
  );
}
