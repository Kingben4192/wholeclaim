import * as Sentry from "@sentry/nextjs";

// Decision #42 (2026-07-23). Server-side runtime (Vercel functions, server
// actions, route handlers). Same DSN as the client config -- one Sentry
// project covers both, consistent with how this app's other cross-runtime
// config (e.g. NEXT_PUBLIC_APP_URL) already works.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
});
