import type { OnboardingProgress } from "@/lib/onboarding/progress";

// Read-only summary — no interactivity, no client JS needed. Every
// milestone reflects state already changed elsewhere on this page (the
// Evidence Checklist, the claim's own fields), so there's nothing to
// submit here. Hidden entirely by the caller once progress.complete is
// true — see claim/[id]/page.tsx for the handoff to BeforeAfterGrade.
export function OnboardingProgressCard({ progress }: { progress: OnboardingProgress }) {
  return (
    <div className="rounded-xl border border-neutral-200 p-4 bg-gradient-to-br from-neutral-50 to-white">
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <p className="text-xs font-medium uppercase text-neutral-500 shrink-0">Your Claim File</p>
        <p className="text-sm font-semibold text-ink shrink-0">{progress.percent}% Complete</p>
      </div>
      <ul className="flex flex-col gap-1.5">
        {progress.milestones.map((m) => (
          <li key={m.key} className="flex items-center gap-2 text-sm">
            <span className={m.done ? "text-emerald-700" : "text-neutral-300"} aria-hidden>
              {m.done ? "✓" : "○"}
            </span>
            <span className={m.done ? "text-ink" : "text-ink/50"}>{m.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
