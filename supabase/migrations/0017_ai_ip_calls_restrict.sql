-- Security fix: MEDIUM finding from the 2026-07-24 security review.
-- ai_ip_calls (per-IP rate-limit counter) had `for select to authenticated
-- using (true)` -- any signed-in user could read every other user's IP
-- log. Live-tested: confirmed a second authenticated user could read rows
-- belonging to unrelated accounts.
--
-- Fix: drop both authenticated-role policies. This table is now reachable
-- only via the service-role client, which bypasses RLS by default -- no
-- policy needs to be added for it. src/lib/anthropic/rateLimit.ts was
-- updated in the same change to read/write this table through
-- getAdminClient() instead of the caller's session client, so rate
-- limiting keeps working under this stricter policy.

drop policy if exists "ai_ip_calls: authenticated read" on ai_ip_calls;
drop policy if exists "ai_ip_calls: authenticated insert" on ai_ip_calls;

NOTIFY pgrst, 'reload schema';
