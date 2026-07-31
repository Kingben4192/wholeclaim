"use client";

import { useState, useTransition } from "react";
import { getAccountDeletionSummary, type AccountDeletionSummary } from "./actions";
import { ExportDataButton } from "./ExportDataButton";

// Pre-delete dialog (2026-07-26) -- names exactly what will be lost, with
// real counts for this account, before the irreversible action. Offers a
// last-chance export inline rather than requiring the user to navigate
// away and lose their place. "Permanently delete" stays enabled
// regardless of whether they've exported -- this is an offer, not a gate.
export function DeleteAccountButton() {
  const [confirming, setConfirming] = useState(false);
  const [summary, setSummary] = useState<AccountDeletionSummary | null>(null);
  const [loading, startLoading] = useTransition();

  function open() {
    setConfirming(true);
    startLoading(async () => {
      const result = await getAccountDeletionSummary();
      setSummary(result);
    });
  }

  if (!confirming) {
    return (
      <button type="button" onClick={open} className="text-sm font-semibold text-red-700">
        Delete my account
      </button>
    );
  }

  const hasAnything = summary && (summary.claims > 0 || summary.files > 0 || summary.entries > 0 || summary.deadlines > 0);

  return (
    <div className="flex flex-col gap-3 items-start max-w-sm">
      {loading || !summary ? (
        <p className="text-sm text-ink/60">Checking what&apos;s on your account…</p>
      ) : (
        <>
          <div className="text-sm text-red-700 font-semibold">
            {hasAnything ? (
              <>
                <p className="mb-1">This will permanently delete:</p>
                <ul className="font-normal list-disc list-inside space-y-0.5">
                  {summary.claims > 0 && <li>{summary.claims} claim{summary.claims === 1 ? "" : "s"}</li>}
                  {summary.files > 0 && <li>{summary.files} uploaded file{summary.files === 1 ? "" : "s"}</li>}
                  {summary.entries > 0 && <li>{summary.entries} timeline entr{summary.entries === 1 ? "y" : "ies"}</li>}
                  {summary.deadlines > 0 && <li>{summary.deadlines} deadline{summary.deadlines === 1 ? "" : "s"}</li>}
                </ul>
                <p className="mt-1">This can&apos;t be undone.</p>
              </>
            ) : (
              <p>Your account has no claims, files, entries, or deadlines yet. This can&apos;t be undone.</p>
            )}
          </div>

          {hasAnything && (
            <div className="border-t border-b border-red-700/20 py-3 w-full">
              <p className="text-sm font-semibold text-ink mb-2">Download your documentation before you delete.</p>
              <ExportDataButton />
            </div>
          )}

          <form action="/api/account/delete" method="POST" className="flex flex-col gap-2 items-start w-full">
            {/* Optional, skippable -- analytics instrumentation (metric 7,
                2026-07-31). "Prefer not to say" is the default/first
                option, not required to submit the form. */}
            <label className="flex flex-col gap-1 w-full">
              <span className="text-xs font-semibold text-ink/60">
                Mind sharing why you&apos;re leaving? (optional)
              </span>
              <select
                name="reason"
                defaultValue=""
                className="text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white"
              >
                <option value="">Prefer not to say</option>
                <option value="resolved">Resolved my claim / no longer need it</option>
                <option value="too_expensive">Too expensive</option>
                <option value="missing_feature">Missing a feature I needed</option>
                <option value="confusing">Found it confusing to use</option>
                <option value="privacy">Privacy concerns</option>
                <option value="other">Other</option>
              </select>
            </label>
            <p className="text-sm text-red-700 font-semibold">Type DELETE to confirm.</p>
            <input
              name="confirm"
              required
              pattern="DELETE"
              placeholder="Type DELETE"
              className="text-sm px-3 py-2 rounded-sm border border-red-700/40 bg-white"
            />
            <div className="flex gap-3">
              <button type="submit" className="bg-red-700 text-white px-4 py-2 rounded-sm font-semibold text-sm">
                Permanently delete
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="text-sm text-ink/60"
              >
                Cancel
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
