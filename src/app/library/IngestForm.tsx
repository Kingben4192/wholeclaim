"use client";

import { useActionState } from "react";
import { ingestDraft } from "./actions";

type State = { error?: string };
const initialState: State = {};

export function IngestForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: State, formData: FormData) => {
      try {
        await ingestDraft(formData);
        return {};
      } catch (err) {
        return { error: err instanceof Error ? err.message : "Something went wrong." };
      }
    },
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <textarea
        name="raw"
        required
        rows={6}
        placeholder="Paste a statute, code section, price data, or procedure — the model structures it into draft entries for your review. Nothing here influences any analysis until you approve it."
        className="w-full text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white"
      />
      <button
        type="submit"
        disabled={pending}
        className="self-start bg-ledger text-paper px-4 py-2 rounded-sm font-semibold text-sm disabled:opacity-50"
      >
        {pending ? "Structuring…" : "Structure into draft entries"}
      </button>
      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
    </form>
  );
}
