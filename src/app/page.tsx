import Link from "next/link";
import {
  BookOpen,
  Gauge,
  ListChecks,
  Clock,
  Archive,
  SearchCheck,
  Mail,
  Library,
} from "lucide-react";

const FEATURES = [
  {
    Icon: BookOpen,
    title: "The Binder",
    body: "Log every call, email, and adjuster visit in under 30 seconds. The chronology is the case.",
  },
  {
    Icon: Gauge,
    title: "Claim Health Score",
    body: "The condition of your documentation, 0–100, every point explained. It scores your file, never your odds.",
  },
  {
    Icon: ListChecks,
    title: "Evidence Checklist",
    body: "Exactly what a complete file contains for your damage type, from field-tested contractor standards.",
  },
  {
    Icon: Clock,
    title: "Deadline Tracker",
    body: "Suit limitations and follow-ups with countdown stamps. Red means due. Nothing dies to a missed date.",
  },
  {
    Icon: Archive,
    title: "Evidence Vault",
    body: "Every photo, PDF, invoice, and letter in one organized place, timestamps preserved.",
  },
  {
    Icon: SearchCheck,
    title: "Analyze",
    body: "Policy Decoder, Estimate Gap Analyzer, Loss-Count Auditor. Carrier paperwork, made legible.",
  },
  {
    Icon: Mail,
    title: "Letters",
    body: "Professional drafts built from your file. You review every line. You send it.",
  },
  {
    Icon: Library,
    title: "Knowledge Library",
    body: "Analysis grounded in statutes, codes, and prices you approved. Nothing enters without your sign-off.",
  },
];

const SCORE_BREAKDOWN = [
  ["Evidence", 34, 40],
  ["Paper Trail", 18, 20],
  ["Deadlines", 20, 20],
  ["Freshness", 17, 20],
] as const;

const STEPS = [
  {
    title: "Open your claim file — 3 minutes.",
    body: "Carrier, claim number, date of loss, damage type. The system starts working immediately.",
  },
  {
    title: "Build the record — 30 seconds at a time.",
    body: "Log contacts, upload documents, check off the evidence your damage type requires.",
  },
  {
    title: "Understand and act.",
    body: "Decode your policy, audit the estimate, track every deadline, draft the letters — all from your own file, all reviewed by you.",
  },
];

const FOOTER_LINKS = [
  "Features",
  "Pricing",
  "FAQ",
  "About",
  "Contact",
  "Privacy",
  "Terms",
  "AI Disclaimer",
];

export default function Page() {
  return (
    <main className="flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-ink/10">
        <span className="font-display font-extrabold uppercase tracking-[0.06em] text-sm">
          Whole<span className="text-ledger">Claim</span>
        </span>
        <Link href="/login" className="text-sm font-semibold text-ledger">
          Log in
        </Link>
      </header>

      {/* Hero */}
      <section className="px-6 pt-20 pb-16 md:pt-28 md:pb-20">
        <div className="max-w-3xl mx-auto text-center">
          <p className="font-display text-xs font-bold uppercase tracking-[0.15em] text-ink/60 mb-4">
            The Insurance Claim Workspace for Homeowners
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold leading-tight mb-6">
            Build the claim file your insurance company wishes you didn&apos;t
            have.
          </h1>
          <p className="text-lg text-ink/70 mb-8 max-w-2xl mx-auto">
            WholeClaim turns scattered photos, letters, and phone calls into
            an organized, deadline-tracked claim file — with AI analysis you
            review and control.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 mb-10">
            <button className="bg-ledger text-paper px-6 py-3 rounded-sm font-semibold text-sm">
              Grade my claim free — 2 minutes
            </button>
            <button className="border border-ink/30 text-ink px-6 py-3 rounded-sm font-semibold text-sm">
              See how it works
            </button>
          </div>
          <p className="text-sm text-ink/70 max-w-xl mx-auto">
            Built by a contractor whose first claim opened at $40,000 and
            closed past $125,000 — through documented supplements, not a
            lawyer.{" "}
            <span className="italic text-ink/50">
              A documented individual result. WholeClaim doesn&apos;t promise
              outcomes — it organizes evidence.
            </span>
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 border-t border-ink/10">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-xs font-bold uppercase tracking-[0.1em] text-ink/60 text-center mb-10">
            Everything your claim needs, in one file
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(({ Icon, title, body }) => (
              <div key={title} className="flex flex-col">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-sm border border-ledger bg-ledger/10 text-ledger mb-3">
                  <Icon size={18} />
                </span>
                <h3 className="font-display font-bold text-sm mb-1">
                  {title}
                </h3>
                <p className="text-sm text-ink/60 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Claim Health Score sample */}
      <section className="px-6 py-16 border-t border-ink/10">
        <div className="max-w-md mx-auto border border-ink/15 rounded-sm p-6 bg-ledger/5">
          <div className="flex items-baseline justify-between mb-4">
            <h3 className="font-display font-bold text-sm uppercase tracking-wide">
              Claim Health Score
            </h3>
            <span className="font-mono text-2xl font-extrabold text-ledger">
              89<span className="text-sm text-ink/50">/100</span>
            </span>
          </div>
          <div className="space-y-2 mb-4">
            {SCORE_BREAKDOWN.map(([label, points, max]) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-xs w-20 shrink-0 uppercase tracking-wide text-ink/60">
                  {label}
                </span>
                <div className="h-1.5 flex-1 rounded-sm bg-ink/10">
                  <div
                    className="h-1.5 rounded-sm bg-ledger"
                    style={{ width: `${(points / max) * 100}%` }}
                  />
                </div>
                <span className="font-mono text-xs w-10 text-right text-ink/60">
                  {points}/{max}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-ink/50 italic">
            Every point explained. Never a prediction.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-16 border-t border-ink/10">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-xs font-bold uppercase tracking-[0.1em] text-ink/60 text-center mb-10">
            How it works
          </h2>
          <div className="space-y-8">
            {STEPS.map((step, i) => (
              <div key={step.title} className="flex gap-4">
                <span className="font-display font-extrabold text-2xl text-ledger shrink-0 w-8">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-display font-bold text-base mb-1">
                    {step.title}
                  </h3>
                  <p className="text-sm text-ink/60 leading-relaxed">
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust block */}
      <section className="px-6 py-16 border-t border-ink/10">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm text-ink/70 leading-relaxed">
            WholeClaim is claim documentation software — <strong>not</strong>{" "}
            an insurance company, public adjuster, law firm, or claims
            negotiator. We never contact your insurer, never take a
            percentage, never give legal advice. Your data is yours: export
            everything or delete your account, self-serve, anytime. Our AI
            system is regression-tested against real, documented claim files
            before every release.
          </p>
        </div>
      </section>

      {/* Founder story */}
      <section className="px-6 py-16 border-t border-ink/10">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-xs font-bold uppercase tracking-[0.1em] text-ink/60 mb-4">
            Founder story
          </h2>
          <p className="text-sm text-ink/70 leading-relaxed">
            WholeClaim wasn&apos;t built by a software company. It was built
            by a general contractor who ran his own claim like a case file —
            and watched a $40,000 first payment become more than $125,000 of
            documented, covered repairs. Then he checked the carrier&apos;s
            math and found a 16-year rating error worth another $1,235. The
            system he used is the product you&apos;re looking at.
          </p>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="px-6 py-16 border-t border-ink/10">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm text-ink/70">
            Start free — the Binder, deadlines, checklist, score, and one full
            AI analysis. Go Pro when the claim gets complicated.
          </p>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="px-6 py-20 border-t border-ink/10 bg-ledger/5">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="font-display text-2xl font-extrabold mb-6">
            Your insurance company already has a file on your claim. Build
            yours.
          </h2>
          <button className="bg-ledger text-paper px-6 py-3 rounded-sm font-semibold text-sm">
            Grade my claim free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10 border-t border-ink/10">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs text-ink/50 leading-relaxed mb-4">
            WholeClaim is self-help claim documentation software. We are not
            an insurance company, public adjuster, law firm, or claims
            negotiator. Nothing on this site is legal or insurance advice.
          </p>
          <p className="text-xs text-ink/40 uppercase tracking-wide">
            {FOOTER_LINKS.join(" · ")}
          </p>
        </div>
      </footer>
    </main>
  );
}
