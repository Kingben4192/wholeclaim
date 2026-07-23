import * as Sentry from "@sentry/nextjs";

// Next.js's own instrumentation hook (stable since Next 15) -- registers
// the right Sentry config for whichever runtime this build is executing
// in. Required by @sentry/nextjs; without it the server/edge configs above
// are never actually loaded.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
