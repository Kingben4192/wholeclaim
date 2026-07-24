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
// stored one, never recomputed. This is an approximation (the band's
// floor, not the real original number, which was never stored) — a
// pre-existing, accepted limitation of this component, not something
// introduced or changed here (Decision #40 scope: DB schema is out of
// bounds for this fix).
function baselineTotal(letter: string): number {
  const band = GRADE_BANDS.find((b) => b.g === letter.toUpperCase());
  return band ? band.min : 0;
}

const GRADE_ORDER = ['F', 'D', 'C', 'B', 'A'];

// Bug fix (2026-07-24 beta report): the previous version defaulted a
// missing baseline (claims.baseline_grade === null, i.e. claim created
// without ever running the Grader Quiz first) to letter 'F' / 0 points,
// which rendered as a real "F, 0/100" on the Started side — indistinguishable
// from an actual F baseline. Combined with comparing letter grades only
// (not raw points), a real, substantial score increase that didn't cross a
// letter-band boundary (e.g. 0 -> 36, both "F") produced zero visible
// acknowledgment: two "F"s side by side and a banner telling the user to
// start improving what they'd already improved. Confirmed via a real
// affected user's actual claim data. Fixed by (1) treating "no baseline"
// as its own neutral state, never a fabricated F/0, and (2) classifying
// progress from the numeric total, not just the letter, so a same-band
// improvement is distinguished from true no-change.
export type ProgressState =
  | { kind: 'no_baseline' }
  | { kind: 'letter_improved'; lettersUp: number; pointsUp: number }
  | { kind: 'numeric_improved'; pointsUp: number }
  | { kind: 'no_change' }
  | { kind: 'declined'; pointsDown: number; letterDeclined: boolean };

export function classifyProgress(
  hasBaseline: boolean,
  beforeLetter: string,
  beforeTotal: number,
  afterLetter: string,
  afterTotal: number,
): ProgressState {
  if (!hasBaseline) return { kind: 'no_baseline' };

  const letterDiff = GRADE_ORDER.indexOf(afterLetter) - GRADE_ORDER.indexOf(beforeLetter);
  const pointsDiff = afterTotal - beforeTotal;

  if (letterDiff > 0) {
    return { kind: 'letter_improved', lettersUp: letterDiff, pointsUp: pointsDiff };
  }
  if (letterDiff < 0 || pointsDiff < 0) {
    return { kind: 'declined', pointsDown: Math.abs(pointsDiff), letterDeclined: letterDiff < 0 };
  }
  if (pointsDiff > 0) {
    return { kind: 'numeric_improved', pointsUp: pointsDiff };
  }
  return { kind: 'no_change' };
}

export default function BeforeAfterGrade({
  current,
  baselineGrade,
  claimCreatedAt,
}: BeforeAfterProps) {
  const hasBaseline = Boolean(baselineGrade);
  const beforeLetter = baselineGrade ? baselineGrade.toUpperCase() : null;
  const beforeTotal = beforeLetter ? baselineTotal(beforeLetter) : null;
  const afterLetter = current.grade;
  const startedDate = new Date(claimCreatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const progress = classifyProgress(hasBaseline, beforeLetter ?? 'F', beforeTotal ?? 0, afterLetter, current.total);

  return (
    <div className="rounded-xl border border-neutral-200 p-4 bg-gradient-to-br from-neutral-50 to-white">
      <p className="text-xs font-medium uppercase text-neutral-500 mb-3">Your Progress</p>
      <div className="flex items-center justify-between">
        <div className="text-center flex-1">
          <p className="text-xs text-neutral-400 mb-1">Started {startedDate}</p>
          {hasBaseline && beforeLetter !== null && beforeTotal !== null ? (
            <>
              <p className={`text-4xl font-bold ${gradeColor(beforeLetter)}`}>{beforeLetter}</p>
              <p className="text-xs text-neutral-500">{beforeTotal}/100</p>
            </>
          ) : (
            <>
              <p className="text-4xl font-bold text-neutral-300">—</p>
              <p className="text-xs text-neutral-500">No baseline yet</p>
            </>
          )}
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

      {progress.kind === 'no_baseline' && (
        <div className="mt-4 rounded-lg bg-neutral-100 px-3 py-2 text-center">
          <p className="text-sm text-neutral-600">
            This is your first Documentation Score for this claim — keep building your file to see it improve.
          </p>
        </div>
      )}
      {progress.kind === 'letter_improved' && (
        <div className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-center">
          <p className="text-sm font-medium text-emerald-800">
            You&apos;ve moved up {progress.lettersUp} letter grade{progress.lettersUp > 1 ? 's' : ''}
            {progress.pointsUp > 0 ? ` (+${progress.pointsUp} points)` : ''} by organizing your file.
          </p>
        </div>
      )}
      {progress.kind === 'numeric_improved' && (
        <div className="mt-4 rounded-lg bg-sky-50 px-3 py-2 text-center">
          <p className="text-sm font-medium text-sky-800">
            Your score improved by {progress.pointsUp} point{progress.pointsUp > 1 ? 's' : ''} — still {afterLetter},
            but getting closer to the next grade.
          </p>
        </div>
      )}
      {progress.kind === 'no_change' && (
        <div className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-center">
          <p className="text-sm text-amber-800">Upload evidence or log a call to start improving your grade.</p>
        </div>
      )}
      {progress.kind === 'declined' && (
        <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-center">
          <p className="text-sm font-medium text-red-800">
            Your score has gone down {progress.pointsDown} point{progress.pointsDown > 1 ? 's' : ''} since you started
            {progress.letterDeclined ? ', dropping to a lower grade' : ''}.
          </p>
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
