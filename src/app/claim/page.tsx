import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { signOut } from "./actions";

export default async function ClaimListPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="font-display text-2xl font-extrabold mb-4">
          Your claims
        </h1>
        <p className="text-sm text-ink/60">
          Supabase isn&apos;t configured yet — add
          <code className="font-mono mx-1">NEXT_PUBLIC_SUPABASE_URL</code>
          and
          <code className="font-mono mx-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
          to <code className="font-mono">.env.local</code> to see claims here.
        </p>
      </main>
    );
  }

  const supabase = await createClient();
  const { data: claims } = await supabase
    .from("claims")
    .select("id, carrier, claim_number, damage_category, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      <div className="flex items-center justify-between mb-10">
        <h1 className="font-display text-2xl font-extrabold">Your claims</h1>
        <div className="flex items-center gap-4">
          <Link href="/account" className="text-sm text-ink/60 underline">
            Account
          </Link>
          <form action={signOut}>
            <button className="text-sm text-ink/60 underline">Sign out</button>
          </form>
        </div>
      </div>

      {claims && claims.length > 0 ? (
        <ul className="flex flex-col gap-3 mb-8">
          {claims.map((c) => (
            <li key={c.id}>
              <Link
                href={`/claim/${c.id}`}
                className="block border border-ink/15 rounded-sm px-4 py-3 hover:bg-ledger/5"
              >
                <div className="font-semibold text-sm">
                  {c.carrier || "Unnamed carrier"} — {c.claim_number || "no claim #"}
                </div>
                <div className="text-xs text-ink/50 font-mono">
                  {c.damage_category || "damage type not set"}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink/50 mb-8">
          Nothing logged yet. The first entry takes thirty seconds.
        </p>
      )}

      <Link
        href="/claim/new"
        className="inline-block bg-ledger text-paper px-6 py-3 rounded-sm font-semibold text-sm"
      >
        Start your claim file
      </Link>
    </main>
  );
}
