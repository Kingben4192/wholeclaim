-- Documentation Coverage Gaps -- three small, additive changes approved
-- together (founder brief 2026-07-25): before/after photo tagging,
-- structured communication-log fields, and (no schema change needed) a
-- disposal-permission checklist item.

-- 1. Before/After Photo Tags -- nullable, no backfill, existing files stay
-- untagged (same precedent as evidence_items.category in 0014).
alter table files
  add column if not exists evidence_stage text
  check (evidence_stage in (
    'Before Loss',
    'Immediately After Loss',
    'During Mitigation',
    'During Repairs',
    'Completed Repairs',
    'Other'
  ));

-- 2. Structured Communication Log -- five nullable columns, no backfill.
-- The existing freeform type/contact/summary fields are untouched; these
-- are only populated when the new structured entry types are used.
alter table entries
  add column if not exists contact_time text,
  add column if not exists contact_company text,
  add column if not exists contact_method text,
  add column if not exists commitments text,
  add column if not exists follow_up_date date;

-- entries.type CHECK widened additively: the original 7 values
-- ('call','email','visit','photo','letter','payment','note') stay valid
-- exactly as today; 4 new structured-entry values are added ('phone_call',
-- 'text','inspection','voicemail' -- 'email' is reused as-is for the new
-- structured Email type rather than duplicated).
--
-- The original constraint was declared inline in 0001_init.sql with no
-- explicit name, so its real (Postgres-auto-generated) name is looked up
-- dynamically rather than assumed. This lookup is scoped precisely to
-- constraints that actually reference the `type` column -- via
-- pg_constraint.conkey matched against the column's real attnum, not a
-- LIKE match on the constraint's rendered definition text (which would
-- only be a fragile substring check, not a real guarantee it's scoped to
-- the right column). Loops over every matching constraint, not just the
-- first, in case more than one ever ends up referencing this column.
do $$
declare
  con record;
  type_attnum smallint;
begin
  select attnum into type_attnum
  from pg_attribute
  where attrelid = 'entries'::regclass
    and attname = 'type'
    and not attisdropped;

  for con in
    select conname
    from pg_constraint
    where conrelid = 'entries'::regclass
      and contype = 'c'
      and type_attnum = any(conkey)
  loop
    execute format('alter table entries drop constraint %I', con.conname);
  end loop;
end $$;

alter table entries
  add constraint entries_type_check
  check (type in (
    'call', 'email', 'visit', 'photo', 'letter', 'payment', 'note',
    'phone_call', 'text', 'inspection', 'voicemail'
  ));

NOTIFY pgrst, 'reload schema';
