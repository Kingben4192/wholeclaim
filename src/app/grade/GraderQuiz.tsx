"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2, RefreshCw } from "lucide-react";
import { QUESTIONS, CATEGORIES, type GraderAnswers } from "@/lib/grader/rubric";
import { submitGrade, type SubmitGradeResult } from "./actions";
import { FirstPhotoCapture } from "./FirstPhotoCapture";

type Phase = "intro" | "quiz" | "gate" | "results";

export function GraderQuiz() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<GraderAnswers>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [usState, setUsState] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitGradeResult | null>(null);

  function pick(i: number) {
    const q = QUESTIONS[step];
    const next = { ...answers, [q.id]: i };
    setAnswers(next);
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      setPhase("gate");
    }
  }

  async function submit() {
    setError(null);
    setSubmitting(true);
    const res = await submitGrade({ answers, name, email, usState, consent });
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setResult(res);
    setPhase("results");
  }

  function restart() {
    setPhase("intro");
    setStep(0);
    setAnswers({});
    setResult(null);
    setError(null);
  }

  const gateValid = name.trim().length > 0 && email.includes("@") && consent;

  if (phase === "intro") {
    return (
      <div className="border border-ink/15 rounded-sm p-6 bg-white">
        <div className="inline-block px-2 py-1 border-2 border-red-700 text-red-700 rounded-sm text-xs font-bold uppercase tracking-widest mb-4 font-mono">
          Free · 2 minutes
        </div>
        <h1 className="font-display text-2xl font-extrabold uppercase leading-tight mb-3">
          What grade is your insurance claim?
        </h1>
        <p className="text-sm leading-relaxed text-ink mb-2">
          Your carrier already graded you. They know how organized you are, whether
          you track deadlines, and whether anyone has checked their numbers. Eight
          questions tell you what they see — and the three fixes that change it
          this week.
        </p>
        <button
          onClick={() => setPhase("quiz")}
          className="inline-flex items-center gap-2 bg-ledger text-paper px-5 py-3 rounded-sm font-semibold text-sm mt-3"
        >
          Grade my claim <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  if (phase === "quiz") {
    const q = QUESTIONS[step];
    return (
      <div className="border border-ink/15 rounded-sm p-6 bg-white">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => (step === 0 ? setPhase("intro") : setStep(step - 1))}
            className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-ink/50"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <span className="text-xs font-mono text-ink/50">
            {step + 1} / {QUESTIONS.length}
          </span>
        </div>
        <div className="h-1 rounded-sm bg-ink/10 mb-5">
          <div
            className="h-1 rounded-sm bg-ledger"
            style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }}
          />
        </div>
        <h2 className="font-display text-lg font-bold mb-4">{q.q}</h2>
        <div className="space-y-2">
          {q.opts.map((o, i) => (
            <button
              key={i}
              onClick={() => pick(i)}
              className={`w-full text-left border rounded-sm px-4 py-3 text-sm font-medium ${
                answers[q.id] === i
                  ? "border-ledger bg-ledger/10"
                  : "border-ink/15 bg-white"
              }`}
            >
              {o.t}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (phase === "gate") {
    return (
      <div className="border border-ink/15 rounded-sm p-6 bg-white">
        <div className="inline-block px-2 py-1 border border-ledger bg-ledger/10 text-ledger rounded-sm text-xs font-bold uppercase tracking-widest mb-4 font-mono">
          Assessment complete
        </div>
        <h2 className="font-display text-xl font-extrabold uppercase mb-2">
          Your grade is stamped.
        </h2>
        <p className="text-sm text-ink/60 mb-5">
          Tell us where to send it and the full breakdown.
        </p>
        <div className="space-y-3">
          <input
            className="w-full text-sm px-3 py-2.5 rounded-sm border border-ink/20 bg-white"
            placeholder="First name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="w-full text-sm px-3 py-2.5 rounded-sm border border-ink/20 bg-white"
            placeholder="Email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full text-sm px-3 py-2.5 rounded-sm border border-ink/20 bg-white"
            placeholder="State (e.g. GA)"
            maxLength={20}
            value={usState}
            onChange={(e) => setUsState(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setConsent(!consent)}
            className="w-full flex items-start gap-2 text-left text-xs leading-relaxed text-ink/60"
          >
            <span
              className={`mt-0.5 inline-flex items-center justify-center w-4 h-4 border rounded-sm shrink-0 ${
                consent ? "border-ledger bg-ledger" : "border-ink/20 bg-white"
              }`}
            >
              {consent && <Check size={12} className="text-paper" />}
            </span>
            <span>
              Send my results and occasional claim documentation tips by email.
              Unsubscribe anytime.
            </span>
          </button>
        </div>
        {error && <p className="text-sm text-red-700 mt-3">{error}</p>}
        <button
          onClick={submit}
          disabled={!gateValid || submitting}
          className="mt-4 inline-flex items-center gap-2 bg-ledger text-paper px-5 py-3 rounded-sm font-semibold text-sm disabled:opacity-40"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
          Show my grade
        </button>
      </div>
    );
  }

  if (!result || !result.ok) return null;

  const toneClass =
    result.grade === "A" || result.grade === "B"
      ? "border-ledger text-ledger bg-ledger/10"
      : result.grade === "C"
        ? "border-amber-700 text-amber-700 bg-amber-50"
        : "border-red-700 text-red-700 bg-red-50";

  return (
    <div className="border border-ink/15 rounded-sm p-6 bg-white">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <div className="text-xs uppercase tracking-widest text-ink/50 mb-1">
            {name ? `${name}, your` : "Your"} claim grade
          </div>
          <div className="text-sm font-semibold">{result.line}</div>
          <div className="text-xs font-mono text-ink/50 mt-1">{result.score} / 100</div>
        </div>
        <div
          className={`shrink-0 w-20 h-20 border-4 rounded-sm flex items-center justify-center font-display text-5xl font-extrabold ${toneClass}`}
        >
          {result.grade}
        </div>
      </div>

      <div className="space-y-2 mb-6">
        {CATEGORIES.map((c) => (
          <div key={c}>
            <div className="flex justify-between text-xs mb-0.5">
              <span className="font-semibold uppercase tracking-wide">{c}</span>
              <span className="font-mono text-ink/50">{result.scores[c]}/20</span>
            </div>
            <div className="h-1.5 rounded-sm bg-ink/10">
              <div
                className="h-1.5 rounded-sm bg-ledger"
                style={{ width: `${(result.scores[c] / 20) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {result.emailed ? (
        <>
          <div className="border-2 border-ledger bg-ledger/10 rounded-sm p-4 mb-4">
            <div className="font-display text-sm font-bold uppercase tracking-wide text-ledger mb-1">
              Check your email
            </div>
            <p className="text-sm text-ink">
              We sent your full breakdown to <strong>{email}</strong>, with a link
              to create your claim file — pre-filled from what you told us.
            </p>
          </div>
          <FirstPhotoCapture email={email} />
        </>
      ) : (
        <p className="text-sm text-ink/60">
          Your result is saved. Email delivery isn&apos;t configured on this
          environment yet, so use{" "}
          <a href="/login" className="text-ledger underline">
            the sign-in link
          </a>{" "}
          with this email address to start your claim file.
        </p>
      )}

      <button
        onClick={restart}
        className="mt-4 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-ink/50"
      >
        <RefreshCw size={14} /> Retake the assessment
      </button>
    </div>
  );
}
