import { describe, it, expect, vi } from "vitest";
import { isRetryableResendFailure, classifyResendFailure, withTimeout, sendWithRetry } from "./resendRetry";

describe("classifyResendFailure", () => {
  it("classifies the real production failure this fix was built for: validation_error, invalid recipient", () => {
    // Shape matches Sentry event 6c010966 (2026-08-02): Resend rejecting
    // an @example.com-class address with "Invalid `to` field."
    const result = classifyResendFailure({
      statusCode: 422,
      message: "Invalid `to` field. The email address needs to follow the email@example.com format",
      name: "validation_error",
    });
    expect(result).toEqual({ retryable: false, kind: "invalid_address" });
  });

  it("classifies by name even if statusCode were absent or unexpected -- robustness, not just the range check", () => {
    const result = classifyResendFailure({ message: "x", name: "validation_error" });
    expect(result).toEqual({ retryable: false, kind: "invalid_address" });
  });

  it("classifies other documented non-retryable Resend error names as invalid_address/not retryable", () => {
    for (const name of ["invalid_from_address", "missing_required_field", "invalid_parameter", "restricted_api_key"]) {
      expect(classifyResendFailure({ statusCode: 400, message: "x", name })).toEqual({
        retryable: false,
        kind: "invalid_address",
      });
    }
  });

  it("classifies a 5xx or application_error as transient/retryable", () => {
    expect(classifyResendFailure({ statusCode: 500, message: "x", name: "internal_server_error" })).toEqual({
      retryable: true,
      kind: "transient",
    });
    expect(classifyResendFailure({ statusCode: null, message: "x", name: "application_error" })).toEqual({
      retryable: true,
      kind: "transient",
    });
  });

  it("classifies a thrown timeout/network error (no Resend shape at all) as transient/retryable", () => {
    expect(classifyResendFailure(new Error("Resend send timed out after 4000ms"))).toEqual({
      retryable: true,
      kind: "transient",
    });
  });
});

describe("isRetryableResendFailure", () => {
  it("treats a 5xx statusCode as retryable", () => {
    expect(isRetryableResendFailure({ statusCode: 500, message: "x", name: "internal_server_error" })).toBe(true);
    expect(isRetryableResendFailure({ statusCode: 503, message: "x", name: "internal_server_error" })).toBe(true);
  });

  it("treats a null statusCode (network-level) as retryable", () => {
    expect(isRetryableResendFailure({ statusCode: null, message: "x", name: "application_error" })).toBe(true);
  });

  it("treats a 4xx statusCode as permanent, not retryable", () => {
    expect(isRetryableResendFailure({ statusCode: 400, message: "invalid recipient", name: "validation_error" })).toBe(false);
    expect(isRetryableResendFailure({ statusCode: 422, message: "x", name: "validation_error" })).toBe(false);
  });

  it("treats an error with no statusCode field at all (thrown timeout/network error) as retryable", () => {
    expect(isRetryableResendFailure(new Error("Resend send timed out after 4000ms"))).toBe(true);
  });

  it("treats a non-object thrown value as retryable, not a crash", () => {
    expect(isRetryableResendFailure("some string")).toBe(true);
    expect(isRetryableResendFailure(null)).toBe(true);
  });
});

describe("withTimeout", () => {
  it("resolves normally when the promise finishes before the timeout", async () => {
    const result = await withTimeout(Promise.resolve("done"), 1000);
    expect(result).toBe("done");
  });

  it("rejects with a timeout error when the promise takes too long", async () => {
    const neverResolves = new Promise<string>(() => {});
    await expect(withTimeout(neverResolves, 10)).rejects.toThrow(/timed out after 10ms/);
  });
});

describe("sendWithRetry", () => {
  it("succeeds on the first attempt without retrying", async () => {
    const send = vi.fn().mockResolvedValue({ error: null });
    const resend = { emails: { send } } as unknown as Parameters<typeof sendWithRetry>[0];
    await sendWithRetry(resend, { to: "a@example.com" } as never);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("retries once on a retryable (5xx) failure, then succeeds", async () => {
    const send = vi
      .fn()
      .mockResolvedValueOnce({ error: { statusCode: 500, message: "x", name: "internal_server_error" } })
      .mockResolvedValueOnce({ error: null });
    const resend = { emails: { send } } as unknown as Parameters<typeof sendWithRetry>[0];
    await sendWithRetry(resend, { to: "a@example.com" } as never);
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("reuses the same idempotency key across retry attempts", async () => {
    const send = vi
      .fn()
      .mockResolvedValueOnce({ error: { statusCode: 500, message: "x", name: "internal_server_error" } })
      .mockResolvedValueOnce({ error: null });
    const resend = { emails: { send } } as unknown as Parameters<typeof sendWithRetry>[0];
    await sendWithRetry(resend, { to: "a@example.com" } as never);
    const firstKey = send.mock.calls[0][1].idempotencyKey;
    const secondKey = send.mock.calls[1][1].idempotencyKey;
    expect(firstKey).toBe(secondKey);
  });

  it("does not retry a permanent (4xx) failure", async () => {
    const send = vi.fn().mockResolvedValue({ error: { statusCode: 400, message: "bad request", name: "validation_error" } });
    const resend = { emails: { send } } as unknown as Parameters<typeof sendWithRetry>[0];
    await expect(sendWithRetry(resend, { to: "a@example.com" } as never)).rejects.toMatchObject({ statusCode: 400 });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("throws the last error after exhausting all retryable attempts", async () => {
    const send = vi.fn().mockResolvedValue({ error: { statusCode: 500, message: "still failing", name: "internal_server_error" } });
    const resend = { emails: { send } } as unknown as Parameters<typeof sendWithRetry>[0];
    await expect(sendWithRetry(resend, { to: "a@example.com" } as never)).rejects.toMatchObject({ message: "still failing" });
    expect(send).toHaveBeenCalledTimes(2); // RESEND_MAX_ATTEMPTS
  });
});
