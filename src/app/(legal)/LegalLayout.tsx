import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

// Auth-blindness fix (bug investigation, 2026-08-02), applied once here
// rather than in each of the 4 pages that use this shared layout
// (privacy, terms, cookies, ai-disclaimer) -- same "one place decides"
// principle as getClaimDisplayTitle (Decision #75), just applied to the
// header's login link instead of a claim title. Same pattern already
// shipped for the homepage and /help: a signed-in visitor sees "My
// account," not an unconditional "Log in" that gives no indication
// they're already signed in.
export async function LegalLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  let isSignedIn = false;
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isSignedIn = !!user;
  }

  return (
    <main className="min-h-screen flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between border-b border-ink/10">
        <Link
          href="/"
          className="font-display font-extrabold uppercase tracking-[0.06em] text-sm"
        >
          Whole<span className="text-ledger">Claim</span>
        </Link>
        {isSignedIn ? (
          <Link href="/account" className="text-sm font-semibold text-ledger">
            My account
          </Link>
        ) : (
          <Link href="/login" className="text-sm font-semibold text-ledger">
            Log in
          </Link>
        )}
      </header>
      <div className="max-w-2xl w-full mx-auto px-6 py-16">
        <h1 className="font-display text-2xl font-extrabold mb-8">{title}</h1>
        <div className="prose-legal text-sm leading-relaxed text-ink flex flex-col gap-4">
          {children}
        </div>
      </div>
    </main>
  );
}

export function PlaceholderNotice() {
  return (
    <div className="border-2 border-red-700 bg-red-50 rounded-sm px-4 py-3 text-sm text-red-900">
      <strong>Draft placeholder — not published.</strong> This page needs to be
      drafted from a Termly baseline and reviewed by counsel before it goes
      live (per <code className="font-mono text-xs">07_Legal/Legal-Compliance-Notes.md</code>).
      The text below is structural scaffolding only, not a reviewed legal
      document.
    </div>
  );
}
