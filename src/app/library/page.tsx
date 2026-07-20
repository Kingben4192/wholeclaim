import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { IngestForm } from "./IngestForm";
import { DraftRow } from "./DraftRow";

function isAdmin(email: string | null | undefined): boolean {
  const allowed = process.env.ADMIN_EMAIL?.toLowerCase();
  return Boolean(allowed && email && email.toLowerCase() === allowed);
}

export default async function LibraryPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16">
        <p className="text-sm text-ink/60">Supabase isn&apos;t configured yet.</p>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16">
        <p className="text-sm text-ink/60">
          <Link href="/login" className="text-ledger underline">
            Sign in
          </Link>{" "}
          to continue.
        </p>
      </main>
    );
  }

  // Whole page is admin-only (Decision #10, Invariant) — not just the
  // approve action. Letting any authenticated user reach the ingest form
  // would let them queue AI calls into the founder's own review list even
  // without approve rights.
  if (!isAdmin(user.email)) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16">
        <p className="text-sm text-ink/60">This page isn&apos;t available.</p>
      </main>
    );
  }

  const [{ data: pending }, { data: rejected }, { data: approved }] = await Promise.all([
    supabase
      .from("library_entries")
      .select("id, type, jurisdiction, cite, summary, confidence, verify_note")
      .eq("owner_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    supabase
      .from("library_entries")
      .select("id, type, jurisdiction, cite, summary, confidence, verify_note")
      .eq("owner_id", user.id)
      .eq("status", "rejected")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("library_entries")
      .select("id, type, jurisdiction, cite, summary, verified_date")
      .is("owner_id", null)
      .eq("status", "approved")
      .order("verified_date", { ascending: false }),
  ]);

  return (
    <main className="max-w-2xl mx-auto px-6 py-16 flex flex-col gap-12">
      <header>
        <Link href="/claim" className="text-xs font-semibold text-ink/50 uppercase tracking-wide">
          &larr; Back to claims
        </Link>
        <h1 className="font-display text-2xl font-extrabold mt-2">Knowledge Library</h1>
        <p className="text-sm text-ink/60 mt-1">
          Nothing here influences any analysis until you approve it — draft
          entries stay owner-scoped and inert until then (Decision #10).
        </p>
      </header>

      <section>
        <h2 className="font-display text-xs font-bold uppercase tracking-[0.1em] text-ink/60 mb-4">
          Add material
        </h2>
        <IngestForm />
      </section>

      <section>
        <h2 className="font-display text-xs font-bold uppercase tracking-[0.1em] text-ink/60 mb-4">
          Pending review ({pending?.length ?? 0})
        </h2>
        <div className="border border-ink/15 rounded-sm">
          {pending && pending.length > 0 ? (
            pending.map((entry) => <DraftRow key={entry.id} entry={entry} />)
          ) : (
            <p className="px-4 py-3 text-sm text-ink/50">Nothing pending review.</p>
          )}
        </div>
      </section>

      {rejected && rejected.length > 0 && (
        <section>
          <h2 className="font-display text-xs font-bold uppercase tracking-[0.1em] text-ink/60 mb-4">
            Recently rejected
          </h2>
          <div className="border border-ink/15 rounded-sm">
            {rejected.map((entry) => (
              <div key={entry.id} className="px-4 py-3 border-t border-ink/10 first:border-t-0 text-sm text-ink/50">
                <span className="font-mono text-xs uppercase">{entry.type}</span> · {entry.cite}
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-display text-xs font-bold uppercase tracking-[0.1em] text-ink/60 mb-4">
          Approved &amp; live ({approved?.length ?? 0})
        </h2>
        <div className="border border-ink/15 rounded-sm">
          {approved && approved.length > 0 ? (
            approved.map((entry) => (
              <div key={entry.id} className="px-4 py-3 border-t border-ink/10 first:border-t-0 text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono uppercase text-ledger">{entry.type}</span>
                  <span className="text-xs text-ink/50">{entry.jurisdiction}</span>
                  <span className="ml-auto text-xs font-mono text-ink/40">
                    verified {entry.verified_date ?? "—"}
                  </span>
                </div>
                <p className="font-semibold mb-1">{entry.cite}</p>
                <p className="text-ink/80">{entry.summary}</p>
              </div>
            ))
          ) : (
            <p className="px-4 py-3 text-sm text-ink/50">
              Nothing approved yet — this is what every AI tool actually
              draws on, so it starts empty.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
