#!/usr/bin/env node
// Seeds the WholeClaim STAGING Supabase project with entirely synthetic
// test data. Never touches production — see the hard safety check below.
//
// Usage:
//   SUPABASE_STAGING_URL=https://xxxx.supabase.co \
//   SUPABASE_STAGING_SERVICE_ROLE_KEY=xxxx \
//   node scripts/seed-staging.mjs
//
// Prerequisites: all 15 migrations (supabase/migrations/0001..0015) must
// already be applied to the staging project (same manual SQL Editor
// paste-and-run process as production — see supabase/migrations/README.md)
// before this script is run, or every insert below will fail against
// missing tables/columns.
//
// Ten personas, each targeting one specific product state worth being
// able to see rendered — not an exhaustive data set, a rendering/QA set.
// Checklist item labels here are a deliberately simplified duplicate of
// src/lib/scoring/checklistTemplates.ts's content (product copy, not
// scoring logic — safe to duplicate for a seed script; keep loosely in
// sync if that file's wording changes).

import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------
// SAFETY: this script must categorically never run against production.
// ---------------------------------------------------------------------
const PRODUCTION_PROJECT_REF = "hkjqyjhunfbdcnwyjaqd";

const STAGING_URL = process.env.SUPABASE_STAGING_URL;
const STAGING_SERVICE_ROLE_KEY = process.env.SUPABASE_STAGING_SERVICE_ROLE_KEY;

if (!STAGING_URL || !STAGING_SERVICE_ROLE_KEY) {
  console.error(
    "Missing SUPABASE_STAGING_URL / SUPABASE_STAGING_SERVICE_ROLE_KEY env vars. Refusing to run.",
  );
  process.exit(1);
}

if (STAGING_URL.includes(PRODUCTION_PROJECT_REF)) {
  console.error(
    `SAFETY ABORT: SUPABASE_STAGING_URL contains the known PRODUCTION project ref (${PRODUCTION_PROJECT_REF}). ` +
      `This script must never run against production. Aborting without touching anything.`,
  );
  process.exit(1);
}

const admin = createClient(STAGING_URL, STAGING_SERVICE_ROLE_KEY);
const EMAIL_DOMAIN = "wholeclaim-staging.test";

// ---------------------------------------------------------------------
// Tiny embedded placeholder assets — no external file dependencies.
// ---------------------------------------------------------------------
const PLACEHOLDER_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);
const PLACEHOLDER_PDF = Buffer.from(
  "%PDF-1.1\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 72 72]>>endobj\ntrailer<</Root 1 0 R>>",
  "utf8",
);

async function createUser(email) {
  const { data, error } = await admin.auth.admin.createUser({ email, email_confirm: true });
  if (error) throw new Error(`createUser(${email}): ${error.message}`);
  return data.user.id;
}

async function uploadFile(userId, claimId, kind, name) {
  const storagePath = `${userId}/${claimId}/${crypto.randomUUID()}-${name}`;
  const bytes = kind === "photo" ? PLACEHOLDER_PNG : PLACEHOLDER_PDF;
  const contentType = kind === "photo" ? "image/png" : "application/pdf";
  const { error: uploadError } = await admin.storage.from("evidence").upload(storagePath, bytes, { contentType });
  if (uploadError) throw new Error(`storage upload (${name}): ${uploadError.message}`);
  const { data: fileRow, error: insertError } = await admin
    .from("files")
    .insert({ claim_id: claimId, user_id: userId, storage_path: storagePath, kind, original_name: name })
    .select("id")
    .single();
  if (insertError) throw new Error(`files insert (${name}): ${insertError.message}`);
  return fileRow.id;
}

async function addEvidenceItem(userId, claimId, label, category, { checked = false, withFile = false } = {}) {
  let fileId = null;
  if (withFile) {
    fileId = await uploadFile(userId, claimId, category === "evidence_coverage" ? "photo" : "pdf", `${label.slice(0, 20)}.${category === "evidence_coverage" ? "png" : "pdf"}`);
  }
  const { error } = await admin
    .from("evidence_items")
    .insert({ claim_id: claimId, user_id: userId, label, category, checked: checked || withFile, file_id: fileId });
  if (error) throw new Error(`evidence_items insert (${label}): ${error.message}`);
}

async function addEntry(userId, claimId, type, summary, date) {
  const { error } = await admin.from("entries").insert({ claim_id: claimId, user_id: userId, type, summary, date });
  if (error) throw new Error(`entries insert: ${error.message}`);
}

async function addDeadline(userId, claimId, title, dueDate) {
  const { error } = await admin.from("deadlines").insert({ claim_id: claimId, user_id: userId, title, due_date: dueDate });
  if (error) throw new Error(`deadlines insert: ${error.message}`);
}

async function createClaim(userId, fields) {
  const { data, error } = await admin.from("claims").insert({ user_id: userId, ...fields }).select("id").single();
  if (error) throw new Error(`claims insert: ${error.message}`);
  return data.id;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
function daysFromNow(n) {
  return daysAgo(-n);
}

async function main() {
  console.log(`Seeding staging project: ${STAGING_URL}`);

  // 1. Fresh signup, zero claims -- Welcome Flow.
  await createUser(`alice.freshstart@${EMAIL_DOMAIN}`);
  console.log("1. alice.freshstart -- created, no claim (Welcome Flow)");

  // 2. Wizard-created Water claim, checklist ~half done -- progress card mid-way.
  {
    const userId = await createUser(`ben.waterclaim@${EMAIL_DOMAIN}`);
    const claimId = await createClaim(userId, {
      carrier: "State Farm",
      damage_category: "Water / plumbing",
      date_of_loss: daysAgo(20),
      damage_desc: "Washing machine supply line burst, flooded the laundry room and hallway.",
    });
    await addEvidenceItem(userId, claimId, "Full insurance policy (declarations, forms, endorsements)", "documentation_completeness", { withFile: true });
    await addEvidenceItem(userId, claimId, "Contractor or repair estimate", "documentation_completeness", {});
    await addEvidenceItem(userId, claimId, "Wide shot of each affected room or area", "evidence_coverage", { withFile: true });
    await addEvidenceItem(userId, claimId, "Moisture reading documentation", "documentation_completeness", {});
    console.log("2. ben.waterclaim -- Water claim, checklist partially done");
  }

  // 3. Fire claim, fully onboarded, high score -- the "graduated" handoff state.
  {
    const userId = await createUser(`carla.firegrade@${EMAIL_DOMAIN}`);
    const claimId = await createClaim(userId, {
      carrier: "Allstate",
      damage_category: "Fire",
      date_of_loss: daysAgo(60),
      damage_desc: "Kitchen fire from an unattended stovetop, smoke damage throughout first floor.",
    });
    await addEvidenceItem(userId, claimId, "Full insurance policy (declarations, forms, endorsements)", "documentation_completeness", { withFile: true });
    await addEvidenceItem(userId, claimId, "Contractor or repair estimate", "documentation_completeness", { withFile: true });
    await addEvidenceItem(userId, claimId, "Invoices for completed repair work", "documentation_completeness", { withFile: true });
    await addEvidenceItem(userId, claimId, "Wide shot of each affected room or area", "evidence_coverage", { withFile: true });
    await addEvidenceItem(userId, claimId, "Smoke and soot damage photos", "evidence_coverage", { withFile: true });
    await addEntry(userId, claimId, "call", "Initial call with adjuster, claim number confirmed.", daysAgo(58));
    await addEntry(userId, claimId, "email", "Followed up in writing on repair estimate timeline.", daysAgo(45));
    await addEntry(userId, claimId, "note", "Contractor walkthrough completed.", daysAgo(30));
    await addDeadline(userId, claimId, "Proof of loss due", daysFromNow(30));
    console.log("3. carla.firegrade -- Fire claim, high score, progress card should be hidden");
  }

  // 4. Theft claim, nothing filled in -- Theft profile + critical-gap visual state.
  {
    const userId = await createUser(`derek.theftclaim@${EMAIL_DOMAIN}`);
    await createClaim(userId, { carrier: "Liberty Mutual", damage_category: "Theft" });
    console.log("4. derek.theftclaim -- Theft claim, untouched (Theft profile + critical-gap state)");
  }

  // 5. Overdue deadline + a real Consistency Analysis trigger (payment, no doc).
  {
    const userId = await createUser(`elena.overdue@${EMAIL_DOMAIN}`);
    const claimId = await createClaim(userId, {
      carrier: "Progressive",
      damage_category: "Wind / storm",
      date_of_loss: daysAgo(90),
    });
    await addDeadline(userId, claimId, "Appraisal demand deadline", daysAgo(5)); // already overdue
    await addEntry(userId, claimId, "payment", "Received partial payment from carrier.", daysAgo(2)); // no nearby file/evidence item
    console.log("5. elena.overdue -- overdue deadline + unsupported payment entry");
  }

  // 6. Path A (grader-converted): real leads row + baseline_grade + prefilled evidence.
  {
    const email = `frank.fromgrader@${EMAIL_DOMAIN}`;
    const userId = await createUser(email);
    const claimId = await createClaim(userId, {
      carrier: null,
      damage_category: "Water / plumbing",
      us_state: "GA",
      baseline_grade: "C",
    });
    await addEvidenceItem(userId, claimId, "Damage photos / video", "evidence_coverage", { checked: true });
    await addEvidenceItem(userId, claimId, "Written contact log (calls & emails)", "documentation_completeness", { checked: false });
    await admin.from("leads").insert({
      name: "Frank Fromgrader",
      email,
      us_state: "GA",
      grade: "C",
      score: 65,
      answers: { photos: 0, log: 1, damage: 0, suit: 1 },
      consent: true,
      claim_id: claimId,
      claim_prefilled_at: new Date().toISOString(),
      account_created_at: new Date().toISOString(),
    });
    console.log("6. frank.fromgrader -- Path A shape: leads row + baseline_grade + prefilled evidence");
  }

  // 7. Pro via active subscription, Success Guarantee in progress (2/5 done).
  {
    const userId = await createUser(`grace.prosubscriber@${EMAIL_DOMAIN}`);
    await admin.from("profiles").update({ subscription_status: "active" }).eq("id", userId);
    const claimId = await createClaim(userId, { carrier: "USAA", damage_category: "Roof / storm" });
    await admin.from("claim_guarantee").insert({
      claim_id: claimId,
      user_id: userId,
      purchase_type: "subscription",
      initial_grade: "D",
      initial_score: 52,
      step_policy_uploaded: true,
      step_loss_timeline_added: true,
      step_damage_evidence_added: false,
      step_repair_estimates_added: false,
      step_documentation_reviewed: false,
    });
    console.log("7. grace.prosubscriber -- active subscription, guarantee checklist 2/5");
  }

  // 8. Pro via one-time lifetime purchase (distinct code path from #7).
  {
    const userId = await createUser(`henry.lifetimepro@${EMAIL_DOMAIN}`);
    const claimId = await createClaim(userId, { carrier: "Farmers", damage_category: "Hail" });
    await admin.from("claim_entitlements").insert({
      claim_id: claimId,
      user_id: userId,
      status: "active",
      entitlement_type: "lifetime_claim_unlock",
    });
    console.log("8. henry.lifetimepro -- lifetime entitlement, no subscription");
  }

  // 9. Past-due subscription -- confirms grace-period access still grants Pro.
  {
    const userId = await createUser(`iris.pastdue@${EMAIL_DOMAIN}`);
    await admin.from("profiles").update({ subscription_status: "past_due" }).eq("id", userId);
    await createClaim(userId, { carrier: "Nationwide", damage_category: "Mold" });
    console.log("9. iris.pastdue -- past_due subscription (grace period)");
  }

  console.log(
    "\n10. benjaminhammonds+staging@gmail.com -- deliberately NOT created here. " +
      "Test this one manually once staging is deployed: visit the staging site's " +
      "/login, enter that address, and click through the real email to verify the " +
      "actual signup + magic-link flow end-to-end. Pre-creating this account via " +
      "admin API would defeat the point of testing the real first-time path.",
  );

  console.log("\nSeed complete.");
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
