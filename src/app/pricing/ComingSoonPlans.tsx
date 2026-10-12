"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { joinWaitlist } from "./actions";
import { WAITLIST_PLANS, MAX_WAITLIST_UNITS } from "@/lib/waitlist";

type Status = { kind: "idle" } | { kind: "saving" } | { kind: "done"; message: string } | { kind: "error"; message: string };

function WaitlistCard({ plan }: { plan: (typeof WAITLIST_PLANS)[number] }) {
  const [email, setEmail] = useState("");
  const [units, setUnits] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ kind: "saving" });
    const result = await joinWaitlist({ email, plan: plan.id, units, website }).catch(() => null);
    if (!result) {
      setStatus({ kind: "error", message: "Couldn't save that. Check the email and try again." });
    } else if (result.ok) {
      setStatus({
        kind: "done",
        message: result.alreadyJoined
          ? "You're already on this list."
          : "You're on the list. We'll email you when it opens.",
      });
    } else {
      setStatus({ kind: "error", message: result.error });
    }
  }

  const fieldId = (name: string) => `waitlist-${plan.id}-${name}`;

  return (
    <div className="border border-ink/15 rounded-sm p-5 flex flex-col gap-3 bg-paper">
      <div>
        <div className="font-display font-bold text-sm">{plan.name}</div>
        <div className="font-mono text-sm text-ink/70 mt-1">{plan.price}</div>
      </div>
      <p className="text-sm text-ink/60 flex-1">{plan.description}</p>
      {status.kind === "done" ? (
        <p className="text-sm font-semibold text-ledger" role="status">
          {status.message}
        </p>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-2">
          <label htmlFor={fieldId("email")} className="text-xs font-semibold">
            Email
          </label>
          <input
            id={fieldId("email")}
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white"
          />
          {plan.asksUnits && (
            <>
              <label htmlFor={fieldId("units")} className="text-xs font-semibold">
                Number of units
              </label>
              <input
                id={fieldId("units")}
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_WAITLIST_UNITS}
                step={1}
                required
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                className="text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white"
              />
            </>
          )}
          {/* Hidden from people; bots that fill it in are ignored. */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="hidden"
          />
          <button
            type="submit"
            disabled={status.kind === "saving"}
            className="inline-flex items-center justify-center gap-2 border-2 border-ledger text-ledger px-4 py-2 rounded-sm font-semibold text-sm disabled:opacity-50"
          >
            {status.kind === "saving" && <Loader2 size={14} className="animate-spin" />}
            Join the waitlist
          </button>
          {status.kind === "error" && (
            <p className="text-xs text-red-700" role="alert">
              {status.message}
            </p>
          )}
        </form>
      )}
    </div>
  );
}

// Decision #133: shown below the buyable Pro plan. Nothing here can be
// purchased; every price is labeled planned.
export function ComingSoonPlans() {
  return (
    <section className="mb-16" aria-labelledby="coming-soon-heading">
      <h2 id="coming-soon-heading" className="font-display text-xl font-extrabold mb-1">
        Coming soon
      </h2>
      <p className="text-sm text-ink/60 mb-1">
        These plans aren&apos;t available yet. Join a waitlist and we&apos;ll email you once, when it opens.
      </p>
      <p className="text-xs font-mono uppercase tracking-[0.12em] text-ink/50 mb-5">
        Planned pricing — may change at launch
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {WAITLIST_PLANS.map((plan) => (
          <WaitlistCard key={plan.id} plan={plan} />
        ))}
      </div>
      <p className="text-xs text-ink/50 mt-4">
        We&apos;ll only use your email to tell you when this plan opens.{" "}
        <Link href="/privacy" className="underline">
          Privacy Policy
        </Link>
      </p>
    </section>
  );
}
