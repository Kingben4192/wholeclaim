import type { Metadata } from "next";
import Link from "next/link";
import { GraderQuiz } from "./GraderQuiz";

export const metadata: Metadata = {
  title: "Claim Grade — Free 2-Minute Assessment | WholeClaim",
  description:
    "Eight questions tell you what your insurance carrier already sees in your claim file — and the fixes that change it this week.",
};

export default function GradePage() {
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

      <div className="max-w-xl w-full mx-auto px-6 pt-10 pb-16">
        <div className="mb-6 text-center">
          <div className="font-display text-lg font-extrabold uppercase tracking-[0.06em]">
            Claim <span className="text-ledger">Grade</span>
          </div>
          <div className="text-xs uppercase tracking-widest text-ink/50 mt-0.5">
            by the Claim Binder Method
          </div>
        </div>

        <GraderQuiz />

        <p className="text-xs text-ink/40 leading-relaxed mt-4 text-center">
          Claim Grade is an educational self-assessment, not legal, insurance, or
          financial advice. Your answers generate your results; your contact
          details are used to send your grade and claim documentation tips.
        </p>
      </div>
    </main>
  );
}
