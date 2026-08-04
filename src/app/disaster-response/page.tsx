import type { Metadata } from "next";
import Link from "next/link";
import { PublicPageHeader } from "@/app/_components/PublicPageHeader";
import { CHECKLISTS } from "@/lib/checklists";
import { UNIVERSAL_DISCLAIMER } from "@/lib/anthropic/outputFilter";

export const metadata: Metadata = {
  title: "Disaster Response Center | WholeClaim",
  description:
    "If disaster just hit your home, start here — documentation checklists for water, fire, wind & hail, and theft damage.",
};

const FIRST_24_HOURS = [
  "Address safety first, before documenting anything",
  "Document before cleanup or repair begins, whenever it's safe to do so",
  "Contact your insurer to report what happened",
  "Save receipts for anything you purchase or pay for",
  "Avoid discarding damaged items prematurely — document them first",
];

const WHAT_NOT_TO_DO = [
  "Don't throw away damaged items before they're documented",
  "Don't rely on a verbal-only report — put what happened in writing",
  "Don't skip photos before temporary repairs (tarps, board-ups, water extraction)",
];

// Disaster Response Center hub (Decision #96, spec section 1). Public,
// no auth required -- same anonymous-first pattern as the Claim Readiness
// Check and Claim Grade. State-agnostic for v1, per the spec's own scope
// call (no state-select complexity yet).
export default async function DisasterResponsePage() {
  return (
    <main className="min-h-screen flex flex-col">
      <PublicPageHeader />

      {/* Hero */}
      <div className="bg-hp-pine px-6 py-14">
        <div className="max-w-3xl mx-auto">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-hp-sage">
            Disaster Response Center
          </span>
          <h1 className="font-display text-3xl font-extrabold text-white mt-2 mb-6 text-balance">
            If disaster just hit your home, start here.
          </h1>
          <div className="flex flex-wrap gap-2 mb-6">
            {CHECKLISTS.map((c) => (
              <Link
                key={c.slug}
                href={`#${c.slug}`}
                className="text-xs font-mono border border-white/30 text-white rounded-full px-3.5 py-1.5 hover:bg-white/10 transition-colors"
              >
                {c.eventType}
              </Link>
            ))}
          </div>

          {/* Disclaimer, above the fold per spec -- emergency-use context */}
          <div className="border-2 border-white/40 bg-white/10 rounded-sm px-4 py-3 text-sm text-white">
            {UNIVERSAL_DISCLAIMER}
          </div>
        </div>
      </div>

      <div className="max-w-3xl w-full mx-auto px-6 py-14">
        {/* First 24 Hours */}
        <section className="mb-14">
          <h2 className="font-display text-xs font-bold uppercase tracking-[0.1em] text-ink/60 mb-4">
            The First 24 Hours
          </h2>
          <p className="text-sm text-ink/70 leading-relaxed mb-4">
            These steps apply no matter what kind of damage you&rsquo;re dealing with.
          </p>
          <ol className="flex flex-col gap-2">
            {FIRST_24_HOURS.map((step, i) => (
              <li key={step} className="flex items-start gap-3 text-sm text-ink leading-relaxed">
                <span className="shrink-0 font-mono text-xs font-semibold text-ledger mt-0.5">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </section>

        {/* Event-specific cards */}
        <section className="mb-14">
          <h2 className="font-display text-xs font-bold uppercase tracking-[0.1em] text-ink/60 mb-4">
            Find Your Checklist
          </h2>
          <div className="flex flex-col gap-3">
            {CHECKLISTS.map((c) => (
              <div key={c.slug} id={c.slug} className="border border-ink/15 rounded-sm px-4 py-4 scroll-mt-20">
                <span className="font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-ledger">
                  {c.eventType}
                </span>
                <p className="font-display font-bold text-sm mt-1 mb-1.5">{c.title}</p>
                <p className="text-sm text-ink/70 leading-relaxed mb-3">{c.description}</p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/resources/${c.slug}`}
                    className="text-sm font-semibold text-ledger"
                  >
                    View checklist →
                  </Link>
                  <a
                    href={`/checklists/${c.pdfFile}`}
                    download
                    className="text-sm font-semibold text-ledger"
                  >
                    Download PDF →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* What NOT to do */}
        <section className="mb-14">
          <h2 className="font-display text-xs font-bold uppercase tracking-[0.1em] text-ink/60 mb-4">
            What NOT to Do
          </h2>
          <div className="border-2 border-hp-stamp/30 bg-hp-stamp/5 rounded-sm px-4 py-4">
            <ul className="flex flex-col gap-2">
              {WHAT_NOT_TO_DO.map((item) => (
                <li key={item} className="text-sm text-ink leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA */}
        <div className="flex justify-center mb-1.5">
          <Link
            href="/grade"
            className="inline-flex items-center justify-center bg-hp-pine hover:bg-hp-pine-deep text-white px-6 py-3.5 rounded-[10px] font-bold text-sm transition-colors"
          >
            See How Documentation-Ready Your Claim Is
          </Link>
        </div>

        <p className="text-xs text-ink/50 leading-relaxed text-center mt-8 border-t border-ink/10 pt-4">
          {UNIVERSAL_DISCLAIMER}
        </p>
      </div>
    </main>
  );
}
