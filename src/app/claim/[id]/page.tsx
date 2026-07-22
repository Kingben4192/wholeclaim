import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { addEntry, addDeadline, addEvidenceItem } from "../actions";
import { EvidenceRow } from "./EvidenceRow";
import { FileRow } from "./FileRow";
import CameraCapture from "./CameraCapture";
import { PendingPhotoUploader } from "./PendingPhotoUploader";
import BeforeAfterGrade from "./BeforeAfterGrade";
import { PolicyDecoderCard } from "./PolicyDecoderCard";
import { LossCountAuditorCard } from "./LossCountAuditorCard";
import { EstimateGapAnalyzerCard } from "./EstimateGapAnalyzerCard";
import { DecisionAssistantCard } from "./DecisionAssistantCard";
import { LetterBuilderCard } from "./LetterBuilderCard";
import { MoldTimelineCard } from "./MoldTimelineCard";
import { SupplementAssistantCard } from "./SupplementAssistantCard";
import { DepreciationCalculator } from "./DepreciationCalculator";
import { PublicAdjusterGuide } from "./PublicAdjusterGuide";
import { LossOfUseTracker } from "./LossOfUseTracker";
import { PushReminderToggle } from "@/app/push/PushReminderToggle";
import { computeDocumentationScore, toClientView } from "@/lib/scoring/documentationScore";
import { isPro as resolveIsPro, resolveProAccessSource } from "@/lib/entitlements";
import { ensureGuaranteeSnapshot } from "@/lib/guarantee";
import { computeOnboardingProgress } from "@/lib/onboarding/progress";
import { OnboardingProgressCard } from "./OnboardingProgress";
import { AccountMenu } from "@/app/AccountMenu";

export default async function ClaimDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ seed?: string }>;
}) {
  const { id } = await params;
  const { seed } = await searchParams;
  const seedDeadlineTitle =
    seed === "suit" ? "Suit limitation — find and verify in your policy" : undefined;

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

  const [
    { data: claim },
    { data: entries },
    { data: deadlines },
    { data: evidenceItems },
    { data: files },
    { data: lossOfUseExpenses },
    {
      data: { user },
    },
  ] =
    await Promise.all([
      supabase.from("claims").select("*").eq("id", id).single(),
      supabase
        .from("entries")
        .select("id, date, type, contact, summary, created_at")
        .eq("claim_id", id)
        .order("date", { ascending: false }),
      supabase
        .from("deadlines")
        .select("id, title, due_date, created_at")
        .eq("claim_id", id)
        .order("due_date", { ascending: true }),
      supabase
        .from("evidence_items")
        .select("id, label, checked, file_id, category, created_at")
        .eq("claim_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("files")
        .select("id, kind, original_name, uploaded_at, storage_path")
        .eq("claim_id", id)
        .order("uploaded_at", { ascending: false }),
      supabase
        .from("loss_of_use_expenses")
        .select("id, date, category, amount, description")
        .eq("claim_id", id)
        .order("date", { ascending: false }),
      supabase.auth.getUser(),
    ]);

  if (!claim) notFound();

  // Billing Build Order Step 5: UI display now reflects the same
  // isPro(claimId, userId) resolver the server actions actually enforce —
  // previously this read profiles.plan directly, which a claim-only
  // lifetime purchaser (no subscription) would fail even though the real
  // server-side gate would correctly allow them through. UI hiding alone
  // is never the enforcement (requireProAccess in claim/actions.ts is);
  // this only fixes what the page displays to match reality.
  const isPro = user ? await resolveIsPro(supabase, id, user.id) : false;
  const proSource = user && isPro ? await resolveProAccessSource(supabase, id, user.id) : null;

  const documentationScore = computeDocumentationScore({
    claim: {
      dateOfLoss: claim.date_of_loss ?? null,
      damageCategory: claim.damage_category ?? null,
      offerAmount: claim.offer_amount !== null && claim.offer_amount !== undefined ? Number(claim.offer_amount) : null,
    },
    entries: entries ?? [],
    deadlines: deadlines ?? [],
    evidenceItems: evidenceItems ?? [],
    files: files ?? [],
  });

  // Claim Completion Progress System (Onboarding Step 5) — purely derived,
  // no stored percentage, computed fresh from the same claim/evidenceItems
  // rows already fetched above. Never influences documentationScore.
  const onboardingProgress = computeOnboardingProgress(
    { date_of_loss: claim.date_of_loss ?? null, damage_category: claim.damage_category ?? null },
    evidenceItems ?? [],
  );

  // Success Guarantee (Decision #36, Step 7): snapshot the Documentation
  // Score at the first Pro-user page load for this claim. No-op once a
  // snapshot already exists (claim_guarantee.claim_id is unique). This is
  // the closest reliable "at time of purchase" trigger available without
  // touching the webhook, which every prior step marked DO NOT MODIFY —
  // in the normal flow this fires within seconds of checkout's
  // ?upgraded=1 redirect back to this exact page.
  if (user && isPro) {
    await ensureGuaranteeSnapshot(supabase, id, user.id, documentationScore.total);
  }

  const filesWithUrls = await Promise.all(
    (files ?? []).map(async (f) => {
      const { data: signed } = await supabase.storage
        .from("evidence")
        .createSignedUrl(f.storage_path, 3600);
      return { ...f, url: signed?.signedUrl ?? null };
    }),
  );

  // Postgres numeric columns come back as strings via PostgREST (precision
  // safety) — convert once here rather than in the pure summary function.
  const lossOfUseExpensesTyped = (lossOfUseExpenses ?? []).map((e) => ({
    ...e,
    amount: Number(e.amount),
  }));

  const boundAddEntry = addEntry.bind(null, id);
  const boundAddDeadline = addDeadline.bind(null, id);
  const boundAddEvidenceItem = addEvidenceItem.bind(null, id);

  return (
    <main className="max-w-2xl mx-auto px-6 py-16 flex flex-col gap-12">
      <AccountMenu />
      <header>
        <h1 className="font-display text-2xl font-extrabold mb-1">
          {claim.carrier || "Unnamed carrier"}
        </h1>
        <p className="text-sm text-ink/60 font-mono">
          {claim.claim_number || "no claim #"} · {claim.damage_category || "damage type not set"}
        </p>
        {proSource === "subscription" && (
          <p className="text-xs font-semibold text-ledger mt-2">
            ✔ Included with your WholeClaim Pro subscription
          </p>
        )}
        {proSource === "lifetime" && (
          <p className="text-xs font-semibold text-ledger mt-2">
            💎 Included with your WholeClaim Pro lifetime claim access
          </p>
        )}
      </header>

      <PendingPhotoUploader claimId={id} userEmail={user?.email ?? null} />

      {/* Claim Completion Progress — shown only while setup is incomplete;
          hands off cleanly to the Documentation Score card below once
          every milestone is done, rather than showing two indicators
          indefinitely. */}
      {!onboardingProgress.complete && <OnboardingProgressCard progress={onboardingProgress} />}

      {/* Documentation Score — before/after against the grader's baseline.
          Only the client-safe view crosses into this Client Component —
          never the full result (weights/maxes/raw points stay server-side,
          Decision #40). */}
      <BeforeAfterGrade
        current={toClientView(documentationScore)}
        baselineGrade={claim.baseline_grade}
        claimCreatedAt={claim.created_at}
      />

      {/* Claim Education — free tier, no AI cost */}
      <section>
        <h2 className="font-display text-xs font-bold uppercase tracking-[0.1em] text-ink/60 mb-4">
          Claim Education
        </h2>
        <div className="flex flex-col gap-3">
          <DepreciationCalculator />
          <PublicAdjusterGuide />
        </div>
      </section>

      {/* Analysis */}
      <section>
        <h2 className="font-display text-xs font-bold uppercase tracking-[0.1em] text-ink/60 mb-4">
          Analysis
        </h2>
        <div className="flex flex-col gap-3">
          <PolicyDecoderCard claimId={id} />
          <MoldTimelineCard claimId={id} />
          <LossCountAuditorCard claimId={id} />
          <EstimateGapAnalyzerCard claimId={id} />
          <SupplementAssistantCard claimId={id} />
          <DecisionAssistantCard claimId={id} />
          <LetterBuilderCard claimId={id} />
        </div>
      </section>

      {/* Deadlines */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xs font-bold uppercase tracking-[0.1em] text-ink/60">
            Deadline Tracker
          </h2>
          <PushReminderToggle />
        </div>
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
            defaultValue={seedDeadlineTitle}
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

      {/* Loss-of-Use Tracker */}
      <LossOfUseTracker claimId={id} expenses={lossOfUseExpensesTyped} isPro={isPro} proSource={proSource} />

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

      {/* Evidence Vault */}
      <section>
        <h2 className="font-display text-xs font-bold uppercase tracking-[0.1em] text-ink/60 mb-4">
          Evidence Vault
        </h2>
        <div className="border border-ink/15 rounded-sm mb-4">
          {filesWithUrls.length > 0 ? (
            filesWithUrls.map((f) => (
              <FileRow key={f.id} claimId={id} file={f} />
            ))
          ) : (
            <p className="px-3 py-3 text-sm text-ink/50">
              No photos or documents yet. Upload the first one below.
            </p>
          )}
        </div>
        <CameraCapture claimId={id} />
        <p className="text-xs text-ink/40 mt-2">
          Photos and PDFs, up to 15MB. Stored privately — only you can view them.
        </p>
      </section>
    </main>
  );
}
