import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./claim/actions";

// Minimal, shared account menu for the authenticated app area (2026-07-22 —
// reported: no way to sign out from the claim workspace or anywhere else).
// No header/nav component existed anywhere in the app before this. Not
// added to the root layout: the public homepage already has its own
// bespoke header with a "Sign in" link (src/app/page.tsx) — adding a
// second global header there would duplicate it. Instead this is dropped
// into the top of each authenticated page directly (account, claim list,
// claim workspace, claim wizard) — simple composition, no route-group
// restructuring, no file moves.
//
// Reuses the existing signOut server action (src/app/claim/actions.ts)
// verbatim — supabase.auth.signOut() + redirect("/login") — rather than
// duplicating it. claim/page.tsx previously had its own inline
// Account/Sign out links; those are replaced by this same component for
// one consistent implementation instead of two.
export async function AccountMenu() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-ink/10 text-sm mb-8 -mx-6 sm:mx-0 sm:rounded-sm sm:border">
      <Link href="/account" className="font-display font-bold text-ink">
        WholeClaim
      </Link>
      <div className="flex items-center gap-4">
        <Link href="/account" className="text-ink/60 hover:text-ink">
          Account
        </Link>
        <Link href="/claim" className="text-ink/60 hover:text-ink">
          My Claims
        </Link>
        <form action={signOut}>
          <button type="submit" className="text-ink/60 hover:text-ink underline">
            Log out
          </button>
        </form>
      </div>
    </div>
  );
}
