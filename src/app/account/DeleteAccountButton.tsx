"use client";

import { useState } from "react";

export function DeleteAccountButton() {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-sm font-semibold text-red-700"
      >
        Delete my account
      </button>
    );
  }

  return (
    <form action="/api/account/delete" method="POST" className="flex flex-col gap-2 items-start">
      <p className="text-sm text-red-700 font-semibold">
        This permanently deletes every claim, entry, deadline, and uploaded
        file. There is no undo. Type DELETE to confirm.
      </p>
      <input
        name="confirm"
        required
        pattern="DELETE"
        placeholder="Type DELETE"
        className="text-sm px-3 py-2 rounded-sm border border-red-700/40 bg-white"
      />
      <div className="flex gap-3">
        <button
          type="submit"
          className="bg-red-700 text-white px-4 py-2 rounded-sm font-semibold text-sm"
        >
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
  );
}
