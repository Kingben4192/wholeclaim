import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// Security headers (Tier 1 hardening, 2026-07-24). Deliberately the
// no-nonce CSP shape from Next.js's own docs, not the nonce/'strict-dynamic'
// variant: nonces require every page to opt into dynamic rendering (no
// static generation, no ISR, no CDN caching -- a real cost/performance
// tradeoff for this app's mostly-static marketing pages), which wasn't
// approved as part of this change. 'unsafe-inline' is required for both
// script-src (Next's own inline hydration/RSC bootstrap scripts, which
// have no static-compatible alternative without nonces) and style-src
// (a few components use style={{...}}, e.g. GraderQuiz.tsx). This is a
// real, accepted tradeoff versus the stricter nonce-based CSP -- flagged
// in the security review report, not hidden.
//
// connect-src/img-src hosts are derived from env vars rather than
// hardcoded, so this doesn't silently drift if the Supabase project or
// Sentry DSN ever changes:
//   - Supabase origin: the browser client (auth/callback/page.tsx) talks
//     to it directly; also covers Storage.
//   - Sentry ingest origin: parsed straight from the DSN -- for a URL like
//     https://KEY@oXXXX.ingest.us.sentry.io/YYYY, `new URL(dsn).hostname`
//     correctly returns the ingest host because the part before `@` is
//     parsed as userinfo, not host.
//   - `data:` in connect-src: PendingPhotoUploader.tsx does
//     `fetch(dataUrl).then(r => r.blob())` to convert a captured photo.
// Stripe needs no script-src/connect-src entry at all: checkout is a pure
// `window.location.href` redirect to Stripe's hosted Checkout page
// (UpgradeOptions.tsx, ManageSubscriptionButton.tsx) -- no Stripe JS is
// ever loaded on this app's own origin, and CSP does not restrict
// top-level navigation. Anthropic is never called from the browser at all
// (server-only, per the 2026-07-24 security review's AI-data-handling
// finding), so it needs no CSP entry either.
function buildCsp() {
  const isDev = process.env.NODE_ENV === "development";

  const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
    : "";
  const sentryOrigin = process.env.NEXT_PUBLIC_SENTRY_DSN
    ? `https://${new URL(process.env.NEXT_PUBLIC_SENTRY_DSN).hostname}`
    : "";
  const connectSrc = ["'self'", "data:", supabaseOrigin, sentryOrigin]
    .filter(Boolean)
    .join(" ");

  return [
    `default-src 'self'`,
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' blob: data:`,
    `font-src 'self'`,
    `connect-src ${connectSrc}`,
    `worker-src 'self'`,
    `manifest-src 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join("; ");
}

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: buildCsp() },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

// Decision #42 (2026-07-23). org/project/authToken deliberately omitted --
// no SENTRY_AUTH_TOKEN exists yet (that's a separate credential from the
// DSN, only needed for source-map upload). All three are optional per the
// SDK's own SentryBuildOptions type; without them the build still succeeds,
// it just skips uploading source maps -- errors still report correctly,
// stack traces are just minified until a token is added later.
export default withSentryConfig(nextConfig, {
  silent: true,
});
