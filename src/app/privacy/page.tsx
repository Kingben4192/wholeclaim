import type { Metadata } from "next";
import { LegalLayout } from "../(legal)/LegalLayout";

export const metadata: Metadata = { title: "Privacy Policy | WholeClaim" };

// NOT PUBLISHED. This is the substantive draft from
// 07_Legal/Privacy-Policy-DRAFT.md, converted to page markup for review
// only (technical formatting -- headings/lists/bold -- not a content
// edit; every word below matches the source draft exactly, including its
// own unresolved brackets). Held on a branch/PR per the founder's
// explicit instruction (2026-08-01): do not merge or deploy pending
// Anna's written guidance on which interim version, if any, gets
// published. Do not resolve the open brackets below without that
// guidance -- that's a legal call, not a formatting one.
function DraftNotice() {
  return (
    <div className="border-2 border-red-700 bg-red-50 rounded-sm px-4 py-3 text-sm text-red-900">
      <strong>Not published — awaiting legal review.</strong> This is
      WholeClaim&apos;s complete draft privacy policy, prepared for
      attorney review. It is not live, and nothing below should be relied
      on as WholeClaim&apos;s actual current privacy practices until
      approved for publication.
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy">
      <DraftNotice />

      <p>
        <strong>Effective Date:</strong> July 18, 2026
        <br />
        <strong>Last Updated:</strong> July 18, 2026
      </p>

      <h2 className="font-display text-base font-bold mt-4">1. Overview</h2>
      <p>
        This Privacy Policy explains how WholeClaim (&quot;we,&quot;
        &quot;us,&quot; &quot;our&quot;) collects, uses, stores, and
        protects information when you use our service. WholeClaim helps
        homeowners organize documentation related to property insurance
        claims, and by the nature of that service, may involve sensitive
        personal and property information. We take that responsibility
        seriously.
      </p>
      <p>WholeClaim is operated by [WHOLECLAIM OPERATING ENTITY].</p>

      <h2 className="font-display text-base font-bold mt-4">2. Information We Collect</h2>
      <p className="font-semibold">2.1 Information You Provide</p>
      <ul className="list-disc list-inside flex flex-col gap-1">
        <li>Account information (name, email, password)</li>
        <li>Claim-related information you enter (dates, descriptions, insurer information, deadlines)</li>
        <li>Documents, photos, and files you upload as evidence</li>
        <li>Payment information (processed by Stripe — see Section 5)</li>
        <li>Communications with our support team</li>
      </ul>
      <p className="font-semibold">2.2 Information Collected Automatically</p>
      <ul className="list-disc list-inside flex flex-col gap-1">
        <li>Usage data (pages visited, features used, timestamps)</li>
        <li>Device and browser information</li>
        <li>Cookies and similar technologies necessary for the app to function</li>
      </ul>

      <h2 className="font-display text-base font-bold mt-4">3. How We Use Your Information</h2>
      <p>We use your information to:</p>
      <ul className="list-disc list-inside flex flex-col gap-1">
        <li>Provide, maintain, and improve the WholeClaim service</li>
        <li>Process your documents and claim information through our AI systems to generate summaries, analyses, and organizational suggestions</li>
        <li>Calculate your Claim Grade / documentation score</li>
        <li>Process payments and manage your subscription or entitlements</li>
        <li>Send service-related communications (deadline reminders, account notices)</li>
        <li>Respond to support requests</li>
        <li>Comply with legal obligations</li>
      </ul>
      <p>
        <strong>We do not sell your personal information.</strong>
      </p>

      <h2 className="font-display text-base font-bold mt-4">4. AI Processing of Your Content</h2>
      <p>
        To provide certain features (such as Policy Decoder, Loss-Count
        Auditor, Estimate Gap Analyzer, Decision Assistant, Letter
        Builder, and other analysis tools), WholeClaim sends relevant
        portions of the information and documents you provide to a
        third-party AI provider (Anthropic) for processing. This
        processing is used solely to generate the analysis, summary, or
        draft you requested. Anthropic processes this data under its own
        API terms and does not use it to train its models by default
        under standard API usage. <em>[Confirm this characterization
        against Anthropic&apos;s current API terms and your specific
        account configuration before publishing.]</em>
      </p>

      <h2 className="font-display text-base font-bold mt-4">5. Third-Party Service Providers</h2>
      <p>
        We use the following third-party services to operate WholeClaim,
        each of which processes certain data on our behalf under their
        own privacy and security terms:
      </p>
      <ul className="list-disc list-inside flex flex-col gap-1">
        <li><strong>Supabase</strong> — database hosting, authentication, and file storage</li>
        <li><strong>Stripe</strong> — payment processing. WholeClaim does not store your full credit card number; Stripe handles this directly.</li>
        <li><strong>Vercel</strong> — application hosting</li>
        <li><strong>Anthropic</strong> — AI processing of claim documentation for analysis features (see Section 4)</li>
        <li><strong>Resend</strong> — email delivery, including account sign-in links and Claim Grade result emails (which may include your name, email address, and claim grade/score)</li>
      </ul>

      <h2 className="font-display text-base font-bold mt-4">6. Data Retention</h2>
      <p>
        We retain your information for as long as your account is active
        or as needed to provide the service. Billing and entitlement
        records (including refund and dispute history) are retained even
        after a claim is deleted, in order to maintain accurate financial
        and audit records. You may request deletion of your account and
        associated data, subject to the retention requirements described
        above and applicable law, by contacting
        support@getwholeclaim.com.
      </p>

      <h2 className="font-display text-base font-bold mt-4">7. Data Security</h2>
      <p>
        We use reasonable administrative, technical, and physical
        safeguards to protect your information, including encrypted
        storage and access controls. No system is completely secure, and
        we cannot guarantee absolute security.
      </p>

      <h2 className="font-display text-base font-bold mt-4">8. Your Rights and Choices</h2>
      <p>
        Depending on your location, you may have the right to access,
        correct, delete, or export your personal information. You may
        exercise these rights by contacting us at
        support@getwholeclaim.com. You may cancel your subscription and
        delete your account at any time through your account settings.
      </p>

      <h2 className="font-display text-base font-bold mt-4">9. Children&apos;s Privacy</h2>
      <p>
        WholeClaim is not directed to individuals under 18. We do not
        knowingly collect personal information from children.
      </p>

      <h2 className="font-display text-base font-bold mt-4">10. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. Material
        changes will be communicated via the app or email prior to
        taking effect.
      </p>

      <h2 className="font-display text-base font-bold mt-4">11. Contact</h2>
      <p>
        Questions about this Privacy Policy or your data:
        support@getwholeclaim.com
      </p>

      <p className="text-xs text-ink/50 border-t border-ink/10 pt-4 mt-2">
        <strong>Open items carried over from the source draft, unresolved
        — not decided here:</strong> the operating entity name in Section
        1 (WholeClaim&apos;s corporate structure, separate from A&amp;K
        Construction LLC, needs confirming with counsel); the Anthropic
        data-usage characterization in Section 4; and this document must
        be updated if the platform name ever changes from WholeClaim.
      </p>
    </LegalLayout>
  );
}
