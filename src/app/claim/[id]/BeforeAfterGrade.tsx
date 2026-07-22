'use client';

import type { DocumentationScoreClientView } from '@/lib/scoring/documentationScore';
import { GRADE_BANDS } from '@/lib/grader/rubric';

interface BeforeAfterProps {
  // Client-safe view ONLY — never the full DocumentationScoreResult
  // (weights, maxes, and raw points must never reach a Client Component;
  // Decision #40). No raw points/max are rendered anywhere below, only
  // total/grade and per-category status labels.
  current: DocumentationScoreClientView;
  baselineGrade?: string | null;
  claimCreatedAt: string;
}

function gradeColor(letter: string): string {
  if (letter === 'A') return 'text-emerald-700';
  if (letter === 'B') return 'text-lime-700';
  if (letter === 'C') return 'text-amber-700';
  return 'text-red-700';
}

const STATUS_LABEL: Record<DocumentationScoreClientView['categories'][number]['status'], string> = {
  strong: 'Strong',
  solid: 'Solid',
  needs_attention: 'Needs Attention',
  critical_gap: 'Critical Gap',
};

const STATUS_COLOR: Record<DocumentationScoreClientView['categories'][number]['status'], string> = {
  strong: 'text-emerald-700 bg-emerald-50',
  solid: 'text-lime-700 bg-lime-50',
  needs_attention: 'text-amber-700 bg-amber-50',
  critical_gap: 'text-red-700 bg-red-50',
};

// Reverse-maps a stored grader letter (claims.baseline_grade) to a
// representative /100 number for the "before" sub-label, using the
// grader's OWN band minimums (src/lib/grader/rubric.ts GRADE_BANDS) — the
// "before" side always comes from the public Grader Quiz (Decision #29),
// a different scoring system entirely from the Documentation Score shown
// on the "after" side, so it stays pegged to its own scale rather than the
// Documentation Score's grade bands. The letter itself is always the
// stored one, never recomputed.
function baselineTotal(letter: string | null | undefined): number {
  if (!letter) return 0;
  const band = GRADE_BANDS.find((b) => b.g === letter.toUpperCase());
  return band ? band.min : 0;
}

export default function BeforeAfterGrade({
  current,
  baselineGrade,
  claimCreatedAt,
}: BeforeAfterProps) {
  const beforeLetter = baselineGrade ? baselineGrade.toUpperCase() : 'F';
  const beforeTotal = baselineTotal(baselineGrade);
  const afterLetter = current.grade;
  const gradeValues = ['F', 'D', 'C', 'B', 'A'];
  const gradesImproved = gradeValues.indexOf(afterLetter) - gradeValues.indexOf(beforeLetter);
  const startedDate = new Date(claimCreatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="rounded-xl border border-neutral-200 p-4 bg-gradient-to-br from-neutral-50 to-white">
      <p className="text-xs font-medium uppercase text-neutral-500 mb-3">Your Progress</p>
      <div className="flex items-center justify-between">
        <div className="text-center flex-1">
          <p className="text-xs text-neutral-400 mb-1">Started {startedDate}</p>
          <p className={`text-4xl font-bold ${gradeColor(beforeLetter)}`}>{beforeLetter}</p>
          <p className="text-xs text-neutral-500">{beforeTotal}/100</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <svg width="40" height="24" viewBox="0 0 40 24" className="text-neutral-300">
            <path d="M0 12 H32 M24 4 L34 12 L24 20" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        </div>
        <div className="text-center flex-1">
          <p className="text-xs text-neutral-400 mb-1">Today</p>
          <p className={`text-4xl font-bold ${gradeColor(afterLetter)}`}>{afterLetter}</p>
          <p className="text-xs text-neutral-500">{current.total}/100</p>
        </div>
      </div>
      {gradesImproved > 0 && (
        <div className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-center">
          <p className="text-sm font-medium text-emerald-800">
            You&apos;ve moved up {gradesImproved} letter grade{gradesImproved > 1 ? 's' : ''} by organizing your file.
          </p>
        </div>
      )}
      {gradesImproved === 0 && current.total < 100 && (
        <div className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-center">
          <p className="text-sm text-amber-800">Upload evidence or log a call to start improving your grade.</p>
        </div>
      )}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {current.categories.map((cat) => (
          <div key={cat.key} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md bg-white/60">
            <span className="text-xs text-neutral-600 truncate">{cat.label}</span>
            <span
              className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${STATUS_COLOR[cat.status]}`}
            >
              {STATUS_LABEL[cat.status]}
            </span>
          </div>
        ))}
      </div>
      {current.recommendations.length > 0 && (
        <div className="mt-4 border-t border-neutral-200 pt-3">
          <p className="text-xs font-medium uppercase text-neutral-500 mb-2">Next steps</p>
          <ul className="flex flex-col gap-1">
            {current.recommendations.slice(0, 3).map((rec, i) => (
              <li key={i} className="text-sm text-neutral-700">
                {rec.description}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
