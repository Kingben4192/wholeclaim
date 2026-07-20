-- Lead consent, unsubscribe, and tips-sequence tracking (2026-07-19).
-- The grader's consent checkbox was found to have no backing system at
-- all: consent was checked server-side but never persisted, no unsubscribe
-- mechanism existed despite the checkbox claiming one, and no tip-email
-- sequence existed to unsubscribe FROM. This migration is Phase 1 of the
-- fix — schema only. Phase 5 (the actual scheduled sender) is explicitly
-- gated on separate copy approval and is not part of this migration.

alter table leads
  add column if not exists consent boolean not null default false,
  add column if not exists unsubscribed boolean not null default false,
  add column if not exists unsubscribed_at timestamptz,
  -- gen_random_uuid() is already used throughout this schema (every
  -- table's `id` column), so the extension providing it is confirmed
  -- available — reused here rather than assuming pgcrypto's
  -- gen_random_bytes() is enabled. It's volatile, so ADD COLUMN with this
  -- default computes a distinct random token per existing row, not one
  -- shared value — every current lead gets its own real token, not a
  -- placeholder.
  add column if not exists unsubscribe_token text not null unique default gen_random_uuid()::text,
  add column if not exists tips_stage integer not null default 0,
  add column if not exists last_tip_sent_at timestamptz;

-- No new RLS policy is added here. The unsubscribe update (Phase 3) uses
-- the service-role client, scoped by an exact match on the random token —
-- the same pattern already used elsewhere in this codebase for actions an
-- anonymous, unauthenticated visitor needs to trigger safely (e.g.
-- claim_entitlements, checkUploadAccess). The existing "leads: owner
-- update by email" policy (0008) requires an authenticated session and
-- does not apply to someone clicking a link from an email while logged
-- out — deliberately not touched here.
