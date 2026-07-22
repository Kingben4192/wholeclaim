"use client";

import { useMemo, useState } from "react";
import { createClaim } from "../actions";
import { checklistTemplateFor } from "@/lib/scoring/checklistTemplates";

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
// Step 4 (native <details>, no extra JS) — not a 5th required step. These
// were never removed from createClaim's own formData handling, so this is
// purely a UI addition.

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
  damage_desc: string;
  date_of_loss: string;
  date_discovered: string;
  damage_category: string;
  carrier: string;
  claim_number: string;
  policy_number: string;
  us_state: string;
};

const STEP_LABELS = ["What happened", "When it happened", "Claim type", "Available documentation"];

export function ClaimWizard() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<WizardData>({
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
    if (n === 1 && data.damage_desc.trim().length === 0) {
      return "Describe what happened before continuing.";
    }
    if (n === 2 && data.date_of_loss.trim().length === 0) {
      return "Enter the date of loss before continuing.";
    }
    if (n === 3 && data.damage_category.trim().length === 0) {
      return "Select a claim type before continuing.";
    }
    return null;
  }

  function next() {
    const validationError = validateStep(step);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, 4));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 1));
  }

  return (
    <main className="max-w-md mx-auto px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-wider text-ink/50 mb-2">
        Step {step} of 4 — {STEP_LABELS[step - 1]}
      </p>
      <h1 className="font-display text-2xl font-extrabold mb-8">Start your claim file</h1>

      <form action={createClaim} className="flex flex-col gap-4">
        {/* Step 1 — What happened? */}
        {step === 1 ? (
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

        {/* Step 2 — When did it happen? */}
        {step === 2 ? (
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

        {/* Step 3 — Claim type */}
        {step === 3 ? (
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

        {/* Step 4 — Available documentation */}
        {step === 4 && (
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
          {step < 4 ? (
            <button
              type="button"
              onClick={next}
              className="flex-1 bg-ledger text-paper px-6 py-3 rounded-sm font-semibold text-sm"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              className="flex-1 bg-ledger text-paper px-6 py-3 rounded-sm font-semibold text-sm"
            >
              Create my claim file
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
