import type { Metadata } from "next";
import { PublicPageHeader } from "@/app/_components/PublicPageHeader";
import { UNIVERSAL_DISCLAIMER } from "@/lib/anthropic/outputFilter";
import { FreeBookAttribution } from "./FreeBookAttribution";

const TITLE = "The Claim Documentation Guide | WholeClaim";
const DESCRIPTION =
  "The four-pillar system for documenting your property before you need to prove anything. Free guide, instant download.";

// No dedicated OG/social-card image asset exists anywhere in public/ (no
// openGraph metadata precedent elsewhere in the app either -- checked).
// Using the existing app icon as a stopgap rather than a broken path or a
// silently-omitted image; swap for a real 1200x630 social card when one
// exists.
const OG_IMAGE = "/icons/icon-512.png";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/free-book",
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

// Verified live via curl before wiring (200, title matches exactly:
// "The Claim Documentation Guide").
const GUMROAD_URL = "https://hammondson6.gumroad.com/l/Claim-documentation-guide";

const THREE_TRUTHS = [
  {
    title: "Your memory isn't a property record.",
    body: "Six months from now you won't remember what condition the roof was in the week you moved in.",
  },
  {
    title: "Your camera roll isn't a property record.",
    body: "3,000 photos with no dates, no context, and no organization isn't documentation — it's a pile.",
  },
  {
    title: "A pile of receipts isn't a property record.",
    body: "What you need is a system. This guide gives you one.",
  },
];

const FOUR_PILLARS = [
  {
    number: "Pillar 1",
    title: "Policy",
    body: "What does your policy actually say? Coverage amounts, deductibles, exclusions — know it before you need it.",
  },
  {
    number: "Pillar 2",
    title: "Evidence",
    body: "What happened, and what was damaged? Photos, cause documentation, condition baseline — build it before anything changes.",
  },
  {
    number: "Pillar 3",
    title: "Cost",
    body: "What did the loss or restoration actually cost? Estimates, invoices, receipts, replacement values — documented and organized.",
  },
  {
    number: "Pillar 4",
    title: "Correspondence",
    body: "What has been communicated, paid, or decided? Every email, call log, and payment record — in one place.",
  },
];

const WHATS_INSIDE = [
  "The four-pillar framework for complete property documentation",
  "Why timing matters — and what to document before anything changes",
  "The five most common documentation mistakes homeowners make",
  "What a professional property file actually looks like",
  "How to start documenting today — even if you've never done this before",
  "A guide to using WholeClaim as your digital property record",
];

// /free-book (Gumroad "proeta" free-guide lead magnet, mirrored on-site).
// Same public/no-auth pattern as Disaster Response Center and Resource
// Library. Content ported from 05_Marketing/landing.html into the site's
// existing design system rather than embedded as raw HTML.
export default function FreeBookPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <FreeBookAttribution />
      <PublicPageHeader />

      {/* Hero */}
      <div className="bg-hp-pine px-6 py-14 text-center">
        <div className="max-w-2xl mx-auto flex flex-col items-center">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-hp-sage mb-4">
            Free Guide
          </span>
          <h1 className="font-display text-3xl font-extrabold text-white mb-4 text-balance">
            The Claim Documentation Guide
          </h1>
          <p className="text-white/70 text-base leading-relaxed mb-8 max-w-md">
            The four-pillar system for documenting your property before you need to prove
            anything.
          </p>
          <a
            href={GUMROAD_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-cta="hero"
            className="inline-flex items-center justify-center bg-white text-hp-pine px-8 py-4 rounded-[10px] font-bold text-sm transition-opacity hover:opacity-90"
          >
            Get the free guide
          </a>
          <p className="text-white/35 text-xs mt-3">No account required · PDF download</p>
        </div>
      </div>

      <div className="max-w-2xl w-full mx-auto px-6 py-14">
        {/* Problem */}
        <section className="mb-14">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-ledger mb-3 block">
            The Problem
          </span>
          <h2 className="font-display text-xl font-extrabold mb-4 text-balance">
            Most homeowners skip this — and regret it later.
          </h2>
          <p className="text-sm text-ink/70 leading-relaxed mb-4">
            When something happens — a storm, a leak, a fire, a theft — the homeowner scrambles.
            Photos are scattered across a camera roll. Receipts are in a junk drawer. The
            inspection report is somewhere in email. The policy number is anyone&rsquo;s guess.
          </p>
          <p className="text-sm text-ink/70 leading-relaxed">
            The evidence that could have supported their claim doesn&rsquo;t exist in any usable
            form. And that gap costs them.
          </p>
        </section>

        {/* Three truths */}
        <section className="mb-14 bg-hp-sage rounded-sm px-6 py-8 -mx-6">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-ledger mb-3 block">
            The Truth
          </span>
          <h2 className="font-display text-xl font-extrabold mb-6 text-balance">
            Three things your camera roll is not.
          </h2>
          <ul className="flex flex-col">
            {THREE_TRUTHS.map((t, i) => (
              <li
                key={t.title}
                className={`flex items-start gap-3 py-4 text-sm text-ink/70 leading-relaxed ${
                  i < THREE_TRUTHS.length - 1 ? "border-b border-ink/10" : ""
                }`}
              >
                <span className="text-hp-stamp font-bold shrink-0 mt-0.5">✕</span>
                <span>
                  <strong className="text-ink">{t.title}</strong> {t.body}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Four pillars */}
        <section className="mb-14">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-ledger mb-3 block">
            The System
          </span>
          <h2 className="font-display text-xl font-extrabold mb-2 text-balance">
            The four pillars of a complete property file.
          </h2>
          <p className="text-sm text-ink/70 leading-relaxed mb-6">
            Every complete claim file — or property record — is built on four categories of
            documentation. This guide walks through each one.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FOUR_PILLARS.map((p) => (
              <div key={p.title} className="border border-ink/15 rounded-sm px-4 py-4">
                <span className="font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-ledger">
                  {p.number}
                </span>
                <p className="font-display font-bold text-sm mt-1 mb-1.5">{p.title}</p>
                <p className="text-sm text-ink/70 leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* What's inside */}
      <div className="bg-hp-pine px-6 py-14">
        <div className="max-w-2xl mx-auto">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-hp-sage mb-3 block">
            What&rsquo;s Inside
          </span>
          <h2 className="font-display text-xl font-extrabold text-white mb-6 text-balance">
            A complete guide to getting organized.
          </h2>
          <ul className="grid gap-3">
            {WHATS_INSIDE.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-white/80">
                <span className="text-hp-sage shrink-0 mt-0.5">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="max-w-2xl w-full mx-auto px-6 py-14 text-center">
        <h2 className="font-display text-2xl font-extrabold mb-4 text-balance">
          Start with the guide. Build the record.
        </h2>
        <p className="text-sm text-ink/70 leading-relaxed mb-8 max-w-md mx-auto">
          It&rsquo;s free. Download it, read it, and start building your property documentation
          system today — before you need it.
        </p>
        <a
          href={GUMROAD_URL}
          target="_blank"
          rel="noopener noreferrer"
          data-cta="bottom"
          className="inline-flex items-center justify-center bg-hp-pine hover:bg-hp-pine-deep text-white px-8 py-4 rounded-[10px] font-bold text-sm transition-colors"
        >
          Get the free guide
        </a>
        <p className="text-xs text-ink/50 mt-3">Free PDF · Instant download · No account required</p>

        {/* Upsell */}
        <div className="mt-10 bg-hp-sage rounded-sm px-6 py-6 text-left">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-ledger mb-2 block">
            Ready to go further?
          </span>
          <h3 className="font-display font-bold text-base mb-1.5">
            WholeClaim Property Documentation Workbook
          </h3>
          <p className="text-sm text-ink/70 leading-relaxed mb-4">
            18 fillable pages. Document your home room by room — systems, appliances,
            improvements, personal property — before you need to prove anything. $19 one-time.
          </p>
          <a
            href="https://hammondson6.gumroad.com/l/Wholeclaim-Workbook"
            target="_blank"
            rel="noopener noreferrer"
            data-cta="upsell"
            className="inline-flex items-center justify-center bg-hp-pine text-white px-5 py-2.5 rounded-[10px] font-bold text-sm"
          >
            Get the workbook — $19
          </a>
        </div>

        <p className="text-xs text-ink/50 leading-relaxed text-center mt-10 border-t border-ink/10 pt-4">
          {UNIVERSAL_DISCLAIMER}
        </p>
      </div>
    </main>
  );
}
