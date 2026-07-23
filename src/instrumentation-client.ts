import * as Sentry from "@sentry/nextjs";

// Decision #42 (2026-07-23). DSN is not a secret -- Sentry's DSNs are
// designed to be public/client-embeddable (they can only submit events to
// this project, not read anything) -- so it's a plain NEXT_PUBLIC_ var, not
// a server-only one. If it's unset (e.g. local dev without .env.local),
// Sentry.init() with an empty dsn is a documented no-op: nothing is sent,
// nothing throws.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Free-tier conscious: default is 100% of errors captured (uncapped,
  // errors are inherently rare), but performance traces are billed
  // separately and can add up fast on a per-request basis. Kept low here
  // rather than the SDK's own more aggressive example defaults.
  tracesSampleRate: 0.1,
});

// Required by the SDK to instrument client-side route transitions -- the
// production build fails this exact instruction as an "ACTION REQUIRED"
// warning without it.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
