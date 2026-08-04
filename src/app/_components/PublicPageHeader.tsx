import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

// Shared header for the new content surfaces (Resource Library, Disaster
// Response Center, checklist pages -- Decision #96). Same auth-aware
// header shape already shipped independently on the homepage, /help, and
// LegalLayout.tsx ((legal) route group) -- extracted here once rather
// than duplicated a fourth time, since this family of pages (unlike the
// legal pages) isn't under one shared route segment that could use a
// single layout.tsx.
export async function PublicPageHeader() {
  let isSignedIn = false;
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isSignedIn = Boolean(user);
  }

  return (
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
  );
}
