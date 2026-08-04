import type { Metadata } from "next";
import Link from "next/link";
import { PublicPageHeader } from "@/app/_components/PublicPageHeader";
import { ResourceFilter } from "./ResourceFilter";
import { CHECKLISTS } from "@/lib/checklists";
import { UNIVERSAL_DISCLAIMER } from "@/lib/anthropic/outputFilter";

export const metadata: Metadata = {
  title: "Resource Library | WholeClaim",
  description: "Free documentation checklists for water, fire, wind & hail, and theft damage.",
};

// Resource Library shell (Decision #96, spec section 4). Explicitly a
// static collection, not the parked interactive-Academy concept -- no
// accounts, no progress tracking, no quizzes. v1 content is the 4
// Emergency Checklists (section 2); other categories in the spec's own
// organizing scheme (General Prep, Insurance Basics) have no real content
// yet and aren't stubbed out here with placeholder guides.
export default async function ResourcesPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <PublicPageHeader />

      <div className="max-w-3xl w-full mx-auto px-6 py-16">
        <h1 className="font-display text-2xl font-extrabold mb-4">Resource Library</h1>
        <p className="text-sm text-ink/70 leading-relaxed mb-8">
          Free checklists for documenting property damage — organized by what happened to your
          home.
        </p>

        <div className="border-2 border-ledger bg-ledger/10 rounded-sm px-4 py-3 text-sm text-ink mb-10">
          {UNIVERSAL_DISCLAIMER}
        </div>

        <ResourceFilter checklists={CHECKLISTS} />

        <div className="flex justify-center mt-12 mb-1.5">
          <Link
            href="/grade"
            className="inline-flex items-center justify-center bg-hp-pine hover:bg-hp-pine-deep text-white px-6 py-3.5 rounded-[10px] font-bold text-sm transition-colors"
          >
            Check Your Claim Grade
          </Link>
        </div>

        <p className="text-xs text-ink/50 leading-relaxed text-center mt-8 border-t border-ink/10 pt-4">
          {UNIVERSAL_DISCLAIMER}
        </p>
      </div>
    </main>
  );
}
