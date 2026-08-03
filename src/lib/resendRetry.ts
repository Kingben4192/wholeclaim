import type { getResendClient } from "@/lib/resend";

// Retry/timeout helper for Resend sends (2026-08-02 bug investigation,
// src/app/api/auth/send-email-hook/route.ts). No log source proved
// reachable to characterize the hook's ~0.3% failure rate directly
// (Supabase auth logs, Sentry, and Resend's own event history all
// require access this environment doesn't have -- the Resend key here is
// confirmed send-only, 401 on the list endpoint). Absent that, this
// targets what the code itself demonstrably lacked: no timeout on the
// Resend call (a slow response could consume the whole function's
// execution budget with no chance for a retry), and no retry of any kind
// (a single transient failure -- timeout, network blip, Resend 5xx --
// failed the whole hook immediately). A ~0.3% rate is far more consistent
// with occasional transient failures than a deterministic code bug,
// which would be expected to fail at a much less specific,
// more code-dependent rate.
//
// Uses Resend's own idempotency-key support (IdempotentRequest, part of
// the SDK's send() options) rather than a hand-rolled retry-detection
// scheme -- the same key is reused across every attempt within one call,
// so if an earlier attempt actually succeeded on Resend's side but the
// caller never saw the response (e.g. timed out waiting), a retry with
// the same key cannot send a duplicate email.

export const RESEND_SEND_TIMEOUT_MS = 4000;
export const RESEND_MAX_ATTEMPTS = 2;
export const RESEND_RETRY_DELAY_MS = 500;

// 2026-08-02 follow-up: a real production failure (Sentry event
// 6c010966) turned out to be our own test artifact -- an @example.com
// address, correctly hard-rejected by Resend as name: "validation_error".
// The 800ms round-trip (too fast to be a timeout) was the tell. The
// existing statusCode-range check below already excluded this correctly
// in principle, but this adds an explicit check by name too -- Resend's
// own documented RESEND_ERROR_CODE_KEY enum -- as a more robust, directly
// testable signal that doesn't depend on statusCode being populated
// exactly as expected on every error shape Resend might ever return.
const NON_RETRYABLE_RESEND_ERROR_NAMES = new Set([
  "validation_error",
  "invalid_idempotency_key",
  "missing_api_key",
  "restricted_api_key",
  "invalid_api_key",
  "not_found",
  "method_not_allowed",
  "invalid_idempotent_request",
  "invalid_attachment",
  "invalid_from_address",
  "invalid_access",
  "invalid_parameter",
  "invalid_region",
  "missing_required_field",
  "security_error",
]);

export type ResendFailureKind = "invalid_address" | "transient";

// One shared classification used both to decide whether to retry (below)
// and, by the hook route, to decide what to tell the client -- kept as a
// single source rather than two separate checks that could drift apart.
export function classifyResendFailure(err: unknown): { retryable: boolean; kind: ResendFailureKind } {
  if (err && typeof err === "object" && "name" in err) {
    const name = (err as { name: unknown }).name;
    if (typeof name === "string" && NON_RETRYABLE_RESEND_ERROR_NAMES.has(name)) {
      return { retryable: false, kind: "invalid_address" };
    }
  }
  // Resend's own ErrorResponse shape carries statusCode: number | null.
  // null (network-level) or 5xx (server-side) are worth retrying; a 4xx
  // not already caught by name above is still treated as permanent.
  // Anything that doesn't match this shape at all (a thrown timeout/
  // network error from withTimeout) is retryable/transient.
  if (!err || typeof err !== "object" || !("statusCode" in err)) {
    return { retryable: true, kind: "transient" };
  }
  const statusCode = (err as { statusCode: number | null }).statusCode;
  if (statusCode === null || statusCode >= 500) {
    return { retryable: true, kind: "transient" };
  }
  return { retryable: false, kind: "invalid_address" };
}

export function isRetryableResendFailure(err: unknown): boolean {
  return classifyResendFailure(err).retryable;
}

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Resend send timed out after ${ms}ms`)), ms),
    ),
  ]);
}

export async function sendWithRetry(
  resend: ReturnType<typeof getResendClient>,
  payload: Parameters<ReturnType<typeof getResendClient>["emails"]["send"]>[0],
) {
  // Stable across every attempt in this call -- see file header comment.
  const idempotencyKey = crypto.randomUUID();
  let lastErr: unknown;

  for (let attempt = 1; attempt <= RESEND_MAX_ATTEMPTS; attempt++) {
    try {
      const { error } = await withTimeout(
        resend.emails.send(payload, { idempotencyKey }),
        RESEND_SEND_TIMEOUT_MS,
      );
      if (!error) return;
      lastErr = error;
    } catch (err) {
      lastErr = err;
    }

    if (attempt === RESEND_MAX_ATTEMPTS || !isRetryableResendFailure(lastErr)) {
      throw lastErr;
    }
    await new Promise((resolve) => setTimeout(resolve, RESEND_RETRY_DELAY_MS));
  }
}
