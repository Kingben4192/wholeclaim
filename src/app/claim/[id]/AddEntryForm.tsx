"use client";

import { useState } from "react";

// Structured Communication Log (Documentation Coverage Gaps, 2026-07-25) --
// wraps the original freeform type/contact/summary fields unchanged. When
// one of the new structured types is selected, five more optional inputs
// appear; for the original 7 types the form behaves exactly as it did
// before this change, submitting nothing new. Still a plain server-action
// form (no onSubmit/fetch) -- only the field visibility is client-side.
const STRUCTURED_TYPES = new Set(["phone_call", "email", "text", "inspection", "voicemail"]);

export function AddEntryForm({
  action,
}: {
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [type, setType] = useState("call");
  const structured = STRUCTURED_TYPES.has(type);

  return (
    <form action={action} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <select
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white"
        >
          <option value="call">Call</option>
          <option value="email">Email</option>
          <option value="visit">Visit</option>
          <option value="photo">Photo</option>
          <option value="letter">Letter</option>
          <option value="payment">Payment</option>
          <option value="note">Note</option>
          <option value="phone_call">Phone Call (structured)</option>
          <option value="text">Text (structured)</option>
          <option value="inspection">Inspection (structured)</option>
          <option value="voicemail">Voicemail (structured)</option>
        </select>
        <input
          name="contact"
          placeholder="Who"
          className="flex-1 text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white"
        />
      </div>

      {structured && (
        <div className="flex flex-col gap-2 border border-ink/10 rounded-sm p-3 bg-neutral-50">
          <div className="flex gap-2">
            <input
              name="contact_time"
              type="time"
              placeholder="Time"
              className="flex-1 text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white"
            />
            <input
              name="contact_company"
              placeholder="Company"
              className="flex-1 text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white"
            />
          </div>
          <input
            name="contact_method"
            placeholder="Phone or email"
            className="text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white"
          />
          <input
            name="commitments"
            placeholder="Commitments made (optional)"
            className="text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white"
          />
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-ink/60">Follow-up date (optional)</span>
            <input
              name="follow_up_date"
              type="date"
              className="text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white"
            />
          </label>
        </div>
      )}

      <textarea
        name="summary"
        required
        placeholder="What happened"
        rows={2}
        className="text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white"
      />
      <button className="self-start bg-ledger text-paper px-4 py-2 rounded-sm font-semibold text-sm">
        Log entry
      </button>
    </form>
  );
}
