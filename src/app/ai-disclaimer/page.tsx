import type { Metadata } from "next";
import { LegalLayout } from "../(legal)/LegalLayout";

export const metadata: Metadata = { title: "AI Disclaimer | WholeClaim" };

export default function AIDisclaimerPage() {
  return (
    <LegalLayout title="AI Disclaimer">
      <p>
        WholeClaim is a self-help documentation tool, not legal or insurance
        advice.
      </p>
      <p>
        WholeClaim is <strong>not</strong> an insurance company, a public
        adjuster, a law firm, or a claims negotiator. Nothing WholeClaim or
        its AI features produce is legal advice, and none of it is a
        guarantee or prediction of any claim outcome.
      </p>
      <h2 className="font-display text-base font-bold mt-4">
        How AI is used in this product
      </h2>
      <p>
        Every score and grade WholeClaim shows you — including the Claim
        Health Score and Claim Grade — is computed deterministically by fixed
        rules, not by AI. The same inputs always produce the same score, and
        every component is explained with its points and maximum. AI is used
        only to write plain-English explanations, letter drafts, and
        breakdowns from information already in your file or your answers —
        never to decide a score, a grade, or a coverage conclusion.
      </p>
      <p>
        Every AI-assisted output is something you review before you rely on
        it. WholeClaim never sends, files, or submits anything on your
        behalf — letters and drafts are yours to read, edit, and send
        yourself.
      </p>
      <p>
        In active litigation? Route every draft through your attorney before
        sending.
      </p>
      <h2 className="font-display text-base font-bold mt-4">
        Accuracy and verification
      </h2>
      <p>
        AI-assisted features draw on your own documents and a
        founder-curated knowledge library of statutes, codes, and pricing
        references. Where the system is uncertain or the library doesn&apos;t
        cover your situation, it says so rather than guessing — verify any
        statute, deadline, or figure against your own policy and your state&apos;s
        law before relying on it.
      </p>
    </LegalLayout>
  );
}
