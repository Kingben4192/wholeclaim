import {
  FREE_STORAGE_LIMIT_PER_CLAIM_BYTES,
  FREE_STORAGE_LIMIT_PER_ACCOUNT_BYTES,
  PRO_STORAGE_LIMIT_PER_ACCOUNT_BYTES,
  PRO_STORAGE_BUFFER_BYTES,
} from "./uploadLimits";

// Decision #55's storage_status enum, made real (Decision #88 /
// STORAGE_ENFORCEMENT_BRIEF.md step 4). Pure functions, no I/O -- same
// discipline as the rest of this codebase's gate logic (checkClaimCategoryAccess,
// documentationScore) so the boundary conditions are independently
// testable without a database.

export type StorageStatus = "normal" | "warning" | "over_limit" | "blocked";

export type StorageCheckResult = {
  status: StorageStatus;
  bindingLimit: "claim" | "account";
  usedBytes: number;
  limitBytes: number;
};

const STATUS_RANK: Record<StorageStatus, number> = {
  normal: 0,
  warning: 1,
  over_limit: 2,
  blocked: 3,
};

// bufferBytes = 0 (free tier): crossing limitBytes blocks immediately --
// no over_limit stage, since there's no buffer to be "over but still
// allowed" within (Decision #55, clarified 2026-07-31).
// bufferBytes > 0 (Pro tier): crossing limitBytes warns and still allows
// uploads into the buffer (over_limit); only exhausting limitBytes +
// bufferBytes blocks (Decision #81).
function statusForSingleLimit(
  usedBytes: number,
  limitBytes: number,
  bufferBytes: number,
): StorageStatus {
  if (usedBytes >= limitBytes + bufferBytes) return "blocked";
  if (usedBytes >= limitBytes) return bufferBytes > 0 ? "over_limit" : "blocked";
  if (usedBytes >= limitBytes * 0.8) return "warning";
  return "normal";
}

// Free tier carries two independent limits (per-claim, per-account,
// Decision #55) -- the more restrictive of the two binds, and callers need
// to know which one so the blocked message can name the actual constraint
// rather than a generic "storage full" (same pattern as the AI/file-count/
// claim-category gates).
export function computeFreeStorageStatus(
  claimUsedBytes: number,
  accountUsedBytes: number,
): StorageCheckResult {
  const claimStatus = statusForSingleLimit(claimUsedBytes, FREE_STORAGE_LIMIT_PER_CLAIM_BYTES, 0);
  const accountStatus = statusForSingleLimit(accountUsedBytes, FREE_STORAGE_LIMIT_PER_ACCOUNT_BYTES, 0);

  if (STATUS_RANK[accountStatus] >= STATUS_RANK[claimStatus]) {
    return {
      status: accountStatus,
      bindingLimit: "account",
      usedBytes: accountUsedBytes,
      limitBytes: FREE_STORAGE_LIMIT_PER_ACCOUNT_BYTES,
    };
  }
  return {
    status: claimStatus,
    bindingLimit: "claim",
    usedBytes: claimUsedBytes,
    limitBytes: FREE_STORAGE_LIMIT_PER_CLAIM_BYTES,
  };
}

// Pro tier has no per-claim storage limit (Decision #81) -- account-level
// only, with the buffer.
export function computeProStorageStatus(accountUsedBytes: number): StorageCheckResult {
  const status = statusForSingleLimit(
    accountUsedBytes,
    PRO_STORAGE_LIMIT_PER_ACCOUNT_BYTES,
    PRO_STORAGE_BUFFER_BYTES,
  );
  return {
    status,
    bindingLimit: "account",
    usedBytes: accountUsedBytes,
    limitBytes: PRO_STORAGE_LIMIT_PER_ACCOUNT_BYTES,
  };
}
