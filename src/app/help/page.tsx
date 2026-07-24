import type { Metadata } from "next";
import Link from "next/link";
import { PRO_SUBSCRIPTION, PRO_LIFETIME } from "@/lib/pricing";

export const metadata: Metadata = { title: "Help & Support | WholeClaim" };

const SUPPORT_EMAIL = "support@getwholeclaim.com";

const DISCLAIMER =
  "WholeClaim helps organize documentation. It does not provide insurance advice, guarantee claim approval, or determine claim outcomes.";

const FAQS: { q: string; a: string }[] = [
  {
    q: "What is WholeClaim?",
    a: "WholeClaim helps homeowners organize documentation for property claims and disputes. It creates a structured record of evidence, timelines, documents, and related information.",
  },
  {
    q: "Does WholeClaim handle my insurance claim for me?",
    a: "No. WholeClaim is a documentation and organization tool. It does not communicate with insurers on your behalf, negotiate claims, or act as a public adjuster.",
  },
  {
    q: "Does WholeClaim provide insurance advice?",
    a: "No. WholeClaim helps organize documentation. It does not provide insurance advice, guarantee claim approval, or determine claim outcomes.",
  },
  {
    q: "Can WholeClaim guarantee that my claim will be paid?",
    a: "No. Claim decisions are made by insurance companies, government agencies, contractors, or other third parties. WholeClaim does not control or predict those decisions.",
  },
  {
    q: "What is Claim Grade?",
    a: "Claim Grade is WholeClaim's documentation completeness assessment. It evaluates how organized and complete your claim file is based on information entered into WholeClaim. It is not a prediction of claim approval, settlement amount, or outcome.",
  },
  {
    q: "Can I export my claim file?",
    a: "Yes. WholeClaim is designed to help you maintain an organized record that can be exported and shared.",
  },
];

const GUIDES: { title: string; steps?: string[]; body?: string }[] = [
  {
    title: "How to create a claim file",
    steps: [
      "Create your WholeClaim account.",
      "Start a new claim.",
      "Add basic loss/property information.",
      "Build your timeline.",
      "Upload supporting evidence.",
      "Review your documentation completeness.",
    ],
  },
  {
    title: "How to use Claim Grade",
    steps: [
      "Add your claim information.",
      "Upload relevant documentation.",
      "Complete the recommended documentation steps.",
      "Review your documentation grade.",
      "Identify missing records.",
    ],
  },
  {
    title: "How to use Evidence Vault",
    body: "Upload photos, documents, estimates, invoices, reports, and correspondence. Keep records organized by claim. Maintain a chronological evidence history.",
  },
  {
    title: "How to use Policy Decoder",
    body: "Upload your policy documents. Use the tool to organize and understand policy sections. Review your policy information alongside your claim documentation.",
  },
];

export default function HelpPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between border-b border-ink/10">
        <Link
          href="/"
          className="font-display font-extrabold uppercase tracking-[0.06em] text-sm"
        >
          Whole<span className="text-ledger">Claim</span>
        </Link>
        <Link href="/login" className="text-sm font-semibold text-ledger">
          Log in
        </Link>
      </header>

      <div className="max-w-3xl w-full mx-auto px-6 py-16">
        <h1 className="font-display text-2xl font-extrabold mb-4">
          Help &amp; Support
        </h1>

        <div className="border-2 border-ledger bg-ledger/10 rounded-sm px-4 py-3 text-sm text-ink mb-12">
          {DISCLAIMER}
        </div>

        <section className="mb-14">
          <h2 className="font-display text-xs font-bold uppercase tracking-[0.1em] text-ink/60 mb-4">
            Frequently Asked Questions
          </h2>
          <div className="flex flex-col divide-y divide-ink/10 border border-ink/15 rounded-sm">
            {FAQS.map((item) => (
              <div key={item.q} className="px-4 py-4">
                <p className="font-display font-bold text-sm mb-1.5">{item.q}</p>
                <p className="text-sm text-ink/70 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-14">
          <h2 className="font-display text-xs font-bold uppercase tracking-[0.1em] text-ink/60 mb-4">
            How-To Guides
          </h2>
          <div className="flex flex-col gap-4">
            {GUIDES.map((guide) => (
              <div key={guide.title} className="border border-ink/15 rounded-sm px-4 py-4">
                <p className="font-display font-bold text-sm mb-2">{guide.title}</p>
                {guide.steps ? (
                  <ol className="list-decimal list-inside text-sm text-ink/70 leading-relaxed flex flex-col gap-1">
                    {guide.steps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-ink/70 leading-relaxed">{guide.body}</p>
                )}
              </div>
            ))}

            <div className="border border-ink/15 rounded-sm px-4 py-4">
              <p className="font-display font-bold text-sm mb-2">Billing &amp; Upgrades</p>
              <p className="text-sm text-ink/70 leading-relaxed mb-3">
                The free plan includes the Binder &amp; Claim Grade, up to 25 Evidence Vault
                uploads per claim, the Deadline Tracker, and 3 AI analyses per claim (Policy
                Decoder, Loss-Count Auditor, Estimate Gap Analyzer, Decision Assistant, Letter
                Builder).
              </p>
              <p className="text-sm text-ink/70 leading-relaxed mb-3">
                WholeClaim Pro is available two ways:
              </p>
              <ul className="text-sm text-ink/70 leading-relaxed flex flex-col gap-1 mb-3">
                <li>
                  <span className="font-mono font-bold text-ink">
                    {PRO_SUBSCRIPTION.priceAmount}
                    {PRO_SUBSCRIPTION.pricePeriod}
                  </span>{" "}
                  — {PRO_SUBSCRIPTION.description}
                </li>
                <li>
                  <span className="font-mono font-bold text-ink">
                    {PRO_LIFETIME.priceAmount}
                    {PRO_LIFETIME.pricePeriod}
                  </span>{" "}
                  — {PRO_LIFETIME.description}
                </li>
              </ul>
              <p className="text-sm text-ink/70 leading-relaxed mb-3">
                Pro unlocks unlimited Evidence Vault uploads, unlimited (fair use) AI analyses,
                the Mold Coverage Timeline, the Supplement Assistant, and the Loss-of-Use
                Tracker. You can review or change your plan any time from{" "}
                <Link href="/pricing" className="text-ledger font-semibold">
                  the pricing page
                </Link>
                .
              </p>
              <p className="text-sm text-ink/70 leading-relaxed">
                If you have an active subscription, you can manage or cancel it from your
                account page — cancellations take effect at the end of the current billing
                period, and you keep Pro access until then.
              </p>
            </div>

            <div className="border border-ink/15 rounded-sm px-4 py-4">
              <p className="font-display font-bold text-sm mb-2">Exporting Your Claim</p>
              <p className="text-sm text-ink/70 leading-relaxed">
                You can export your claim documentation to keep an organized copy outside of
                WholeClaim. Exports are meant to help you maintain your own records and share
                your documentation with whoever you choose — they are not submitted to anyone
                on your behalf.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-4">
          <h2 className="font-display text-xs font-bold uppercase tracking-[0.1em] text-ink/60 mb-4">
            Contact &amp; Support
          </h2>
          <div className="border border-ink/15 rounded-sm px-4 py-4 text-sm text-ink/70 leading-relaxed">
            <p className="mb-2">
              Need help using WholeClaim? Email:{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-ledger font-semibold">
                {SUPPORT_EMAIL}
              </a>
            </p>
            <p>
              Support can help with account issues, billing questions, technical problems, or
              feature feedback.
            </p>
          </div>
        </section>

        <p className="text-xs text-ink/50 leading-relaxed border-t border-ink/10 pt-4">
          {DISCLAIMER}
        </p>
      </div>
    </main>
  );
}
