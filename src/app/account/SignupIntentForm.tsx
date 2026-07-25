import { cookies } from "next/headers";
import { CLAIM_CATEGORIES } from "@/lib/claimCategories";
import { ACQUISITION_SOURCES, isAcquisitionSource } from "@/lib/acquisitionSource";
import { saveSignupIntent } from "./actions";

// Signup Category + Acquisition Source Tracking (Decision #45) — shown once,
// gated purely on !profile.signup_category (src/app/account/page.tsx),
// deliberately decoupled from WelcomeFlow's own claim-count gate so it
// covers both signup paths: a direct signup sees this before WelcomeFlow;
// a grader-converted user (who never hits WelcomeFlow's zero-claims gate)
// sees this on whatever their first /account visit turns out to be.
export async function SignupIntentForm() {
  const cookieStore = await cookies();
  const attributionCookie = cookieStore.get("wc_attribution")?.value;
  let suggestedSource: string | null = null;
  if (attributionCookie) {
    try {
      const parsed = JSON.parse(attributionCookie) as { source?: string };
      if (isAcquisitionSource(parsed.source)) suggestedSource = parsed.source;
    } catch {
      suggestedSource = null;
    }
  }

  return (
    <div className="rounded-xl border border-neutral-200 p-6 bg-gradient-to-br from-neutral-50 to-white flex flex-col gap-6">
      <div>
        <p className="text-xs font-medium uppercase text-neutral-500 mb-1">
          Before we get started
        </p>
        <h1 className="font-display text-2xl font-extrabold">What brings you to WholeClaim?</h1>
      </div>

      <form action={saveSignupIntent} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-ink">What are you dealing with?</span>
          <select
            name="signup_category"
            required
            defaultValue=""
            className="w-full text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white"
          >
            <option value="" disabled>
              Select a category
            </option>
            {CLAIM_CATEGORIES.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-ink">
            How did you hear about us? <span className="font-normal text-ink/50">(optional)</span>
          </span>
          <select
            name="referral_source"
            defaultValue={suggestedSource ?? ""}
            className="w-full text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white"
          >
            <option value="">Prefer not to say</option>
            {ACQUISITION_SOURCES.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="self-start bg-ledger text-paper px-6 py-3 rounded-sm font-semibold text-sm"
        >
          Continue
        </button>
      </form>
    </div>
  );
}
