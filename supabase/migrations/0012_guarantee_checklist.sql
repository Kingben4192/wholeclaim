-- Success Guarantee — fixed checklist tracking + before/after comparison
-- fields (Decision #36, Billing Build Order Step 7 — eligibility
-- foundation only). Refund issuance, automatic execution, and
-- user-facing guarantee marketing copy are explicitly NOT part of this
-- migration or this step; those are deferred to a future, separately
-- reviewed step per the founder's explicit instruction.

alter table claim_guarantee
  add column if not exists step_policy_uploaded boolean not null default false,
  add column if not exists step_loss_timeline_added boolean not null default false,
  add column if not exists step_damage_evidence_added boolean not null default false,
  add column if not exists step_repair_estimates_added boolean not null default false,
  add column if not exists step_documentation_reviewed boolean not null default false,
  add column if not exists final_grade text,
  add column if not exists final_score integer,
  add column if not exists eligibility_checked_at timestamptz;

-- No insert/update RLS policy is added for anon/authenticated here,
-- deliberately — same boundary as claim_entitlements (0011): eligibility
-- and grade fields are exactly the kind of money-adjacent data that must
-- never be directly client-writable. All writes go through server
-- actions using the service-role client (src/lib/guarantee.ts), which
-- perform their own explicit ownership checks in application code first.
-- The existing "claim_guarantee: owner read" policy from 0011 already
-- covers everything the client needs to display checklist progress.
