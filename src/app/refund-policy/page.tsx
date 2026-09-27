import type { Metadata } from "next";
import { LegalLayout, PlaceholderNotice } from "../(legal)/LegalLayout";

export const metadata: Metadata = { title: "Refund Policy | WholeClaim" };

export default function RefundPolicyPage() {
  return (
    <LegalLayout title="Refund Policy">
      <PlaceholderNotice />
      <p>
        [FOUNDER COPY] Refund terms for WholeClaim Pro will live here before launch.
        This route exists now so footer links resolve cleanly while the final copy is
        reviewed.
      </p>
    </LegalLayout>
  );
}