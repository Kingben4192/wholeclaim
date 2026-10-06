import type { Metadata } from "next";
import { LegalLayout, PlaceholderNotice } from "../(legal)/LegalLayout";

export const metadata: Metadata = { title: "Cookie Notice | WholeClaim" };

export default function CookiesPage() {
  return (
    <LegalLayout title="Cookie Notice">
      <PlaceholderNotice />
      <p>
        WholeClaim sets the session cookies Supabase Auth uses to keep you
        signed in, and one first-party cookie named wc_attribution. That
        cookie records how you arrived, such as a referrer or campaign, and
        the first page you opened, so that information can be stored with
        your account if you sign up. It is httpOnly, lasts 30 days, and is
        limited to this site. No analytics or advertising cookies are in
        place as of this build. If analytics is added later, this notice
        needs to be filled in before that ships (per{" "}
        <code className="font-mono text-xs">
          04_Engineering/Production-Build-Brief.md §7.7
        </code>
        ).
      </p>
    </LegalLayout>
  );
}
