import { createClaim } from "../actions";

export default function NewClaimPage() {
  return (
    <main className="max-w-md mx-auto px-6 py-16">
      <h1 className="font-display text-2xl font-extrabold mb-8">
        Start your claim file
      </h1>
      <form action={createClaim} className="flex flex-col gap-4">
        <Field label="Carrier" name="carrier" />
        <Field label="Claim number" name="claim_number" mono />
        <Field label="Policy number" name="policy_number" mono />
        <Field label="Date of loss" name="date_of_loss" type="date" />
        <label className="block">
          <span className="block text-xs font-semibold uppercase tracking-wider mb-1 text-ink/60">
            Damage category
          </span>
          <select
            name="damage_category"
            defaultValue="Water / plumbing"
            className="w-full text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white"
          >
            <option>Water / plumbing</option>
            <option>Roof / storm</option>
            <option>Hail</option>
            <option>Wind / storm</option>
            <option>Fire</option>
            <option>Mold</option>
          </select>
        </label>
        <Field label="State" name="us_state" />
        <button
          type="submit"
          className="bg-ledger text-paper px-6 py-3 rounded-sm font-semibold text-sm mt-2"
        >
          Create my file
        </button>
      </form>
    </main>
  );
}

function Field({
  label,
  name,
  type = "text",
  mono = false,
}: {
  label: string;
  name: string;
  type?: string;
  mono?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold uppercase tracking-wider mb-1 text-ink/60">
        {label}
      </span>
      <input
        type={type}
        name={name}
        className={`w-full text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white ${
          mono ? "font-mono" : ""
        }`}
      />
    </label>
  );
}
