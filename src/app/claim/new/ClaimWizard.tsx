"use client";

import { useMemo, useState } from "react";
import { useRouter, unstable_rethrow } from "next/navigation";
import { createClaim, checkClaimCategoryAccessAction } from "../actions";
import { checklistTemplateFor } from "@/lib/scoring/checklistTemplates";
import { CLAIM_CATEGORIES } from "@/lib/claimCategories";
import { DuplicateClaimPrompt } from "./DuplicateClaimPrompt";
import { UpgradeOptions } from "../[id]/UpgradeOptions";

// Claim Creation Wizard (Onboarding Step 4). Single client component,
// internal step state, no additional routes — /claim/new's page.tsx just
// renders this. All data lives in React state for the lifetime of the
// component (Back/Next never lose anything already typed); the server
// only sees data once, on final submit, through the SAME createClaim
// server action the flat form always used — no parallel claim-creation
// logic, no draft rows, no partial saves.
//
// checklistTemplateFor() is safe to import here: it depends only on
// claimTypeProfile.ts (pure lookup data), never on documentationScore.ts's
// scoring formulas — see that module's header comment for why this
// separation exists. No weights, points, or grades are computed or
// referenced anywhere in this file.
//
// Carrier / claim number / policy number / state are collected in an
// optional, collapsed-by-default "Additional Claim Details" section on
// the last step (native <details>, no extra JS) — not its own required
// step. These were never removed from createClaim's own formData
// handling, so this is purely a UI addition.
//
// Step 1 (Decision #44, free-plan claim limits) — dispute category, a
// DIFFERENT axis from Step 4's "Claim type" (damage_category, a loss-cause
// taxonomy feeding Documentation Score checklist seeding). Placed first,
// not last, so a user who's about to be prompted/blocked finds out
// immediately rather than after filling out the whole form.
//
// The Next/Submit button pair below has explicit, distinct `key`s
// (2026-07-22, reported: step 4 auto-submitting before it could be
// interacted with). Without a differentiating key, the two branches of
// that ternary sit in the same JSX position and React can reuse the same
// underlying DOM <button> node across the type="button" -> type="submit"
// transition, patching its type in place rather than mounting a fresh
// element. In that shape, the same click that advances one step to the
// next can also fire the button's now-mutated native submit behavior. Not
// confirmed as the exact cause (three separate live reproduction attempts
// didn't trigger it), but it's a real, well-documented category of bug and
// this fix removes the underlying risk outright regardless.

const DAMAGE_CATEGORY_OPTIONS = [
  "Water / plumbing",
  "Roof / storm",
  "Hail",
  "Wind / storm",
  "Fire",
  "Mold",
  "Theft",
  "Other",
];

type WizardData = {
  claim_category: string;
  damage_desc: string;
  date_of_loss: string;
  date_discovered: string;
  damage_category: string;
  carrier: string;
  claim_number: string;
  policy_number: string;
  us_state: string;
};

const STEP_LABELS = [
  "Dispute category",
  "What happened",
  "When it happened",
  "Claim type",
  "Available documentation",
];
const LAST_STEP = STEP_LABELS.length;

type BlockedGate = { reason: "ACTIVE_CLAIM_EXISTS_IN_CATEGORY" | "CATEGORY_HISTORY_EXISTS"; blockingClaimIds: string[] };

export function ClaimWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [duplicateActiveClaimId, setDuplicateActiveClaimId] = useState<string | null>(null);
  const [blockedGate, setBlockedGate] = useState<BlockedGate | null>(null);
  const [data, setData] = useState<WizardData>({
    claim_category: "",
    damage_desc: "",
    date_of_loss: "",
    date_discovered: "",
    damage_category: "",
    carrier: "",
    claim_number: "",
    policy_number: "",
    us_state: "",
  });
  const [availableLabels, setAvailableLabels] = useState<Set<string>>(new Set());

  const checklistPreview = useMemo(
    () => checklistTemplateFor(data.damage_category || null),
    [data.damage_category],
  );

  function update<K extends keyof WizardData>(key: K, value: WizardData[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  function toggleAvailable(label: string) {
    setAvailableLabels((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  function validateStep(n: number): string | null {
    if (n === 1 && data.claim_category.trim().length === 0) {
      return "Select a dispute category before continuing.";
    }
    if (n === 2 && data.damage_desc.trim().length === 0) {
      return "Describe what happened before continuing.";
    }
    if (n === 3 && data.date_of_loss.trim().length === 0) {
      return "Enter the date of loss before continuing.";
    }
    if (n === 4 && data.damage_category.trim().length === 0) {
      return "Select a claim type before continuing.";
    }
    return null;
  }

  async function next() {
    const validationError = validateStep(step);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);

    // Leaving Step 1: a lighter existence check, independent of plan tier
    // — this is a data-integrity safeguard against accidental duplicate
    // documentation, not the free-plan limit itself (that's enforced
    // separately, at final submit and again server-side in createClaim).
    if (step === 1) {
      setChecking(true);
      const result = await checkClaimCategoryAccessAction(data.claim_category);
      setChecking(false);
      if (result.ok && result.activeClaimId) {
        setDuplicateActiveClaimId(result.activeClaimId);
        return;
      }
    }

    setStep((s) => Math.min(s + 1, LAST_STEP));
  }

  function back() {
    setError(null);
    setBlockedGate(null);
    setStep((s) => Math.max(s - 1, 1));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const validationError = validateStep(LAST_STEP);
    if (validationError) {
      setError(validationError);
      return;
    }

    const formEl = e.currentTarget;
    const formData = new FormData(formEl);

    setSubmitting(true);
    setError(null);
    setBlockedGate(null);

    // Fresh, authoritative re-check — Step 1's check may be stale by now
    // (another tab, time passed). This is still only advisory: createClaim
    // re-runs the identical gate server-side regardless, so a bypassed or
    // stale check here can never itself create an over-limit claim.
    const preflight = await checkClaimCategoryAccessAction(data.claim_category);
    if (preflight.ok && !preflight.gate.allowed) {
      setSubmitting(false);
      setBlockedGate({ reason: preflight.gate.reason, blockingClaimIds: preflight.gate.blockingClaimIds });
      return;
    }

    try {
      const result = await createClaim(formData);
      router.push(`/claim/${result.id}`);
    } catch (err) {
      // Server Actions invoked directly from client code (not via a plain
      // <form action={...}>) need this: redirect()/notFound() throw a
      // special tagged error Next's own boundary must handle, which a
      // plain catch here would otherwise misreport as a failure.
      // createClaim no longer calls redirect() itself, but re-throwing any
      // Next-internal control-flow error here is the correct defensive
      // default regardless of what the action currently does.
      unstable_rethrow(err);
      setSubmitting(false);
      setError(err instanceof Error ? err.message : "Could not create claim. Try again.");
    }
  }

  return (
    <main className="max-w-md mx-auto px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-wider text-ink/50 mb-2">
        Step {step} of {LAST_STEP} — {STEP_LABELS[step - 1]}
      </p>
      <h1 className="font-display text-2xl font-extrabold mb-8">Start your claim file</h1>

      {duplicateActiveClaimId && (
        <DuplicateClaimPrompt
          onContinueExisting={() => router.push(`/claim/${duplicateActiveClaimId}`)}
          onCreateSeparate={() => {
            setDuplicateActiveClaimId(null);
            setStep((s) => Math.min(s + 1, LAST_STEP));
          }}
        />
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Step 1 — Dispute category */}
        {step === 1 ? (
          <label className="block">
            <span className="block text-xs font-semibold uppercase tracking-wider mb-1 text-ink/60">
              Dispute category
            </span>
            <select
              name="claim_category"
              value={data.claim_category}
              onChange={(e) => update("claim_category", e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white"
            >
              <option value="">Select a category</option>
              {CLAIM_CATEGORIES.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <input type="hidden" name="claim_category" value={data.claim_category} />
        )}

        {/* Step 2 — What happened? */}
        {step === 2 ? (
          <label className="block">
            <span className="block text-xs font-semibold uppercase tracking-wider mb-1 text-ink/60">
              What happened?
            </span>
            <textarea
              name="damage_desc"
              value={data.damage_desc}
              onChange={(e) => update("damage_desc", e.target.value)}
              rows={5}
              placeholder="Describe the loss in your own words — what happened, where, and anything else worth noting."
              className="w-full text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white"
            />
          </label>
        ) : (
          <input type="hidden" name="damage_desc" value={data.damage_desc} />
        )}

        {/* Step 3 — When did it happen? */}
        {step === 3 ? (
          <>
            <Field
              label="Date of loss"
              name="date_of_loss"
              type="date"
              value={data.date_of_loss}
              onChange={(v) => update("date_of_loss", v)}
            />
            <Field
              label="Date discovered (if different)"
              name="date_discovered"
              type="date"
              value={data.date_discovered}
              onChange={(v) => update("date_discovered", v)}
            />
          </>
        ) : (
          <>
            <input type="hidden" name="date_of_loss" value={data.date_of_loss} />
            <input type="hidden" name="date_discovered" value={data.date_discovered} />
          </>
        )}

        {/* Step 4 — Claim type */}
        {step === 4 ? (
          <label className="block">
            <span className="block text-xs font-semibold uppercase tracking-wider mb-1 text-ink/60">
              Claim type
            </span>
            <select
              name="damage_category"
              value={data.damage_category}
              onChange={(e) => update("damage_category", e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white"
            >
              <option value="">Select a claim type</option>
              {DAMAGE_CATEGORY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <input type="hidden" name="damage_category" value={data.damage_category} />
        )}

        {/* Step 5 — Available documentation */}
        {step === 5 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-ink/60">
              What do you already have?
            </p>
            <p className="text-xs text-ink/50 mb-3">
              Check off anything you already have on hand — everything else
              becomes a checklist item you can fill in later.
            </p>
            <div className="border border-ink/15 rounded-sm divide-y divide-ink/10">
              {checklistPreview.map((item) => (
                <label
                  key={item.label}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={availableLabels.has(item.label)}
                    onChange={() => toggleAvailable(item.label)}
                    className="w-4 h-4 accent-current text-ledger shrink-0"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>

            <details className="border border-ink/15 rounded-sm px-3 py-2.5 mt-4">
              <summary className="text-sm font-semibold cursor-pointer">
                Additional Claim Details (Optional)
              </summary>
              <div className="flex flex-col gap-3 mt-3">
                <Field
                  label="Insurance carrier"
                  name="carrier"
                  value={data.carrier}
                  onChange={(v) => update("carrier", v)}
                />
                <Field
                  label="Claim number"
                  name="claim_number"
                  mono
                  value={data.claim_number}
                  onChange={(v) => update("claim_number", v)}
                />
                <Field
                  label="Policy number"
                  name="policy_number"
                  mono
                  value={data.policy_number}
                  onChange={(v) => update("policy_number", v)}
                />
                <Field
                  label="State"
                  name="us_state"
                  value={data.us_state}
                  onChange={(v) => update("us_state", v)}
                />
              </div>
            </details>
          </div>
        )}
        <input type="hidden" name="available_labels" value={JSON.stringify([...availableLabels])} />

        {error && <p className="text-sm text-red-700">{error}</p>}

        {blockedGate && (
          <div className="border border-red-200 bg-red-50 rounded-sm p-4 text-sm flex flex-col gap-3">
            <p className="text-red-800 font-semibold">
              {blockedGate.reason === "ACTIVE_CLAIM_EXISTS_IN_CATEGORY"
                ? "You already have an active claim in this category."
                : "You've already used your free claim for this category."}
            </p>
            <p className="text-ink/70">
              Upgrade to WholeClaim Pro to manage unlimited property documentation workflows.
            </p>
            <UpgradeOptions lifetimeRedirectHref={`/claim/${blockedGate.blockingClaimIds[0]}`} />
          </div>
        )}

        <div className="flex items-center gap-3 mt-2">
          {step > 1 && (
            <button
              type="button"
              onClick={back}
              className="text-sm font-semibold text-ink/60 px-4 py-3"
            >
              Back
            </button>
          )}
          {step < LAST_STEP ? (
            <button
              key="next"
              type="button"
              onClick={next}
              disabled={checking}
              className="flex-1 bg-ledger text-paper px-6 py-3 rounded-sm font-semibold text-sm disabled:opacity-50"
            >
              {checking ? "Checking…" : "Next"}
            </button>
          ) : (
            <button
              key="submit"
              type="submit"
              disabled={submitting}
              className="flex-1 bg-ledger text-paper px-6 py-3 rounded-sm font-semibold text-sm disabled:opacity-50"
            >
              {submitting ? "Creating…" : "Create my claim file"}
            </button>
          )}
        </div>
      </form>
    </main>
  );
}

function Field({
  label,
  name,
  type = "text",
  mono = false,
  value,
  onChange,
}: {
  label: string;
  name: string;
  type?: string;
  mono?: boolean;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold uppercase tracking-wider mb-1 text-ink/60">{label}</span>
      <input
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white ${mono ? "font-mono" : ""}`}
      />
    </label>
  );
}
