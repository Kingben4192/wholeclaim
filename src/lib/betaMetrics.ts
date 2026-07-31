// Beta analytics instrumentation (proposal approved 2026-07-31). Pure
// functions, no I/O -- same discipline as storageStatus.ts, so the
// day-math and median boundary conditions are independently testable
// without a database. Consumed by src/app/admin/page.tsx's summary
// section; that page does the actual Supabase fetching.

export function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

const MS_PER_DAY = 86400000;

export type ConversionStats = {
  totalUsers: number;
  convertedUsers: number;
  conversionRatePercent: number;
  medianDaysToConvert: number | null;
};

// converted_at is set once, on first conversion (subscription or lifetime
// purchase) -- see supabase/migrations/0028_conversion_tracking.sql and
// src/lib/stripe/webhookHandlers.ts.
export function computeConversionStats(
  users: { createdAt: string; convertedAt: string | null }[],
): ConversionStats {
  const totalUsers = users.length;
  const converted = users.filter((u) => u.convertedAt);
  const daysToConvert = converted.map(
    (u) => (new Date(u.convertedAt!).getTime() - new Date(u.createdAt).getTime()) / MS_PER_DAY,
  );
  return {
    totalUsers,
    convertedUsers: converted.length,
    conversionRatePercent: totalUsers === 0 ? 0 : round1((converted.length / totalUsers) * 100),
    medianDaysToConvert: daysToConvert.length > 0 ? round1(median(daysToConvert)) : null,
  };
}

export type AiExhaustionStats = {
  claimsWithAnyRun: number;
  claimsExhausted: number;
  exhaustionRatePercent: number;
  medianDaysToExhaust: number | null;
};

// cap: pass FREE_CLAIM_CAP (src/lib/anthropic/rateLimit.ts) -- not
// hardcoded here, same "one source" discipline as FreeAiUsageBadge.
// Denominator is claims with at least one AI run, not all claims -- "% who
// exhaust it" is meaningless against claims that never touched AI at all.
export function computeAiExhaustionStats(
  runs: { userId: string; claimId: string | null; createdAt: string }[],
  cap: number,
): AiExhaustionStats {
  const byClaim = new Map<string, string[]>();
  for (const r of runs) {
    if (!r.claimId) continue;
    const key = `${r.userId}:${r.claimId}`;
    const arr = byClaim.get(key) ?? [];
    arr.push(r.createdAt);
    byClaim.set(key, arr);
  }

  let exhausted = 0;
  const daysToExhaust: number[] = [];
  for (const timestamps of byClaim.values()) {
    if (timestamps.length >= cap) {
      exhausted++;
      const sorted = [...timestamps].sort();
      const first = new Date(sorted[0]).getTime();
      const nth = new Date(sorted[cap - 1]).getTime();
      daysToExhaust.push((nth - first) / MS_PER_DAY);
    }
  }

  return {
    claimsWithAnyRun: byClaim.size,
    claimsExhausted: exhausted,
    exhaustionRatePercent: byClaim.size === 0 ? 0 : round1((exhausted / byClaim.size) * 100),
    medianDaysToExhaust: daysToExhaust.length > 0 ? round1(median(daysToExhaust)) : null,
  };
}

export type RetentionStats = { windowDays: number; eligible: number; returned: number; ratePercent: number };

// "Eligible" = old enough that the window has actually elapsed (a user who
// signed up 10 days ago can't yet prove/disprove 30-day retention either
// way, and must not count as a non-returner). "Returned" = eligible AND
// their last sign-in falls on/after the window boundary -- a user who
// never logs in again keeps last_sign_in_at at their original sign-in
// (Supabase sets it on every successful auth, including the first),
// which is why "returned" requires the gap itself to reach windowDays,
// not just "has a last_sign_in_at at all."
export function computeRetentionRate(
  users: { createdAt: string; lastSignInAt: string | null }[],
  windowDays: number,
  now: Date,
): RetentionStats {
  const eligible = users.filter(
    (u) => (now.getTime() - new Date(u.createdAt).getTime()) / MS_PER_DAY >= windowDays,
  );
  const returned = eligible.filter(
    (u) =>
      u.lastSignInAt &&
      (new Date(u.lastSignInAt).getTime() - new Date(u.createdAt).getTime()) / MS_PER_DAY >= windowDays,
  );
  return {
    windowDays,
    eligible: eligible.length,
    returned: returned.length,
    ratePercent: eligible.length === 0 ? 0 : round1((returned.length / eligible.length) * 100),
  };
}
