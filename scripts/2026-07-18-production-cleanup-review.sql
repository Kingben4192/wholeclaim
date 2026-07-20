-- ============================================================================
-- WholeClaim Production Cleanup — REVIEW PACKAGE ONLY. NOT EXECUTED.
-- Generated 2026-07-18, updated 2026-07-18 (final safety review pass).
-- Every ID below was read directly from the live database (service-role
-- client, read-only queries) — nothing guessed.
--
-- SCOPE, as confirmed by the founder:
--   DELETE: 3 test claims (2x "grange", 1x "All state") and every child row
--           they own; 2 orphaned test accounts (redirect-verify@example.com,
--           redirect-verify-2@example.com).
--   KEEP, DO NOT TOUCH:
--     - benjaminhammonds@gmail.com (2c98b5cf-902c-48d4-b7c1-f5927dfd6bdc)
--       — owns the 3 test claims, but the ACCOUNT itself is production data.
--       Only the 3 named claim rows (and their children) are deleted below;
--       the auth.users/profiles row for this account is never touched.
--     - camilliab32@gmail.com (dba655da-00e5-4204-9a3b-84e366ded11b)
--       — appears nowhere in this package. No statement below references
--       this UUID in any WHERE clause.
--
-- DEPENDENCY ORDER (confirmed against the actual migration files, not
-- assumed): entries/deadlines/evidence_items/files/loss_of_use_expenses
-- all cascade from claims.id — deleted explicitly anyway per "no cascade
-- assumptions." ai_runs/leads/claim_entitlements/claim_guarantee use
-- ON DELETE SET NULL from claims.id — these would NOT be removed by
-- deleting the claim; they would just orphan with claim_id = null. They
-- are deleted explicitly, before the claims row, so nothing survives as
-- an orphan.
--
-- ============================================================================
-- BEFORE RUNNING ANYTHING BELOW — TWO PREREQUISITES
-- ============================================================================
--
-- 1. BACKUP — NOT SOMETHING I CAN DO FOR YOU.
--    I have a service-role REST API key for this project, not a Postgres
--    connection string, pg_dump access, or a Supabase Management API
--    token in this session — there is no mechanism available to me to
--    trigger or verify a backup. This has to be a manual step on your
--    side before executing anything below:
--      a. Supabase Dashboard -> Database -> Backups. If the project is on
--         a paid plan, daily automatic backups likely already exist —
--         confirm one from the last 24 hours is listed.
--      b. If you want a fresh, on-demand backup instead of relying on the
--         daily one, the same Backups page usually has a manual trigger,
--         or you can run `pg_dump` yourself against the connection string
--         from Settings -> Database -> Connection string.
--    Do not proceed past this point until one of those is confirmed.
--
-- 2. TRANSACTION BEHAVIOR IN THE SUPABASE DASHBOARD SQL EDITOR — I can't
--    verify this empirically; I have no hands-on access to test it in
--    your actual dashboard session. What's generally true of Supabase's
--    SQL Editor: pasting a multi-statement script and clicking "Run" once
--    sends the whole thing to Postgres as a single execution, which
--    should honor BEGIN ... COMMIT/ROLLBACK as a real transaction. The
--    operational rule that matters regardless of the internals: run this
--    ENTIRE file — from BEGIN through your chosen COMMIT or ROLLBACK line
--    at the bottom — as ONE PASTE, ONE "RUN" CLICK. Do not highlight and
--    run statements one at a time; separate executions may use separate
--    connections, which would break the transaction and could commit
--    partial work outside your control. If you want certainty rather than
--    "should," run this via `psql` or another standalone Postgres client
--    with the connection string instead of the Dashboard SQL Editor —
--    transaction semantics there are unambiguous.
-- ============================================================================


BEGIN;
-- Everything from here to the commented-out COMMIT/ROLLBACK at the very
-- bottom of this file is one transaction. Nothing is permanent until an
-- explicit COMMIT is uncommented and run. Reviewing the SELECT output at
-- any point costs nothing — you can still ROLLBACK after looking.


-- ============================================================================
-- PART A0 — BASELINE TOTALS, BEFORE ANY DELETE (for before/after comparison)
-- ============================================================================
-- Known from the read-only audit that produced this file: the `claims`
-- table currently has exactly 3 rows total, and all 3 are the test claims
-- being deleted below. That means every child table that requires a
-- claim_id will end up completely empty after this runs — there is no
-- other claim data in this database yet. Worth knowing explicitly rather
-- than discovering it as a surprise in the final counts.

SELECT
  (SELECT COUNT(*) FROM claims)             AS claims_before,
  (SELECT COUNT(*) FROM ai_runs)            AS ai_runs_before,
  (SELECT COUNT(*) FROM files)              AS files_before,
  (SELECT COUNT(*) FROM entries)            AS entries_before,
  (SELECT COUNT(*) FROM deadlines)          AS deadlines_before,
  (SELECT COUNT(*) FROM evidence_items)     AS evidence_items_before,
  (SELECT COUNT(*) FROM claim_entitlements) AS claim_entitlements_before,
  (SELECT COUNT(*) FROM claim_guarantee)    AS claim_guarantee_before;
-- Expected, based on the audit: claims=3, ai_runs=3, files=1, entries=4,
-- deadlines=2, evidence_items=2, claim_entitlements=0, claim_guarantee=0.
-- If any of these differ from what's expected, STOP and re-run Step 1
-- (ID identification) before proceeding — something changed since the
-- audit.


-- ============================================================================
-- PART A — THE 3 TEST CLAIMS AND THEIR CHILDREN
-- ============================================================================
--
-- Claim IDs (all owned by 2c98b5cf-902c-48d4-b7c1-f5927dfd6bdc, kept):
--   a6427eaa-fba7-446b-aaec-ee0d2a4bd72d  "All state"  claim_number 5689g6789        (no child rows found anywhere)
--   e3906d1b-b0d7-4891-8f84-cb357fda2887  "grange"     claim_number 32333545455  (2026-07-15 22:08)
--   e0e1bdb7-090f-48b6-adbf-e2c57f71b393  "grange"     claim_number 32333545455  (2026-07-15 15:25)

-- ---- A1. ai_runs (ON DELETE SET NULL — must be explicit) ----
-- 3 rows found, all on claim e3906d1b (analyze:policy, analyze:loss, analyze:gap).

-- Verify before:
SELECT id, tool, claim_id, created_at FROM ai_runs
WHERE id IN (
  'a75115d2-e0ed-4d7d-bd5e-2cc4dd3fd9a8',
  '0bfc3daa-df0c-4d3c-b61d-e7465295a134',
  'b2871218-7e1a-468f-8472-c86e088f88df'
);
-- Expect: 3 rows.

DELETE FROM ai_runs
WHERE id IN (
  'a75115d2-e0ed-4d7d-bd5e-2cc4dd3fd9a8',
  '0bfc3daa-df0c-4d3c-b61d-e7465295a134',
  'b2871218-7e1a-468f-8472-c86e088f88df'
);

-- Verify after:
SELECT id FROM ai_runs
WHERE id IN (
  'a75115d2-e0ed-4d7d-bd5e-2cc4dd3fd9a8',
  '0bfc3daa-df0c-4d3c-b61d-e7465295a134',
  'b2871218-7e1a-468f-8472-c86e088f88df'
);
-- Expect: 0 rows.


-- ---- A2. entries (cascades from claims, deleted explicitly) ----
-- 4 rows: 2 on e0e1bdb7, 2 on e3906d1b.

SELECT id, claim_id, type, summary, created_at FROM entries
WHERE id IN (
  '01cfaec6-12ee-4ab2-a20b-ce4039aa1575',
  '5b6a9c34-78f8-450f-b86b-fd179ed775de',
  '5cbea863-0c78-4343-86f0-82ae2a1d04bc',
  '8149a57c-f22c-405e-a078-583634db06a5'
);
-- Expect: 4 rows.

DELETE FROM entries
WHERE id IN (
  '01cfaec6-12ee-4ab2-a20b-ce4039aa1575',
  '5b6a9c34-78f8-450f-b86b-fd179ed775de',
  '5cbea863-0c78-4343-86f0-82ae2a1d04bc',
  '8149a57c-f22c-405e-a078-583634db06a5'
);

SELECT id FROM entries
WHERE id IN (
  '01cfaec6-12ee-4ab2-a20b-ce4039aa1575',
  '5b6a9c34-78f8-450f-b86b-fd179ed775de',
  '5cbea863-0c78-4343-86f0-82ae2a1d04bc',
  '8149a57c-f22c-405e-a078-583634db06a5'
);
-- Expect: 0 rows.


-- ---- A3. deadlines (cascades from claims, deleted explicitly) ----
-- 2 rows: 1 on e0e1bdb7, 1 on e3906d1b.

SELECT id, claim_id, title, due_date FROM deadlines
WHERE id IN (
  '9708877a-ad37-43bc-a0c9-ca75aa1eea36',
  'c23177d2-daab-40d0-8d42-4fb8cd866dc9'
);
-- Expect: 2 rows.

DELETE FROM deadlines
WHERE id IN (
  '9708877a-ad37-43bc-a0c9-ca75aa1eea36',
  'c23177d2-daab-40d0-8d42-4fb8cd866dc9'
);

SELECT id FROM deadlines
WHERE id IN (
  '9708877a-ad37-43bc-a0c9-ca75aa1eea36',
  'c23177d2-daab-40d0-8d42-4fb8cd866dc9'
);
-- Expect: 0 rows.


-- ---- A4. evidence_items (cascades from claims, deleted explicitly) ----
-- 2 rows, both with file_id already null — no dependency on files table.

SELECT id, claim_id, label, file_id FROM evidence_items
WHERE id IN (
  'b06a27f4-743a-467b-9997-3f30e02e9835',
  'f7bd3532-fa14-40ee-99d5-d0dbac6fe47f'
);
-- Expect: 2 rows, file_id null on both.

DELETE FROM evidence_items
WHERE id IN (
  'b06a27f4-743a-467b-9997-3f30e02e9835',
  'f7bd3532-fa14-40ee-99d5-d0dbac6fe47f'
);

SELECT id FROM evidence_items
WHERE id IN (
  'b06a27f4-743a-467b-9997-3f30e02e9835',
  'f7bd3532-fa14-40ee-99d5-d0dbac6fe47f'
);
-- Expect: 0 rows.


-- ---- A5. files (cascades from claims, deleted explicitly) ----
-- 1 row, on claim e3906d1b. IMPORTANT: this DELETE only removes the
-- database row. The actual binary object still exists in Supabase
-- Storage (bucket "evidence") at the path below and will NOT be freed by
-- SQL — that requires a separate Storage API call
-- (supabase.storage.from('evidence').remove([...])), not included here
-- since this package is SQL-only per your request. Flagging so it isn't
-- missed: storage_path =
--   2c98b5cf-902c-48d4-b7c1-f5927dfd6bdc/e3906d1b-b0d7-4891-8f84-cb357fda2887/9215c25d-4cf8-4ca6-a608-7ad74efec906-images.jfif

SELECT id, claim_id, storage_path, original_name FROM files
WHERE id IN (
  'dcf6c355-422d-4390-9046-18b2ff5d34f2'
);
-- Expect: 1 row.

DELETE FROM files
WHERE id IN (
  'dcf6c355-422d-4390-9046-18b2ff5d34f2'
);

SELECT id FROM files
WHERE id IN (
  'dcf6c355-422d-4390-9046-18b2ff5d34f2'
);
-- Expect: 0 rows.


-- ---- A6. loss_of_use_expenses, claim_entitlements, claim_guarantee, leads ----
-- All four queried directly against the 3 claim IDs — zero rows found in
-- any of them. Included for a complete audit trail; no DELETE needed.

SELECT id FROM loss_of_use_expenses WHERE claim_id IN (
  'a6427eaa-fba7-446b-aaec-ee0d2a4bd72d',
  'e3906d1b-b0d7-4891-8f84-cb357fda2887',
  'e0e1bdb7-090f-48b6-adbf-e2c57f71b393'
); -- Expect: 0 rows. Confirmed empty at audit time — no DELETE required.

SELECT id FROM claim_entitlements WHERE claim_id IN (
  'a6427eaa-fba7-446b-aaec-ee0d2a4bd72d',
  'e3906d1b-b0d7-4891-8f84-cb357fda2887',
  'e0e1bdb7-090f-48b6-adbf-e2c57f71b393'
); -- Expect: 0 rows. Confirmed empty at audit time — no DELETE required.

SELECT id FROM claim_guarantee WHERE claim_id IN (
  'a6427eaa-fba7-446b-aaec-ee0d2a4bd72d',
  'e3906d1b-b0d7-4891-8f84-cb357fda2887',
  'e0e1bdb7-090f-48b6-adbf-e2c57f71b393'
); -- Expect: 0 rows. Confirmed empty at audit time — no DELETE required.

SELECT id FROM leads WHERE claim_id IN (
  'a6427eaa-fba7-446b-aaec-ee0d2a4bd72d',
  'e3906d1b-b0d7-4891-8f84-cb357fda2887',
  'e0e1bdb7-090f-48b6-adbf-e2c57f71b393'
); -- Expect: 0 rows. Confirmed empty at audit time — no DELETE required.


-- ---- A7. claims (the parent — deleted LAST, after every child above) ----
-- Explicitly excludes every other claim in the table by construction:
-- this is an id-IN-list of exactly the 3 confirmed test claims, nothing
-- matched by carrier name or any other broad predicate.

SELECT id, user_id, carrier, claim_number, created_at FROM claims
WHERE id IN (
  'a6427eaa-fba7-446b-aaec-ee0d2a4bd72d',
  'e3906d1b-b0d7-4891-8f84-cb357fda2887',
  'e0e1bdb7-090f-48b6-adbf-e2c57f71b393'
);
-- Expect: 3 rows, all user_id = 2c98b5cf-902c-48d4-b7c1-f5927dfd6bdc.
-- If this SELECT ever returns a row with a different user_id, STOP —
-- do not run the DELETE below.

DELETE FROM claims
WHERE id IN (
  'a6427eaa-fba7-446b-aaec-ee0d2a4bd72d',
  'e3906d1b-b0d7-4891-8f84-cb357fda2887',
  'e0e1bdb7-090f-48b6-adbf-e2c57f71b393'
);

SELECT id FROM claims
WHERE id IN (
  'a6427eaa-fba7-446b-aaec-ee0d2a4bd72d',
  'e3906d1b-b0d7-4891-8f84-cb357fda2887',
  'e0e1bdb7-090f-48b6-adbf-e2c57f71b393'
);
-- Expect: 0 rows.

-- Sanity check — confirms the founder's account itself was never touched:
SELECT id, email, created_at FROM auth.users WHERE id = '2c98b5cf-902c-48d4-b7c1-f5927dfd6bdc';
-- Expect: 1 row, unchanged, still present. This account is never deleted
-- by this package.


-- ============================================================================
-- PART B — THE 2 ORPHANED TEST ACCOUNTS
-- ============================================================================
--
-- fd3d566d-f1bc-47b1-9196-4bb33271c515  redirect-verify@example.com    (unconfirmed, no claims, no other data)
-- 55e39ae6-cf2e-41b2-bbe2-00ba84c5652a  redirect-verify-2@example.com  (unconfirmed, no claims, no other data)
--
-- Confirmed by direct query: these two own zero rows in claims, entries,
-- deadlines, evidence_items, files, loss_of_use_expenses, ai_runs,
-- claim_entitlements, claim_guarantee, push_subscriptions, or
-- library_entries. The ONLY row either owns anywhere is their own
-- `profiles` row (auto-created by the handle_new_user trigger on signup).

-- ---- B1. profiles (would cascade automatically from auth.users, deleted explicitly anyway) ----

SELECT id, plan, created_at FROM profiles
WHERE id IN (
  'fd3d566d-f1bc-47b1-9196-4bb33271c515',
  '55e39ae6-cf2e-41b2-bbe2-00ba84c5652a'
);
-- Expect: 2 rows.

DELETE FROM profiles
WHERE id IN (
  'fd3d566d-f1bc-47b1-9196-4bb33271c515',
  '55e39ae6-cf2e-41b2-bbe2-00ba84c5652a'
);

SELECT id FROM profiles
WHERE id IN (
  'fd3d566d-f1bc-47b1-9196-4bb33271c515',
  '55e39ae6-cf2e-41b2-bbe2-00ba84c5652a'
);
-- Expect: 0 rows.


-- ---- B2. auth.users — NOT a raw SQL DELETE, and NOT part of this transaction. ----
-- Supabase manages auth.users through its own GoTrue auth service —
-- sessions, refresh tokens, and identities in Supabase-internal schemas
-- reference this table outside of what a plain `DELETE FROM auth.users`
-- safely unwinds. The correct, safe removal path is the Supabase Admin
-- API, not raw SQL — which also means it cannot participate in this
-- SQL transaction's COMMIT/ROLLBACK at all. Treat it as a fully separate,
-- independent step, done whenever you choose, via the Admin API:
--
--   await admin.auth.admin.deleteUser('fd3d566d-f1bc-47b1-9196-4bb33271c515');
--   await admin.auth.admin.deleteUser('55e39ae6-cf2e-41b2-bbe2-00ba84c5652a');
--
-- Post-removal verification (run this as a real SELECT once both calls
-- above have been made — safe to include inside or outside this
-- transaction, it's read-only):
SELECT id, email FROM auth.users
WHERE id IN (
  'fd3d566d-f1bc-47b1-9196-4bb33271c515',
  '55e39ae6-cf2e-41b2-bbe2-00ba84c5652a'
);
-- Expect: 0 rows, once the Admin API calls above have actually been run.
-- Inside this transaction, before those calls happen, expect 2 rows —
-- that is correct and not a sign anything went wrong.


-- ============================================================================
-- PART C — FINAL VERIFICATION (review this before deciding COMMIT or ROLLBACK)
-- ============================================================================

-- C1. Remaining counts, whole-table, compare directly against PART A0's
-- "before" numbers above.
SELECT
  (SELECT COUNT(*) FROM claims)             AS claims_remaining,
  (SELECT COUNT(*) FROM ai_runs)            AS ai_runs_remaining,
  (SELECT COUNT(*) FROM files)              AS files_remaining,
  (SELECT COUNT(*) FROM entries)            AS entries_remaining,
  (SELECT COUNT(*) FROM deadlines)          AS deadlines_remaining,
  (SELECT COUNT(*) FROM evidence_items)     AS evidence_items_remaining,
  (SELECT COUNT(*) FROM claim_entitlements) AS claim_entitlements_remaining,
  (SELECT COUNT(*) FROM claim_guarantee)    AS claim_guarantee_remaining;
-- Expected: claims=0, ai_runs=0, files=0, entries=0, deadlines=0,
-- evidence_items=0, claim_entitlements=0, claim_guarantee=0 — every one
-- of these tables goes to zero, because all 3 existing claims (100% of
-- the claims table) were test data. This is expected, not a red flag —
-- but if it surprises you, stop and think it through before committing.

-- C2. camilliab32@gmail.com is untouched — must still exist, unchanged.
SELECT id, email, created_at FROM auth.users
WHERE id = 'dba655da-00e5-4204-9a3b-84e366ded11b';
-- Expect: exactly 1 row, camilliab32@gmail.com, created_at unchanged
-- from before this ran (2026-07-15T11:15:49.038633Z).

-- C3. Your own account remains — must still exist, unchanged.
SELECT id, email, created_at FROM auth.users
WHERE id = '2c98b5cf-902c-48d4-b7c1-f5927dfd6bdc';
-- Expect: exactly 1 row, benjaminhammonds@gmail.com, created_at unchanged
-- from before this ran (2026-07-15T11:15:32.901252Z).

-- C4. Only the three identified test claims were affected — no other
-- claim was ever named in this file, so this is confirmed by construction
-- rather than a separate query: every DELETE FROM claims statement above
-- used exactly the 3 UUIDs listed in this file's header, nothing else.
-- (There is nothing else to query — the table is expected to be empty
-- per C1.)

-- C5. Only the two identified orphaned accounts are scheduled for
-- removal, and only through the Admin API (Part B2), never raw SQL —
-- confirmed by construction: this file contains exactly one auth.users
-- reference list in Part B2, matching only those two UUIDs, with no
-- DELETE statement against auth.users anywhere in this file.


-- ============================================================================
-- DECISION POINT — uncomment exactly ONE of the two lines below and run it
-- as the final statement. Both stay commented until you've reviewed every
-- SELECT result above.
-- ============================================================================

-- COMMIT;
-- ROLLBACK;
