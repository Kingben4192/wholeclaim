'use client';

import type { ClaimHealthResult } from '@/lib/claimHealth';
import { GRADE_BANDS } from '@/lib/grader/rubric';

interface BeforeAfterProps {
  current: ClaimHealthResult;
  baselineGrade?: string | null;
  claimCreatedAt: string;
}

function letterGrade(total: number): string {
  if (total >= 90) return 'A';
  if (total >= 80) return 'B';
  if (total >= 70) return 'C';
  if (total >= 60) return 'D';
  return 'F';
}

function gradeColor(letter: string): string {
  if (letter === 'A') return 'text-emerald-700';
  if (letter === 'B') return 'text-lime-700';
  if (letter === 'C') return 'text-amber-700';
  return 'text-red-700';
}

// Reverse-maps a stored grader letter (claims.baseline_grade) to a
// representative /100 number for the "before" sub-label, using the
// grader's OWN band minimums (src/lib/grader/rubric.ts GRADE_BANDS) rather
// than this component's letterGrade() — the two use different thresholds,
// so round-tripping a stored "C" through the wrong scale would silently
// display as "D". The letter itself is always the stored one, never
// recomputed.
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
  const afterLetter = letterGrade(current.total);
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
      <div className="mt-4 grid grid-cols-4 gap-2 text-center">
        <div>
          <p className="text-xs text-neutral-500">Evidence</p>
          <p className="text-sm font-semibold">{current.evidence.points}/{current.evidence.max}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-500">Paper Trail</p>
          <p className="text-sm font-semibold">{current.paperTrail.points}/{current.paperTrail.max}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-500">Deadlines</p>
          <p className="text-sm font-semibold">{current.deadlines.points}/{current.deadlines.max}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-500">Freshness</p>
          <p className="text-sm font-semibold">{current.freshness.points}/{current.freshness.max}</p>
        </div>
      </div>
    </div>
  );
}
