import type { Metadata } from "next";
import { LegalLayout, PlaceholderNotice } from "../(legal)/LegalLayout";

export const metadata: Metadata = { title: "Refund Policy | WholeClaim" };

export default function RefundPolicyPage() {
  return (
    <LegalLayout title="Refund Policy">
      <p>
        WholeClaim Pro is $19/month (plus applicable tax) and renews automatically each
        month until you cancel. You can cancel anytime, online, from your account
        settings. You&apos;ll keep Pro access through the end of your current billing period
        and won&apos;t be charged again.
      </p>
      <p>
        If you&apos;re not satisfied, email {" "}
        <a href="mailto:support@getwholeclaim.com" className="underline underline-offset-2">
          support@getwholeclaim.com
        </a>{" "}
        within 7 days of any charge for a full refund of that charge. Refunds go back to
        your original payment method, usually within 5–10 business days.
      </p>
      <p>
        Canceling doesn&apos;t delete your claims or files.
      </p>
    </LegalLayout>
  );
}