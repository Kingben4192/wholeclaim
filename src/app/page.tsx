import Link from "next/link";
import {
  Lock,
  FolderOpen,
  Clock3,
  Download,
} from "lucide-react";
import { PRO_SUBSCRIPTION, PRO_LIFETIME, FEATURE_COMPARISON } from "@/lib/pricing";

// Homepage v2 (docs/wholeclaim_spec_homepage_and_roadmap.md, Part 1 —
// approved; docs/wholeclaim_homepage_mockup.html is the visual reference).
// Part 1 (this file) only — no Part 2 roadmap features, no account menu
// section, no mobile bottom nav (both depend on pages that don't exist
// yet: Subscription, Help Center, Export data). Colors/display font use
// the new hp-* tokens (globals.css) so this redesign can't shift anything
// on other pages built with the existing paper/ledger/ink tokens.

const STEPS = [
  {
    title: "Create your claim",
    body: "Add property details and claim information.",
  },
  {
    title: "Upload your evidence",
    body: "Photos, receipts, invoices, estimates, conversations.",
  },
  {
    title: "Build your timeline",
    body: "Keep every important event organized.",
  },
  {
    title: "Share your claim file",
    body: "Give contractors, adjusters, or professionals one organized record.",
  },
] as const;

const LEDGER_ENTRIES = [
  { type: "PHOTO", label: "Kitchen ceiling — 6 images", date: "2026-07-15" },
  { type: "EMAIL", label: "Adjuster follow-up sent", date: "2026-07-14" },
  { type: "CALL", label: "Plumber estimate received", date: "2026-07-12" },
] as const;

const FEATURES = [
  {
    kicker: "Claim Grade",
    badge: "free" as const,
    title: "Know where your claim file stands",
    body: "Get a quick assessment of your documentation and see what areas you can organize next.",
  },
  {
    kicker: "Claim Binder",
    badge: "free" as const,
    title: "Everything in one organized place",
    body: "Keep photos, documents, receipts, notes, and important claim details together.",
  },
  {
    kicker: "Evidence Vault",
    badge: "free" as const,
    title: "Store your documentation securely",
    body: "Upload and organize important files, photos, and records related to your claim.",
  },
  {
    kicker: "Timeline",
    badge: "free" as const,
    title: "Track every important moment",
    body: "Create a clear record of events, updates, and documentation as your claim progresses.",
  },
  {
    kicker: "Guided Organization",
    badge: "free" as const,
    title: "Know what to add next",
    body: "Follow a simple workflow that helps you build a more complete claim file.",
  },
  {
    kicker: "Sharing",
    badge: "planned" as const,
    title: "Share your organized claim file",
    body: "Future feature for securely sharing claim information with approved recipients.",
  },
] as const;

const NEED_ITEMS = [
  "Photos & videos",
  "Repair estimates",
  "Receipts",
  "Emails & text messages",
  "Contractor invoices",
  "Inspection reports",
] as const;

const TRUST_ITEMS = [
  {
    Icon: Lock,
    title: "Secure evidence storage",
    body: "Photos and PDFs stored privately — only you can view them.",
  },
  {
    Icon: FolderOpen,
    title: "Organized documentation",
    body: "Every file, receipt, and note in one structured place.",
  },
  {
    Icon: Clock3,
    title: "Timeline tracking",
    body: "Dates, calls, and events logged as they happen.",
  },
  {
    Icon: Download,
    title: "Export anytime",
    body: "Your claim file belongs to you. Download it whenever you need it.",
  },
] as const;

const FOOTER_LINKS: [string, string | null][] = [
  ["Privacy", "/privacy"],
  ["Terms", "/terms"],
  ["AI Disclaimer", "/ai-disclaimer"],
  ["Help", "/help"],
];

export default function Page() {
  return (
    <main className="flex flex-col bg-hp-paper text-hp-ink">
      {/* Header — left as-is per scope, only the Help pill is new */}
      <header className="sticky top-0 z-40 px-6 py-4 flex items-center justify-between border-b border-ink/10 bg-hp-paper/90 backdrop-blur">
        <span className="font-display font-extrabold uppercase tracking-[0.06em] text-sm">
          Whole<span className="text-ledger">Claim</span>
        </span>
        <div className="flex items-center gap-5">
          <Link href="/login" className="text-sm font-semibold text-ledger">
            Log in
          </Link>
          <Link
            href="/help"
            className="inline-flex items-center gap-1.5 text-xs font-mono border border-hp-line rounded-full px-3.5 py-1.5 bg-white hover:border-hp-pine hover:text-hp-pine transition-colors"
          >
            Help
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 pt-16 pb-14 text-center">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-hp-pine mb-5">
          The insurance claim workspace for homeowners
        </p>
        <h1 className="font-hp-display text-4xl md:text-6xl font-extrabold leading-[1.04] tracking-tight max-w-2xl mx-auto mb-5">
          Your claim. Organized from day one.
        </h1>
        <p className="text-base md:text-lg text-hp-ink-soft max-w-md mx-auto mb-8">
          Store photos, documents, timelines, and conversations in one secure claim file.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3.5 mb-5">
          <Link
            href="/claim/new"
            className="inline-flex items-center justify-center bg-hp-pine hover:bg-hp-pine-deep text-white px-6 py-3.5 rounded-[10px] font-bold text-sm transition-colors"
          >
            Start Free Claim Binder
          </Link>
          <Link
            href="/grade"
            className="inline-flex items-center justify-center border-[1.5px] border-hp-pine text-hp-pine hover:bg-hp-sage px-6 py-3.5 rounded-[10px] font-bold text-sm transition-colors"
          >
            Check Your Claim Grade
          </Link>
        </div>
        <p className="text-sm text-hp-ink-soft">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-hp-pine">
            Log in
          </Link>
        </p>
      </section>

      {/* How WholeClaim Works */}
      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-11">
            <span className="block font-mono text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-hp-ink-soft mb-3">
              The process
            </span>
            <h2 className="font-hp-display text-2xl md:text-3xl font-bold tracking-tight">
              How WholeClaim works
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-hp-line border border-hp-line rounded-[10px] overflow-hidden">
            {STEPS.map((step, i) => (
              <div key={step.title} className="bg-hp-paper p-7">
                <span className="block font-mono text-xs font-semibold text-hp-pine tracking-wide mb-3.5">
                  STEP {i + 1}
                </span>
                <h3 className="font-hp-display font-bold text-base mb-2 tracking-tight">
                  {step.title}
                </h3>
                <p className="text-sm text-hp-ink-soft">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing — copy/numbers pulled from src/lib/pricing.ts, the same
         constants UpgradeOptions.tsx and /pricing import, not retyped here.
         Unauthenticated visitors sign in first (same pattern as
         /pricing's own unauthenticated fallback) rather than starting a
         checkout session with no user to attach it to. */}
      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-11">
            <span className="block font-mono text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-hp-ink-soft mb-3">
              Pricing
            </span>
            <h2 className="font-hp-display text-2xl md:text-3xl font-bold tracking-tight">
              Free to start. Two ways to go Pro.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-14">
            <div className="bg-white border border-hp-line rounded-[10px] p-6 flex flex-col gap-3">
              <div className="font-hp-display font-bold text-sm">WholeClaim Pro</div>
              <div className="font-mono text-3xl font-extrabold text-hp-pine">
                {PRO_SUBSCRIPTION.priceAmount}
                <span className="text-base font-sans font-normal text-hp-ink-soft">
                  {PRO_SUBSCRIPTION.pricePeriod}
                </span>
              </div>
              <p className="text-sm text-hp-ink-soft flex-1">{PRO_SUBSCRIPTION.description}</p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center bg-hp-pine hover:bg-hp-pine-deep text-white px-4 py-3 rounded-[10px] font-bold text-sm transition-colors"
              >
                Sign in to subscribe
              </Link>
            </div>

            <div className="bg-white border border-hp-line rounded-[10px] p-6 flex flex-col gap-3">
              <div className="font-hp-display font-bold text-sm">WholeClaim Pro</div>
              <div className="font-mono text-3xl font-extrabold text-hp-pine">
                {PRO_LIFETIME.priceAmount}
                <span className="text-base font-sans font-normal text-hp-ink-soft">
                  {PRO_LIFETIME.pricePeriod}
                </span>
              </div>
              <p className="text-sm text-hp-ink-soft flex-1">{PRO_LIFETIME.description}</p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center border-[1.5px] border-hp-pine text-hp-pine hover:bg-hp-sage px-4 py-3 rounded-[10px] font-bold text-sm transition-colors"
              >
                Sign in first
              </Link>
            </div>
          </div>

          {/* Free vs Pro comparison — src/lib/pricing.ts's FEATURE_COMPARISON.
             Newly proposed alongside this section: no such constant existed
             anywhere in the codebase before (confirmed via repo search) —
             built directly from the real current gating logic
             (rateLimit.ts, uploadLimits.ts, LossOfUseTracker.tsx), not a
             pre-existing source. See that file's own comment for exactly
             which code each row traces to. */}
          <div className="max-w-2xl mx-auto">
            <h3 className="text-center font-hp-display text-lg font-bold tracking-tight mb-5">
              What&apos;s included
            </h3>
            <div className="border border-hp-line rounded-[10px] overflow-hidden bg-white">
              <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-4 py-2.5 bg-hp-paper text-[0.62rem] font-mono font-semibold uppercase tracking-wider text-hp-ink-soft">
                <span>Feature</span>
                <span className="text-right w-24 sm:w-32">Free</span>
                <span className="text-right w-24 sm:w-32">Pro</span>
              </div>
              {FEATURE_COMPARISON.map((row, i) => (
                <div
                  key={row.feature}
                  className={`grid grid-cols-[1fr_auto_auto] gap-x-4 px-4 py-3 text-sm ${
                    i > 0 ? "border-t border-hp-line" : ""
                  }`}
                >
                  <span className="text-hp-ink">{row.feature}</span>
                  <span className="text-right w-24 sm:w-32 text-hp-ink-soft">{row.free}</span>
                  <span className="text-right w-24 sm:w-32 text-hp-pine font-semibold">{row.pro}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Example Claim File preview — SAMPLE stamp + caption are mandatory, non-negotiable */}
      <section className="px-6 py-16 bg-hp-paper-deep border-y border-hp-line">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-11">
            <span className="block font-mono text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-hp-ink-soft mb-3">
              Inside the workspace
            </span>
            <h2 className="font-hp-display text-2xl md:text-3xl font-bold tracking-tight">
              Everything lives in one claim file
            </h2>
          </div>
          <div className="max-w-xl mx-auto">
            <span className="inline-block font-mono text-xs font-semibold uppercase tracking-wider bg-white border border-hp-line border-b-0 rounded-t-lg px-5 py-2 ml-6 relative z-10">
              Example claim file
            </span>
            <div className="relative bg-white border border-hp-line rounded-[10px] p-7 md:p-8 shadow-[0_1px_0_var(--color-hp-line),0_14px_34px_-22px_rgba(20,32,26,0.35)] overflow-hidden">
              <div
                aria-hidden
                className="absolute top-[46%] left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[14deg] font-mono font-semibold text-4xl md:text-5xl tracking-[0.3em] text-hp-stamp opacity-[0.13] border-4 border-hp-stamp rounded-lg px-7 py-1.5 pointer-events-none whitespace-nowrap"
              >
                SAMPLE
              </div>

              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <div className="font-hp-display font-bold text-xl md:text-2xl tracking-tight">
                    Water Damage
                  </div>
                  <span className="inline-block font-mono text-xs font-medium text-hp-pine bg-hp-sage rounded-full px-3 py-1 mt-2">
                    STATUS · DOCUMENTATION STARTED
                  </span>
                </div>
                <div className="shrink-0 text-center">
                  <div className="w-[74px] h-[74px] border-[2.5px] border-hp-ink rounded-lg flex items-center justify-center font-hp-display font-extrabold text-3xl">
                    B+
                  </div>
                  <div className="font-mono text-[0.62rem] tracking-wider uppercase text-hp-ink-soft mt-1.5">
                    Claim Grade
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-px bg-hp-line border border-hp-line rounded-lg overflow-hidden mb-6">
                {[
                  ["47", "Photos"],
                  ["6", "Documents"],
                  ["3", "Receipts"],
                ].map(([n, label]) => (
                  <div key={label} className="bg-hp-paper px-4 py-3.5">
                    <b className="font-hp-display font-extrabold text-xl md:text-2xl tracking-tight block">
                      {n}
                    </b>
                    <span className="font-mono text-[0.66rem] tracking-wider uppercase text-hp-ink-soft">
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="font-mono text-[0.66rem] font-semibold tracking-[0.18em] uppercase text-hp-ink-soft mb-2.5">
                Timeline · 12 events added
              </div>
              <div className="border border-hp-line rounded-lg overflow-hidden">
                {LEDGER_ENTRIES.map((entry, i) => (
                  <div
                    key={entry.label}
                    className={`grid grid-cols-[70px_1fr_auto] sm:grid-cols-[78px_1fr_auto] gap-3 items-center px-4 py-2.5 text-sm bg-white ${
                      i > 0 ? "border-t border-hp-line" : ""
                    }`}
                  >
                    <span className="font-mono text-xs font-semibold tracking-wide text-hp-pine">
                      {entry.type}
                    </span>
                    <span>{entry.label}</span>
                    <span className="font-mono text-xs text-hp-ink-soft">{entry.date}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-center font-mono text-xs text-hp-ink-soft mt-4">
              Sample data shown for illustration. Your file starts empty — and fills fast.
            </p>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-11">
            <span className="block font-mono text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-hp-ink-soft mb-3">
              What you get
            </span>
            <h2 className="font-hp-display text-2xl md:text-3xl font-bold tracking-tight">
              Built around the free experience
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.kicker}
                className={`border border-hp-line rounded-[10px] p-6 flex flex-col gap-2.5 ${
                  f.badge === "planned" ? "bg-hp-paper" : "bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-2.5">
                  <span className="font-mono text-[0.66rem] font-semibold uppercase tracking-wider text-hp-ink-soft">
                    {f.kicker}
                  </span>
                  <span
                    className={`font-mono text-[0.6rem] font-semibold uppercase tracking-wider rounded-full px-2.5 py-1 ${
                      f.badge === "free"
                        ? "bg-hp-sage text-hp-pine"
                        : "border border-hp-line text-hp-ink-soft"
                    }`}
                  >
                    {f.badge === "free" ? "Free" : "Planned"}
                  </span>
                </div>
                <h3 className="font-hp-display font-bold text-[1.08rem] tracking-tight">
                  {f.title}
                </h3>
                <p className="text-sm text-hp-ink-soft">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What do I need to start? */}
      <section className="px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-11">
            <span className="block font-mono text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-hp-ink-soft mb-3">
              Getting started
            </span>
            <h2 className="font-hp-display text-2xl md:text-3xl font-bold tracking-tight">
              What do I need to start?
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-7">
            {NEED_ITEMS.map((item) => (
              <div
                key={item}
                className="flex items-center gap-2.5 bg-white border border-hp-line rounded-[10px] px-4 py-3.5 font-semibold text-sm"
              >
                <span className="shrink-0 w-[22px] h-[22px] rounded-md bg-hp-sage text-hp-pine flex items-center justify-center text-xs">
                  ✓
                </span>
                {item}
              </div>
            ))}
          </div>
          <p className="text-center text-base text-hp-ink-soft italic">
            Don&apos;t have everything?{" "}
            <b className="text-hp-ink not-italic">Start with what you have.</b>
          </p>
        </div>
      </section>

      {/* Trust band */}
      <section className="px-6 py-16 bg-hp-pine text-[#EDF2EC]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-11">
            <span className="block font-mono text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[#A9C2AF] mb-3">
              Built for trust
            </span>
            <h2 className="font-hp-display text-2xl md:text-3xl font-bold tracking-tight text-white">
              Your evidence, handled carefully
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-7 max-w-3xl mx-auto text-center mb-9">
            {TRUST_ITEMS.map(({ Icon, title, body }) => (
              <div key={title}>
                <Icon size={26} strokeWidth={1.8} className="text-[#A9C2AF] mx-auto mb-2.5" />
                <h4 className="font-hp-display font-bold text-sm mb-1 text-white">{title}</h4>
                <p className="text-[0.83rem] text-[#C3D3C6]">{body}</p>
              </div>
            ))}
          </div>
          <p className="max-w-lg mx-auto text-center font-mono text-xs leading-relaxed text-[#A9C2AF] border-t border-white/15 pt-6">
            WholeClaim helps organize claim documentation. It is an educational tool — not
            legal, insurance, or financial advice, and it does not guarantee insurance
            outcomes.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-20 text-center">
        <span className="block font-mono text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-hp-ink-soft mb-3">
          Start here
        </span>
        <h2 className="font-hp-display text-2xl md:text-3xl font-bold tracking-tight max-w-xs mx-auto mb-3.5">
          Build your claim file before you need it.
        </h2>
        <p className="text-hp-ink-soft max-w-md mx-auto mb-7">
          A homeowner dealing with damage shouldn&apos;t have to figure out what to do next.
          WholeClaim gives you the next step — every step.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3.5">
          <Link
            href="/claim/new"
            className="inline-flex items-center justify-center bg-hp-pine hover:bg-hp-pine-deep text-white px-6 py-3.5 rounded-[10px] font-bold text-sm transition-colors"
          >
            Start Free Claim Binder
          </Link>
          <Link
            href="/grade"
            className="inline-flex items-center justify-center border-[1.5px] border-hp-pine text-hp-pine hover:bg-hp-sage px-6 py-3.5 rounded-[10px] font-bold text-sm transition-colors"
          >
            Take the 60-Second Claim Grade
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-hp-line py-9 bg-hp-paper-deep">
        <div className="max-w-4xl mx-auto px-6 flex flex-wrap gap-4 items-baseline justify-between">
          <span className="font-display font-extrabold uppercase tracking-[0.06em] text-sm">
            Whole<span className="text-ledger">Claim</span>
          </span>
          <small className="font-mono text-xs text-hp-ink-soft leading-relaxed max-w-xl">
            getwholeclaim.com · WholeClaim helps organize claim documentation. It does not
            provide legal advice or guarantee insurance outcomes. © 2026 WholeClaim.
            <span className="mx-1" />
            {FOOTER_LINKS.map(([label, href], i) => (
              <span key={label}>
                {i === 0 ? " · " : " · "}
                {href ? (
                  <Link href={href} className="underline">
                    {label}
                  </Link>
                ) : (
                  label
                )}
              </span>
            ))}
          </small>
        </div>
      </footer>
    </main>
  );
}
