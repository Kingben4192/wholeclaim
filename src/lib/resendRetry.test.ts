import { describe, it, expect, vi } from "vitest";
import { isRetryableResendFailure, withTimeout, sendWithRetry } from "./resendRetry";

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
