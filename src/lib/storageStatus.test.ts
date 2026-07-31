import { describe, it, expect } from "vitest";
import { computeFreeStorageStatus, computeProStorageStatus } from "./storageStatus";
import {
  FREE_STORAGE_LIMIT_PER_CLAIM_BYTES,
  FREE_STORAGE_LIMIT_PER_ACCOUNT_BYTES,
  PRO_STORAGE_LIMIT_PER_ACCOUNT_BYTES,
  PRO_STORAGE_BUFFER_BYTES,
} from "./uploadLimits";

describe("computeFreeStorageStatus", () => {
  it("is normal well under both limits", () => {
    const result = computeFreeStorageStatus(1000, 1000);
    expect(result.status).toBe("normal");
  });

  it("warns at exactly 80% of the per-claim limit", () => {
    const result = computeFreeStorageStatus(FREE_STORAGE_LIMIT_PER_CLAIM_BYTES * 0.8, 0);
    expect(result.status).toBe("warning");
    expect(result.bindingLimit).toBe("claim");
  });

  it("is still normal just under the 80% threshold", () => {
    const result = computeFreeStorageStatus(FREE_STORAGE_LIMIT_PER_CLAIM_BYTES * 0.8 - 1, 0);
    expect(result.status).toBe("normal");
  });

  it("blocks immediately at the per-claim limit -- no buffer stage for free tier", () => {
    const result = computeFreeStorageStatus(FREE_STORAGE_LIMIT_PER_CLAIM_BYTES, 0);
    expect(result.status).toBe("blocked");
    expect(result.bindingLimit).toBe("claim");
  });

  it("blocks immediately at the per-account limit", () => {
    const result = computeFreeStorageStatus(0, FREE_STORAGE_LIMIT_PER_ACCOUNT_BYTES);
    expect(result.status).toBe("blocked");
    expect(result.bindingLimit).toBe("account");
  });

  it("reports the more restrictive of the two limits as binding when both apply", () => {
    // Under the claim limit but over the account limit -- account binds.
    const result = computeFreeStorageStatus(1000, FREE_STORAGE_LIMIT_PER_ACCOUNT_BYTES);
    expect(result.status).toBe("blocked");
    expect(result.bindingLimit).toBe("account");
  });

  it("reports the claim limit as binding when it's the worse of the two", () => {
    const result = computeFreeStorageStatus(FREE_STORAGE_LIMIT_PER_CLAIM_BYTES, 1000);
    expect(result.status).toBe("blocked");
    expect(result.bindingLimit).toBe("claim");
  });
});

describe("computeProStorageStatus", () => {
  it("is normal well under the limit", () => {
    const result = computeProStorageStatus(1000);
    expect(result.status).toBe("normal");
  });

  it("warns at exactly 80% of the account limit", () => {
    const result = computeProStorageStatus(PRO_STORAGE_LIMIT_PER_ACCOUNT_BYTES * 0.8);
    expect(result.status).toBe("warning");
  });

  it("moves to over_limit (not blocked) at the primary limit -- Pro gets a buffer", () => {
    const result = computeProStorageStatus(PRO_STORAGE_LIMIT_PER_ACCOUNT_BYTES);
    expect(result.status).toBe("over_limit");
  });

  it("stays over_limit partway through the buffer", () => {
    const result = computeProStorageStatus(PRO_STORAGE_LIMIT_PER_ACCOUNT_BYTES + PRO_STORAGE_BUFFER_BYTES / 2);
    expect(result.status).toBe("over_limit");
  });

  it("blocks only once the buffer itself is exhausted", () => {
    const result = computeProStorageStatus(PRO_STORAGE_LIMIT_PER_ACCOUNT_BYTES + PRO_STORAGE_BUFFER_BYTES);
    expect(result.status).toBe("blocked");
  });

  it("is still over_limit one byte before the buffer is exhausted", () => {
    const result = computeProStorageStatus(
      PRO_STORAGE_LIMIT_PER_ACCOUNT_BYTES + PRO_STORAGE_BUFFER_BYTES - 1,
    );
    expect(result.status).toBe("over_limit");
  });
});
