"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

// Free tier, Phase 1 (Roadmap). Deterministic, not AI — same reasoning as
// the Depreciation Calculator: this presents tradeoffs from fixed,
// well-established rules, it never generates a case-specific verdict, so
// there's nothing here that needs a live model call. Product Bible /
// Decision #25: "AI explains, never decides" — this tool goes a step
// further and never even frames itself as deciding; it surfaces which of
// several fixed factors apply to the user's own answers and leaves the
// call to them, same posture as the Decision Assistant.

type Answers = {
  status: string;
  gap: string;
  complexity: string;
  confidence: string;
  time: string;
};

const QUESTIONS: {
  key: keyof Answers;
  q: string;
  opts: { value: string; label: string }[];
}[] = [
  {
    key: "status",
    q: "Where does your claim stand?",
    opts: [
      { value: "open", label: "Filed, waiting on the carrier" },
      { value: "offer", label: "Offer or partial payment received" },
      { value: "denied", label: "Denied" },
      { value: "nonrenewal", label: "Non-renewal notice received" },
    ],
  },
  {
    key: "gap",
    q: "Gap between what's owed and what's been offered (if known)",
    opts: [
      { value: "small", label: "Under $5,000" },
      { value: "moderate", label: "$5,000–$20,000" },
      { value: "large", label: "Over $20,000" },
      { value: "unknown", label: "Not sure yet" },
    ],
  },
  {
    key: "complexity",
    q: "How complex is the damage or dispute?",
    opts: [
      { value: "simple", label: "Single, straightforward repair" },
      { value: "multi", label: "Multiple trades or disputed scope" },
      { value: "major", label: "Structural damage or major loss" },
    ],
  },
  {
    key: "confidence",
    q: "How confident do you feel documenting and negotiating this yourself?",
    opts: [
      { value: "high", label: "Very confident" },
      { value: "medium", label: "Somewhat confident" },
      { value: "low", label: "Not confident at all" },
    ],
  },
  {
    key: "time",
    q: "Time available to manage this yourself",
    opts: [
      { value: "plenty", label: "Plenty of time" },
      { value: "limited", label: "Limited time" },
      { value: "little", label: "Very little time" },
    ],
  },
];

type Factor = { label: string; detail: string };

function computeFactors(a: Answers): { paFactors: Factor[]; selfFactors: Factor[] } {
  const paFactors: Factor[] = [];
  const selfFactors: Factor[] = [];

  if (a.status === "denied" || a.status === "nonrenewal") {
    paFactors.push({
      label: "Claim denied or non-renewed",
      detail: "Disputing a denial or non-renewal often involves more back-and-forth with the carrier than a straightforward payment dispute.",
    });
  }
  if (a.gap === "large") {
    paFactors.push({
      label: "Large dollar gap",
      detail: "A public adjuster's fee (commonly 10–15% of the additional recovery, regulated in most states) is easier to justify against a larger gap.",
    });
  } else if (a.gap === "small") {
    selfFactors.push({
      label: "Small dollar gap",
      detail: "On a smaller gap, a percentage-based fee can consume a meaningful share of what you'd actually recover.",
    });
  }
  if (a.complexity === "multi" || a.complexity === "major") {
    paFactors.push({
      label: "Multiple trades, disputed scope, or major loss",
      detail: "More moving parts generally means more time spent reconciling estimates and coordinating documentation.",
    });
  } else if (a.complexity === "simple") {
    selfFactors.push({
      label: "Single, straightforward repair",
      detail: "A single-trade repair with a clear scope is usually the easiest case to document and negotiate yourself.",
    });
  }
  if (a.confidence === "low") {
    paFactors.push({
      label: "Low confidence handling this yourself",
      detail: "A public adjuster brings experience negotiating with carriers day-to-day, which can offset unfamiliarity with the process.",
    });
  } else if (a.confidence === "high") {
    selfFactors.push({
      label: "High confidence handling this yourself",
      detail: "With a documented file and a clear grasp of the process, many homeowners handle straightforward claims themselves.",
    });
  }
  if (a.time === "little") {
    paFactors.push({
      label: "Very little time available",
      detail: "A public adjuster takes on the day-to-day communication and paperwork, which costs money but saves your own time.",
    });
  } else if (a.time === "plenty") {
    selfFactors.push({
      label: "Plenty of time available",
      detail: "Self-documentation is mostly a time investment — logging calls, gathering evidence, following up in writing.",
    });
  }

  return { paFactors, selfFactors };
}

export function PublicAdjusterGuide() {
  const [expanded, setExpanded] = useState(false);
  const [answers, setAnswers] = useState<Partial<Answers>>({});
  const [showResult, setShowResult] = useState(false);

  const allAnswered = QUESTIONS.every((q) => answers[q.key]);
  const { paFactors, selfFactors } = showResult && allAnswered
    ? computeFactors(answers as Answers)
    : { paFactors: [], selfFactors: [] };

  return (
    <div className="border border-ink/15 rounded-sm">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div>
          <div className="font-display font-bold text-sm">Should I Hire a Public Adjuster?</div>
          <div className="text-xs text-ink/50">
            A tradeoff guide based on your situation — never a recommendation.
          </div>
        </div>
        {expanded ? (
          <ChevronUp size={16} className="text-ink/40 shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-ink/40 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-ink/10 pt-4 flex flex-col gap-4">
          {!showResult && (
            <>
              <div className="flex flex-col gap-3">
                {QUESTIONS.map((q) => (
                  <div key={q.key}>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-1.5 text-ink/60">
                      {q.q}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {q.opts.map((o) => (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => setAnswers((a) => ({ ...a, [q.key]: o.value }))}
                          className={`text-xs px-3 py-1.5 rounded-sm border ${
                            answers[q.key] === o.value
                              ? "border-ledger bg-ledger/10 text-ledger font-semibold"
                              : "border-ink/15 text-ink/70"
                          }`}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowResult(true)}
                disabled={!allAnswered}
                className="self-start bg-ledger text-paper px-4 py-2 rounded-sm font-semibold text-sm disabled:opacity-50"
              >
                Show my tradeoffs
              </button>
            </>
          )}

          {showResult && (
            <>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-ledger mb-2">
                  Factors that often make a public adjuster worth considering
                </p>
                {paFactors.length > 0 ? (
                  <ul className="flex flex-col gap-2">
                    {paFactors.map((f) => (
                      <li key={f.label} className="text-sm">
                        <span className="font-semibold">{f.label}.</span>{" "}
                        <span className="text-ink/70">{f.detail}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-ink/50">None of your answers point this direction.</p>
                )}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-ink/60 mb-2">
                  Factors that often mean self-handling is enough
                </p>
                {selfFactors.length > 0 ? (
                  <ul className="flex flex-col gap-2">
                    {selfFactors.map((f) => (
                      <li key={f.label} className="text-sm">
                        <span className="font-semibold">{f.label}.</span>{" "}
                        <span className="text-ink/70">{f.detail}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-ink/50">None of your answers point this direction.</p>
                )}
              </div>
              <p className="text-sm text-ink/70 leading-relaxed">
                Public adjuster fees are typically a percentage of the
                additional amount they recover (commonly 10–15%, regulated
                in most states) — most work on contingency, meaning no fee
                if they recover nothing more than the carrier already
                offered. Whichever way you lean, WholeClaim&apos;s
                documentation tools work the same either way — a well-kept
                file helps you, a public adjuster, or an attorney equally.
              </p>
              <p className="text-xs text-ink/40 italic">
                This is a tradeoff guide, not a recommendation — the
                decision is yours. WholeClaim is a self-help documentation
                tool, not legal or insurance advice.
              </p>
              <button
                type="button"
                onClick={() => setShowResult(false)}
                className="self-start text-xs font-semibold text-ledger uppercase tracking-wide"
              >
                Change my answers
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
