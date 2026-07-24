-- Security fix: HIGH finding from the 2026-07-24 security review.
-- entries/deadlines/evidence_items/files/loss_of_use_expenses only checked
-- `auth.uid() = user_id` on write, never that the referenced claim_id
-- actually belongs to that same user. Live-tested: an authenticated user
-- could insert a row (e.g. a `files` row) pointing claim_id at another
-- user's claim, using only their own user_id — a cross-account data
-- integrity hole (not a read/confidentiality one; storage and the
-- `claims` table's own `using` clause were already correctly scoped).
--
-- ALTER POLICY here only touches WITH CHECK, leaving each policy's USING
-- clause untouched — the read/update/delete scope (auth.uid() = user_id)
-- was already correct and is out of scope for this fix, per approved scope.

alter policy "entries: owner all" on entries
  with check (
    auth.uid() = user_id
    and exists (select 1 from claims c where c.id = claim_id and c.user_id = auth.uid())
  );

alter policy "deadlines: owner all" on deadlines
  with check (
    auth.uid() = user_id
    and exists (select 1 from claims c where c.id = claim_id and c.user_id = auth.uid())
  );

alter policy "evidence_items: owner all" on evidence_items
  with check (
    auth.uid() = user_id
    and exists (select 1 from claims c where c.id = claim_id and c.user_id = auth.uid())
  );

alter policy "files: owner all" on files
  with check (
    auth.uid() = user_id
    and exists (select 1 from claims c where c.id = claim_id and c.user_id = auth.uid())
  );

alter policy "loss_of_use_expenses: owner all" on loss_of_use_expenses
  with check (
    auth.uid() = user_id
    and exists (select 1 from claims c where c.id = claim_id and c.user_id = auth.uid())
  );

NOTIFY pgrst, 'reload schema';
