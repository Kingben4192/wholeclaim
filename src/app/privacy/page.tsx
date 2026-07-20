import type { Metadata } from "next";
import { LegalLayout, PlaceholderNotice } from "../(legal)/LegalLayout";

export const metadata: Metadata = { title: "Privacy Policy | WholeClaim" };

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy">
      <PlaceholderNotice />
      <p>
        WholeClaim is self-help claim documentation software. We are not an
        insurance company, public adjuster, law firm, or claims negotiator.
        Your data is yours: export everything or delete your account,
        self-serve, anytime — see Account &amp; Data below.
      </p>
      <h2 className="font-display text-base font-bold mt-4">
        Account &amp; data controls (live today)
      </h2>
      <p>
        Regardless of this page&apos;s draft status, the underlying controls are
        real and available now from your account settings: full data export
        (your claim data as JSON, plus your uploaded files) and full account
        deletion, which removes your database rows and your uploaded files
        from storage. Neither requires a support ticket.
      </p>
    </LegalLayout>
  );
}
