import * as Sentry from "@sentry/nextjs";

// Decision #42 (2026-07-23). Edge runtime (src/middleware.ts runs here).
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
});
