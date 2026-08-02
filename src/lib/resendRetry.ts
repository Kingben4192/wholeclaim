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

export function isRetryableResendFailure(err: unknown): boolean {
  // Resend's own ErrorResponse shape carries statusCode: number | null.
  // null (network-level) or 5xx (server-side) are worth retrying; a 4xx
  // (invalid recipient, bad request) is permanent -- retrying wastes the
  // one additional attempt this budget allows and won't change the
  // outcome. Anything that doesn't even match that shape (a thrown
  // timeout/network error from withTimeout) is also retryable.
  if (!err || typeof err !== "object" || !("statusCode" in err)) return true;
  const statusCode = (err as { statusCode: number | null }).statusCode;
  return statusCode === null || statusCode >= 500;
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
