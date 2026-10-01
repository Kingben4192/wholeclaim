import type { Metadata } from "next";
import Link from "next/link";
import {
  Lock,
  FolderOpen,
  Clock3,
  Download,
} from "lucide-react";
import { PRO_SUBSCRIPTION, PRO_LIFETIME, FEATURE_COMPARISON } from "@/lib/pricing";
import { PRO_LIFETIME_ENABLED } from "@/lib/featureFlags";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

// Page-level override of layout.tsx's shared default metadata -- scoped to
// "/" only, same pattern as /free-book's own metadata export. Editing
// layout.tsx directly would change the fallback title/description every
// other page without its own override inherits, not just this one.
const TITLE = "Document it before you need to prove it. | WholeClaim";
const DESCRIPTION =
  "The claim is the evidence that proves what happened. Store photos, documents, timelines, and conversations in one secure claim file.";

// Same stopgap image as /free-book -- no dedicated OG/social-card asset
// exists anywhere in public/ yet.
const OG_IMAGE = "/icons/icon-512.png";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    type: "website",
    images: [{ url: OG_IMAGE, width: 512, height: 512 }],
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

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
    title: "Maintain one complete record",
    body: "Update your claim file as things happen — everything stays organized and easy to find.",
  },
] as const;

const LEDGER_ENTRIES = [
  { type: "PHOTO", label: "Kitchen ceiling — 6 images", date: "2026-07-15" },
  { type: "EMAIL", label: "Adjuster follow-up sent", date: "2026-07-14" },
  { type: "CALL", label: "Plumber estimate received", date: "2026-07-12" },
] as const;

const FEATURES: {
  kicker: string;
  badge: "free" | "pro";
  title: string;
  body: string;
  note?: string;
}[] = [
  {
    kicker: "Holomark Claim Grade",
    badge: "free" as const,
    title: "Know where your claim file stands",
    body: "Get a quick assessment of your documentation and see what areas you can organize next.",
    note: "The grade reflects how complete and organized your documentation is. It is not a prediction of whether or how much an insurer will pay.",
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
    kicker: "Claim Binder PDF export",
    badge: "pro" as const,
    title: "Export a complete claim binder PDF",
    body: "One-click PDF export with a cover page, timeline, evidence index, and receipts.",
  },
];

const NEED_ITEMS = [
  "Photos and documents (up to 15MB each)",
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
    body: "Photos and PDFs are private to your account — visible only to you.",
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

const PRICING_LAUNCH_NOTE = "Launched September 2026";

export default async function Page() {
  let isSignedIn = false;
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isSignedIn = !!user;
  }

  return (
    <main className="flex flex-col bg-hp-paper text-hp-ink">
      {/* Header — left as-is per scope, only the Help pill is new */}
      <header className="sticky top-0 z-40 px-6 py-4 flex items-center justify-between border-b border-ink/10 bg-hp-paper/90 backdrop-blur">
        <span className="font-display font-extrabold uppercase tracking-[0.06em] text-sm">
          Whole<span className="text-ledger">Claim</span>
        </span>
        <div className="flex items-center gap-5">
          {isSignedIn ? (
            <Link href="/account" className="text-sm font-semibold text-ledger">
              My account
            </Link>
          ) : (
            <Link href="/login" className="text-sm font-semibold text-ledger">
              Log in
            </Link>
          )}
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
          Document it before you need to prove it.
        </h1>
        <p className="text-base text-hp-ink-soft italic max-w-md mx-auto mb-3">
          The claim is the evidence that proves what happened.
        </p>
        <p className="text-base md:text-lg text-hp-ink-soft max-w-md mx-auto mb-8">
          Store photos, documents, timelines, and conversations in one secure claim file.
        </p>
        <p className="text-sm text-hp-ink-soft max-w-xl mx-auto mb-8">
          Holomark™ Claim Grade and Holomark Score measure how complete and organized your documentation is. The same answers always produce the same score. They are not a prediction of whether or how much an insurer will pay.
        </p>
        <div className="flex justify-center mb-5">
          <Link
            href="/grade"
            className="inline-flex items-center justify-center bg-hp-pine hover:bg-hp-pine-deep text-white px-6 py-3.5 rounded-[10px] font-bold text-sm transition-colors"
          >
            Check Your Holomark Claim Grade
          </Link>
        </div>
        <p className="text-sm text-hp-ink-soft mb-1.5">
          Already know what you need?{" "}
          <Link href="/claim/new" className="font-semibold text-hp-pine">
            Start your claim file
          </Link>
        </p>
        <p className="text-sm text-hp-ink-soft">
          {isSignedIn ? (
            <>
              Welcome back.{" "}
              <Link href="/account" className="font-semibold text-hp-pine">
                Go to your account
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-hp-pine">
                Log in
              </Link>
            </>
          )}
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
              {PRO_LIFETIME_ENABLED ? "Two ways to go Pro." : "Go Pro."}
            </h2>
            <p className="mt-2 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-hp-pine">
              {PRICING_LAUNCH_NOTE}
            </p>
          </div>

          <div
            className={`grid grid-cols-1 ${PRO_LIFETIME_ENABLED ? "sm:grid-cols-2" : ""} gap-4 max-w-2xl mx-auto mb-14`}
          >
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

            {PRO_LIFETIME_ENABLED && (
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
            )}
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
            <p className="text-center text-xs text-hp-ink-soft mt-3">
              Individual file uploads are limited to 15MB.
            </p>
          </div>
        </div>
      </section>

      {/* Example Claim File preview — sample data only, no real user content. */}
      <section className="px-6 py-16 bg-hp-paper-deep border-y border-hp-line">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-11">
            <span className="block font-mono text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-hp-ink-soft mb-3">
              Inside the workspace
            </span>
            <h2 className="font-hp-display text-2xl md:text-3xl font-bold tracking-tight">
              Three views of the same claim file
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white border border-hp-line rounded-[10px] p-6 shadow-[0_1px_0_var(--color-hp-line),0_14px_34px_-22px_rgba(20,32,26,0.35)]">
              <div className="font-mono text-[0.66rem] font-semibold tracking-[0.18em] uppercase text-hp-ink-soft mb-2">
                Claim overview
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
                    Holomark Score
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-sm text-hp-ink-soft">
                <p><span className="font-semibold text-hp-ink">Status:</span> Documentation started</p>
                <p><span className="font-semibold text-hp-ink">Grade:</span> B+</p>
                <p><span className="font-semibold text-hp-ink">Claim file:</span> 16 photos · 6 documents · 3 receipts</p>
              </div>
            </div>

            <div className="bg-white border border-hp-line rounded-[10px] p-6 shadow-[0_1px_0_var(--color-hp-line),0_14px_34px_-22px_rgba(20,32,26,0.35)]">
              <div className="font-mono text-[0.66rem] font-semibold tracking-[0.18em] uppercase text-hp-ink-soft mb-2">
                Evidence grid
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  "Before photos",
                  "Mitigation invoice",
                  "Adjuster email",
                  "Drying logs",
                  "Plumber estimate",
                  "Receipt batch",
                ].map((item) => (
                  <div key={item} className="rounded-lg border border-hp-line bg-hp-paper px-3 py-2 text-sm font-medium text-hp-ink">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-hp-line rounded-[10px] p-6 shadow-[0_1px_0_var(--color-hp-line),0_14px_34px_-22px_rgba(20,32,26,0.35)]">
              <div className="font-mono text-[0.66rem] font-semibold tracking-[0.18em] uppercase text-hp-ink-soft mb-2">
                Timeline
              </div>
              <div className="flex flex-col gap-3">
                {LEDGER_ENTRIES.map((entry) => (
                  <div key={entry.label} className="border-b border-hp-line pb-2 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between gap-3 text-sm font-medium text-hp-ink mb-0.5">
                      <span>{entry.type} · {entry.label}</span>
                      <span className="font-mono text-[0.72rem] text-hp-ink-soft">{entry.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="text-center font-mono text-xs text-hp-ink-soft mt-4">
            Sample data shown for illustration. Your file starts empty — and fills fast.
          </p>
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
                  f.badge === "free" ? "bg-white" : "bg-hp-paper"
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
                        : "bg-hp-pine text-white"
                    }`}
                  >
                    {f.badge === "free" ? "Free" : "Pro"}
                  </span>
                </div>
                <h3 className="font-hp-display font-bold text-[1.08rem] tracking-tight">
                  {f.title}
                </h3>
                <p className="text-sm text-hp-ink-soft">{f.body}</p>
                {f.note && <p className="text-xs text-hp-ink-soft/80">{f.note}</p>}
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
            WholeClaim helps organize documentation. It does not provide insurance advice,
            guarantee claim approval, or determine claim outcomes.
          </p>
        </div>
      </section>

      {/* Security block */}
      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-hp-line rounded-[10px] p-6">
            <span className="block font-mono text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-hp-ink-soft mb-3">
              Where your files live
            </span>
            <h2 className="font-hp-display text-2xl font-bold tracking-tight mb-4">
              Private storage. Only you can get to your files.
            </h2>
            <ul className="space-y-3 text-sm text-hp-ink-soft leading-relaxed">
              <li className="flex gap-3">
                <Lock size={16} className="mt-0.5 shrink-0 text-hp-pine" />
                <span>The photos and documents you upload are stored privately, not published anywhere public.</span>
              </li>
              <li className="flex gap-3">
                <FolderOpen size={16} className="mt-0.5 shrink-0 text-hp-pine" />
                <span>Only your account can view, add, or delete the files in your claim.</span>
              </li>
              <li className="flex gap-3">
                <Download size={16} className="mt-0.5 shrink-0 text-hp-pine" />
                <span>When you open a file from your claim, you get a temporary link that expires on its own, not a permanent public one.</span>
              </li>
              <li className="flex gap-3">
                <Clock3 size={16} className="mt-0.5 shrink-0 text-hp-pine" />
                <span>Every part of your claim file — entries, deadlines, evidence, and file records — is restricted to your account only.</span>
              </li>
              <li className="flex gap-3">
                <Clock3 size={16} className="mt-0.5 shrink-0 text-hp-pine" />
                <span>The site is hosted on Vercel and served over HTTPS, so your connection is encrypted.</span>
              </li>
            </ul>
          </div>

          <div className="bg-hp-paper-deep border border-hp-line rounded-[10px] p-6">
            <span className="block font-mono text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-hp-ink-soft mb-3">
              Founder note
            </span>
            <p className="font-hp-display text-2xl font-bold tracking-tight mb-4 whitespace-pre-line">
              I built WholeClaim after going through a property insurance claim of my own. What I learned: a claim often comes down to what you can prove — the dates, the photos, the receipts, who said what and when. WholeClaim is the file I wish I&apos;d started on day one.
              {'\n'}— Benjamin Hammonds, Founder, WholeClaim LLC
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-20 text-center">
        <span className="block font-mono text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-hp-ink-soft mb-3">
          Start here
        </span>
        <h2 className="font-hp-display text-2xl md:text-3xl font-bold tracking-tight max-w-xs mx-auto mb-3.5">
          Start where you are.
        </h2>
        <p className="text-hp-ink-soft max-w-md mx-auto mb-7">
          A homeowner dealing with damage shouldn&apos;t have to figure out what to do next.
          WholeClaim gives you the next step — every step.
        </p>
        <div className="flex justify-center mb-1.5">
          <Link
            href="/grade"
            className="inline-flex items-center justify-center bg-hp-pine hover:bg-hp-pine-deep text-white px-6 py-3.5 rounded-[10px] font-bold text-sm transition-colors"
          >
            Check Your Holomark Claim Grade
          </Link>
        </div>
        <p className="text-sm text-hp-ink-soft mb-10">
          Already know what you need?{" "}
          <Link href="/claim/new" className="font-semibold text-hp-pine">
            Start your claim file
          </Link>
        </p>

        <div className="max-w-sm mx-auto bg-white border border-hp-line rounded-[10px] p-6 flex flex-col gap-3 text-left">
          <h3 className="font-hp-display font-bold text-base">
            New here? Start with the free guide.
          </h3>
          <p className="text-sm text-hp-ink-soft flex-1">
            The Claim Documentation Guide — the four-pillar system for documenting your
            property. Free, no account required.
          </p>
          <Link
            href="/free-book?p=home-card"
            className="inline-flex items-center justify-center border-[1.5px] border-hp-pine text-hp-pine hover:bg-hp-sage px-4 py-3 rounded-[10px] font-bold text-sm transition-colors"
          >
            Get the free guide
          </Link>
        </div>
      </section>

    </main>
  );
}
