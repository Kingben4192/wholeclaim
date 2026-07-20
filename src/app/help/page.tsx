import type { Metadata } from "next";
import { LegalLayout } from "../(legal)/LegalLayout";

export const metadata: Metadata = { title: "Help | WholeClaim" };

// Placeholder destination for the homepage v2 header's "Help" pill
// (docs/wholeclaim_spec_homepage_and_roadmap.md, Part 1.2) — the real
// Help Center isn't built yet. Deliberately doesn't reference a support
// email address: support@wholeclaim.com's deliverability is still an open,
// unconfirmed gate (07_Legal/Legal-Compliance-Notes.md).
export default function HelpPage() {
  return (
    <LegalLayout title="Help">
      <p>The Help Center is still being built.</p>
      <p>
        If you&apos;re signed in, the fastest way to reach us for now is
        through your account.
      </p>
    </LegalLayout>
  );
}
