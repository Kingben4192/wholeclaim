import { describe, it, expect } from "vitest";
import {
  median,
  computeConversionStats,
  computeAiExhaustionStats,
  computeRetentionRate,
  computeCostPerFreeAccount,
} from "./betaMetrics";

describe("median", () => {
  it("returns 0 for an empty array", () => {
    expect(median([])).toBe(0);
  });
  it("returns the middle value for an odd-length array", () => {
    expect(median([3, 1, 2])).toBe(2);
  });
  it("averages the two middle values for an even-length array", () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });
});

describe("computeConversionStats", () => {
  it("returns 0% with no users, not NaN or a divide-by-zero throw", () => {
    const result = computeConversionStats([]);
    expect(result.conversionRatePercent).toBe(0);
    expect(result.medianDaysToConvert).toBeNull();
  });

  it("computes rate and median days from converted users only", () => {
    const result = computeConversionStats([
      { createdAt: "2026-01-01T00:00:00Z", convertedAt: "2026-01-11T00:00:00Z" }, // 10 days
      { createdAt: "2026-01-01T00:00:00Z", convertedAt: "2026-01-06T00:00:00Z" }, // 5 days
      { createdAt: "2026-01-01T00:00:00Z", convertedAt: null },
    ]);
    expect(result.totalUsers).toBe(3);
    expect(result.convertedUsers).toBe(2);
    expect(result.conversionRatePercent).toBeCloseTo(66.7, 1);
    expect(result.medianDaysToConvert).toBe(7.5);
  });
});

describe("computeAiExhaustionStats", () => {
  const cap = 3;

  it("does not count a claim with fewer runs than the cap", () => {
    const result = computeAiExhaustionStats(
      [
        { userId: "u1", claimId: "c1", createdAt: "2026-01-01T00:00:00Z" },
        { userId: "u1", claimId: "c1", createdAt: "2026-01-02T00:00:00Z" },
      ],
      cap,
    );
    expect(result.claimsWithAnyRun).toBe(1);
    expect(result.claimsExhausted).toBe(0);
  });

  it("counts a claim at exactly the cap and computes days to the Nth run", () => {
    const result = computeAiExhaustionStats(
      [
        { userId: "u1", claimId: "c1", createdAt: "2026-01-01T00:00:00Z" },
        { userId: "u1", claimId: "c1", createdAt: "2026-01-02T00:00:00Z" },
        { userId: "u1", claimId: "c1", createdAt: "2026-01-04T00:00:00Z" },
      ],
      cap,
    );
    expect(result.claimsExhausted).toBe(1);
    expect(result.exhaustionRatePercent).toBe(100);
    expect(result.medianDaysToExhaust).toBe(3);
  });

  it("ignores runs with no claim_id", () => {
    const result = computeAiExhaustionStats(
      [{ userId: "u1", claimId: null, createdAt: "2026-01-01T00:00:00Z" }],
      cap,
    );
    expect(result.claimsWithAnyRun).toBe(0);
  });
});

describe("computeRetentionRate", () => {
  const now = new Date("2026-03-01T00:00:00Z");

  it("excludes a user too new for the window to have elapsed at all", () => {
    const result = computeRetentionRate(
      [{ createdAt: "2026-02-20T00:00:00Z", lastSignInAt: null }], // 9 days old, window is 30
      30,
      now,
    );
    expect(result.eligible).toBe(0);
  });

  it("counts an eligible user who never returned as not returned", () => {
    const result = computeRetentionRate(
      [{ createdAt: "2026-01-01T00:00:00Z", lastSignInAt: "2026-01-01T00:00:00Z" }], // last sign-in == signup, never came back
      30,
      now,
    );
    expect(result.eligible).toBe(1);
    expect(result.returned).toBe(0);
  });

  it("counts a user as returned exactly at the window boundary, not just after it", () => {
    const result = computeRetentionRate(
      [{ createdAt: "2026-01-01T00:00:00Z", lastSignInAt: "2026-01-31T00:00:00Z" }], // exactly 30 days later
      30,
      now,
    );
    expect(result.returned).toBe(1);
  });

  it("does not count a return one day short of the window", () => {
    const result = computeRetentionRate(
      [{ createdAt: "2026-01-01T00:00:00Z", lastSignInAt: "2026-01-30T00:00:00Z" }], // 29 days later
      30,
      now,
    );
    expect(result.returned).toBe(0);
  });
});

describe("computeCostPerFreeAccount", () => {
  it("returns 0 with no free accounts, not a divide-by-zero throw", () => {
    const result = computeCostPerFreeAccount([], []);
    expect(result.avgCostPerFreeAccountUsd).toBe(0);
  });

  it("computes AI cost from input/output tokens at the supplied per-million rates", () => {
    // 1,000,000 input tokens @ $3/M = $3; 1,000,000 output tokens @ $15/M = $15
    const result = computeCostPerFreeAccount(
      [{ userId: "u1", storageUsedBytes: 0 }],
      [{ userId: "u1", tokensIn: 1_000_000, tokensOut: 1_000_000 }],
    );
    expect(result.totalAiCostUsd).toBe(18);
    expect(result.totalStorageCostUsd).toBe(0);
    expect(result.avgCostPerFreeAccountUsd).toBe(18);
  });

  it("computes storage cost from bytes at the supplied $/GB/month rate", () => {
    const oneGb = 1024 ** 3;
    const result = computeCostPerFreeAccount([{ userId: "u1", storageUsedBytes: oneGb }], []);
    expect(result.totalStorageCostUsd).toBe(0.02); // $0.021 rounds to $0.02 at 2 decimal places
  });

  it("excludes Pro accounts' AI usage from the free-tier cost total", () => {
    const result = computeCostPerFreeAccount(
      [{ userId: "free_user", storageUsedBytes: 0 }],
      [
        { userId: "free_user", tokensIn: 1_000_000, tokensOut: 0 },
        { userId: "pro_user", tokensIn: 1_000_000, tokensOut: 0 }, // not in freeAccounts, must not count
      ],
    );
    expect(result.totalAiCostUsd).toBe(3);
  });

  it("averages total cost across all free accounts, not just ones with usage", () => {
    const result = computeCostPerFreeAccount(
      [
        { userId: "u1", storageUsedBytes: 0 },
        { userId: "u2", storageUsedBytes: 0 }, // no AI runs, no storage -- still counts in the denominator
      ],
      [{ userId: "u1", tokensIn: 1_000_000, tokensOut: 0 }], // $3 total
    );
    expect(result.freeAccountCount).toBe(2);
    expect(result.avgCostPerFreeAccountUsd).toBe(1.5);
  });

  it("treats null token counts as zero rather than propagating NaN", () => {
    const result = computeCostPerFreeAccount(
      [{ userId: "u1", storageUsedBytes: 0 }],
      [{ userId: "u1", tokensIn: null, tokensOut: null }],
    );
    expect(result.totalAiCostUsd).toBe(0);
    expect(Number.isNaN(result.totalAiCostUsd)).toBe(false);
  });
});
