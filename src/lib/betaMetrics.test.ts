import { describe, it, expect } from "vitest";
import { median, computeConversionStats, computeAiExhaustionStats, computeRetentionRate } from "./betaMetrics";

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
