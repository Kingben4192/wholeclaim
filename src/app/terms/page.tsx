import type { Metadata } from "next";
import { LegalLayout, PlaceholderNotice } from "../(legal)/LegalLayout";

export const metadata: Metadata = { title: "Terms of Service | WholeClaim" };

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service">
      <PlaceholderNotice />
      <p>
        WholeClaim is claim documentation software — not an insurance
        company, public adjuster, law firm, or claims negotiator. We never
        contact your insurer, never take a percentage, and never give legal
        advice. Nothing on this site or in the product is legal or insurance
        advice.
      </p>
    </LegalLayout>
  );
}
