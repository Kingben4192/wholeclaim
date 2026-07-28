# Storage Enforcement Brief

**Status**: not started. Filed 2026-07-28 as a pre-launch sequencing item, alongside Sentry, staging, and CI/CD. Nothing in this document is built — see Decision #88 (`00_Founder/Decisions.md`), which is the reason this exists: storage limits (500MB/claim, 2GB/account, Decision #55) are policy-only today, and must not appear in user-facing copy until every step below actually ships.

## Confirmed current state

Only the free-tier **file-count** cap is real (`FREE_UPLOAD_LIMIT_PER_CLAIM = 25`, `src/lib/uploadLimits.ts`, enforced in `checkUploadAccess`/`uploadGate.ts`). No byte-sum tracking or enforcement exists anywhere — `uploadLimits.ts`'s own comment says so directly. The `storage_status` enum (`normal`/`warning`/`over_limit`/`blocked`) referenced in Decision #55 does not exist in the schema yet.

## Build steps

1. **Add `size_bytes` to `files` rows**, written at upload completion. Backfill existing rows from Storage's own object metadata in the migration — never trust what was recorded (or not recorded) at upload time for rows that predate this column.
2. **Maintain `storage_used_bytes` on `claims` and `profiles`** (claim-level and account-level running totals), updated transactionally on upload and on **hard purge only** — a soft delete frees a file-count slot but not bytes, per Decision #52's existing count-vs-storage distinction. Getting this wrong (freeing bytes on soft delete) would silently under-count usage.
3. **Enforce server-side in the upload action**, before accepting a file: incoming size + current usage, checked against both the per-claim limit and the per-account ceiling. The stricter of the two binds. The blocked message must name the actual binding limit (matching the pattern already used for the AI, file-count, and claim-category gates) — not a generic "storage full."
4. **Implement the 500MB emergency buffer** (Decision #55): over the primary limit warns and allows the upload into the buffer; buffer exhausted hard-blocks with the upgrade path. Make `storage_status` a real, computed value, not just a documented enum.
5. **Ship usage UI in the same build**, not a follow-up: an "X GB / Y GB used" bar reading the exact same stored value the enforcement check reads (same discipline as `FreeAiUsageBadge`'s relationship to `checkUsageGate` — one source, not a UI-side estimate). Warn at 80% and 95%.
6. **Only after enforcement is live**: write the real storage numbers into `FEATURE_COMPARISON`, `/pricing`, and `help/page.tsx`, and log the decision flipping Decision #88 from policy-only to enforced.

## Open design item to resolve during the build, not before

**Don't trust client-reported file size.** The upload action receives a `File` object's `.size` from the browser, which is usually accurate but not a security boundary — reconcile `size_bytes` against Storage's own object metadata immediately after the upload completes, and correct the running total if they disagree, rather than trusting the pre-upload number as final.
