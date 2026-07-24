"use client";

// Duplicate-claim detection (Decision #44) — prompt only, never auto-merge.
// Documentation may contain evidence that can't be recreated; an incorrect
// automated merge could corrupt a real dispute record. These two options
// are the only options — nothing here ever merges claims automatically,
// even as a "smart" convenience feature.
export function DuplicateClaimPrompt({
  onContinueExisting,
  onCreateSeparate,
}: {
  onContinueExisting: () => void;
  onCreateSeparate: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center px-6 z-50">
      <div className="bg-paper max-w-sm w-full rounded-sm border border-ink/15 p-6">
        <p className="text-sm text-ink mb-5">
          You may already have an active claim for this issue. Would you like to
          continue with that claim, or create a separate one?
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onContinueExisting}
            className="bg-ledger text-paper px-4 py-2.5 rounded-sm font-semibold text-sm"
          >
            Continue existing claim
          </button>
          <button
            type="button"
            onClick={onCreateSeparate}
            className="border border-ink/20 px-4 py-2.5 rounded-sm font-semibold text-sm"
          >
            Create separate claim
          </button>
        </div>
      </div>
    </div>
  );
}
