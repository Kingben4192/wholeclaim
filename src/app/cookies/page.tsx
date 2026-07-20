import type { Metadata } from "next";
import { LegalLayout, PlaceholderNotice } from "../(legal)/LegalLayout";

export const metadata: Metadata = { title: "Cookie Notice | WholeClaim" };

export default function CookiesPage() {
  return (
    <LegalLayout title="Cookie Notice">
      <PlaceholderNotice />
      <p>
        WholeClaim currently sets only the essential cookies Supabase Auth
        needs to keep you signed in — no analytics or advertising cookies are
        in place as of this build. If analytics is added later, this notice
        needs to be filled in before that ships (per{" "}
        <code className="font-mono text-xs">
          04_Engineering/Production-Build-Brief.md §7.7
        </code>
        ).
      </p>
    </LegalLayout>
  );
}
