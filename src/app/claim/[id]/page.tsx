import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { addEntry, addDeadline, addEvidenceItem } from "../actions";
import { EvidenceRow } from "./EvidenceRow";

export default async function ClaimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16">
        <p className="text-sm text-ink/60">
          Supabase isn&apos;t configured yet — add
          <code className="font-mono mx-1">NEXT_PUBLIC_SUPABASE_URL</code>
          and
          <code className="font-mono mx-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
          to <code className="font-mono">.env.local</code> to open this claim.
        </p>
      </main>
    );
  }

  const supabase = await createClient();

  const [{ data: claim }, { data: entries }, { data: deadlines }, { data: evidenceItems }] =
    await Promise.all([
      supabase.from("claims").select("*").eq("id", id).single(),
      supabase
        .from("entries")
        .select("id, date, type, contact, summary")
        .eq("claim_id", id)
        .order("date", { ascending: false }),
      supabase
        .from("deadlines")
        .select("id, title, due_date")
        .eq("claim_id", id)
        .order("due_date", { ascending: true }),
      supabase
        .from("evidence_items")
        .select("id, label, checked")
        .eq("claim_id", id)
        .order("created_at", { ascending: true }),
    ]);

  if (!claim) notFound();

  const boundAddEntry = addEntry.bind(null, id);
  const boundAddDeadline = addDeadline.bind(null, id);
  const boundAddEvidenceItem = addEvidenceItem.bind(null, id);

  return (
    <main className="max-w-2xl mx-auto px-6 py-16 flex flex-col gap-12">
      <header>
        <h1 className="font-display text-2xl font-extrabold mb-1">
          {claim.carrier || "Unnamed carrier"}
        </h1>
        <p className="text-sm text-ink/60 font-mono">
          {claim.claim_number || "no claim #"} · {claim.damage_category || "damage type not set"}
        </p>
      </header>

      {/* Deadlines */}
      <section>
        <h2 className="font-display text-xs font-bold uppercase tracking-[0.1em] text-ink/60 mb-4">
          Deadline Tracker
        </h2>
        <div className="border border-ink/15 rounded-sm mb-4">
          {deadlines && deadlines.length > 0 ? (
            deadlines.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between px-3 py-2.5 text-sm border-t border-ink/10 first:border-t-0"
              >
                <span>{d.title}</span>
                <span className="font-mono text-xs text-ink/60">
                  {d.due_date}
                </span>
              </div>
            ))
          ) : (
            <p className="px-3 py-3 text-sm text-ink/50">
              Nothing logged yet. The first entry takes thirty seconds.
            </p>
          )}
        </div>
        <form action={boundAddDeadline} className="flex gap-2">
          <input
            name="title"
            placeholder="Suit limitation, follow-up..."
            required
            className="flex-1 text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white"
          />
          <input
            type="date"
            name="due_date"
            required
            className="text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white font-mono"
          />
          <button className="bg-ledger text-paper px-4 py-2 rounded-sm font-semibold text-sm">
            Add
          </button>
        </form>
      </section>

      {/* Binder log */}
      <section>
        <h2 className="font-display text-xs font-bold uppercase tracking-[0.1em] text-ink/60 mb-4">
          The Binder
        </h2>
        <div className="border border-ink/15 rounded-sm mb-4">
          {entries && entries.length > 0 ? (
            entries.map((e) => (
              <div
                key={e.id}
                className="px-3 py-2.5 text-sm border-t border-ink/10 first:border-t-0"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono uppercase text-ledger">
                    {e.type}
                  </span>
                  {e.contact && (
                    <span className="text-xs text-ink/50">{e.contact}</span>
                  )}
                  <span className="ml-auto text-xs font-mono text-ink/50">
                    {e.date}
                  </span>
                </div>
                <p>{e.summary}</p>
              </div>
            ))
          ) : (
            <p className="px-3 py-3 text-sm text-ink/50">
              Nothing logged yet. The first entry takes thirty seconds.
            </p>
          )}
        </div>
        <form action={boundAddEntry} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <select
              name="type"
              defaultValue="call"
              className="text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white"
            >
              <option value="call">Call</option>
              <option value="email">Email</option>
              <option value="visit">Visit</option>
              <option value="photo">Photo</option>
              <option value="letter">Letter</option>
              <option value="payment">Payment</option>
              <option value="note">Note</option>
            </select>
            <input
              name="contact"
              placeholder="Who"
              className="flex-1 text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white"
            />
          </div>
          <textarea
            name="summary"
            required
            placeholder="What happened"
            rows={2}
            className="text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white"
          />
          <button className="self-start bg-ledger text-paper px-4 py-2 rounded-sm font-semibold text-sm">
            Log entry
          </button>
        </form>
      </section>

      {/* Evidence checklist */}
      <section>
        <h2 className="font-display text-xs font-bold uppercase tracking-[0.1em] text-ink/60 mb-4">
          Evidence Checklist
        </h2>
        <div className="border border-ink/15 rounded-sm mb-4">
          {evidenceItems && evidenceItems.length > 0 ? (
            evidenceItems.map((item) => (
              <EvidenceRow key={item.id} claimId={id} item={item} />
            ))
          ) : (
            <p className="px-3 py-3 text-sm text-ink/50">
              Nothing logged yet. The first entry takes thirty seconds.
            </p>
          )}
        </div>
        <form action={boundAddEvidenceItem} className="flex gap-2">
          <input
            name="label"
            placeholder="Before photos, mitigation invoice..."
            required
            className="flex-1 text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white"
          />
          <button className="bg-ledger text-paper px-4 py-2 rounded-sm font-semibold text-sm">
            Add
          </button>
        </form>
      </section>
    </main>
  );
}
