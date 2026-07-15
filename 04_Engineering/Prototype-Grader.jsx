import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2, RefreshCw, AlertTriangle, Stamp as StampIcon } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Claim Grade — public lead-capture assessment                        */
/*  Same case-file design language as Claim Binder:                     */
/*  paper #F2F1EC · surface #FBFAF7 · ink #1B1F1D · rule #D7D4CA        */
/*  ledger green #1E4B3C · stamp red #A32C1C · brass #8A6D2F            */
/* ------------------------------------------------------------------ */
const C = {
  paper: "#F2F1EC", surface: "#FBFAF7", ink: "#1B1F1D", rule: "#D7D4CA",
  muted: "#6E7069", green: "#1E4B3C", greenSoft: "#E4EBE6",
  red: "#A32C1C", redSoft: "#F4E3DF", amber: "#8A6D2F", amberSoft: "#F0E9D8",
};
const DISPLAY = { fontFamily: "'Archivo', system-ui, sans-serif" };
const MONO = { fontFamily: "'IBM Plex Mono', ui-monospace, monospace" };

const LEADS_KEY = "grader-leads-v1";

/* ------------------------------------------------------------------ */
/*  Scoring rubric — deterministic. Five categories, 20 points each.    */
/* ------------------------------------------------------------------ */
const CATEGORIES = ["Evidence", "Paper Trail", "Deadlines", "Policy Command", "Leverage"];

const QUESTIONS = [
  {
    id: "status", cat: null, context: true,
    q: "Where does your claim stand right now?",
    opts: [
      { t: "Filed — waiting on the carrier", v: "open" },
      { t: "Offer or partial payment received", v: "offer" },
      { t: "Denied", v: "denied" },
      { t: "Non-renewal notice received", v: "nonrenewal" },
    ],
  },
  {
    id: "damage", cat: null, context: true,
    q: "What kind of damage is it?",
    opts: [
      { t: "Water / plumbing", v: "water" },
      { t: "Roof / storm / wind / hail", v: "roof" },
      { t: "Fire / smoke", v: "fire" },
      { t: "Other property damage", v: "other" },
    ],
  },
  {
    id: "photos", cat: "Evidence",
    q: "Did you photograph or video the damage before anything was repaired or cleaned up?",
    opts: [
      { t: "Yes — thorough, every room and angle", pts: 20 },
      { t: "Some photos, not systematic", pts: 10 },
      { t: "No — repairs started first", pts: 2 },
    ],
  },
  {
    id: "log", cat: "Paper Trail",
    q: "Do you keep a written log of every call and email with the carrier?",
    opts: [
      { t: "Every contact — date, name, what was said", pts: 10 },
      { t: "Some of it, scattered", pts: 5 },
      { t: "No — it's mostly in my head", pts: 1 },
    ],
  },
  {
    id: "writing", cat: "Paper Trail",
    q: "After phone calls, do you confirm what was said in writing?",
    opts: [
      { t: "Always — follow-up email every time", pts: 10 },
      { t: "Sometimes", pts: 5 },
      { t: "Never thought to", pts: 1 },
    ],
  },
  {
    id: "suit", cat: "Deadlines",
    q: "Do you know your policy's deadline to file suit (the suit limitation clause)?",
    opts: [
      { t: "Yes — I have the exact date tracked", pts: 14 },
      { t: "I've heard of it, haven't found mine", pts: 6 },
      { t: "Never heard of it", pts: 0 },
    ],
  },
  {
    id: "age", cat: "Deadlines",
    q: "How long ago was the loss?",
    opts: [
      { t: "Under 6 months", pts: 6 },
      { t: "6–12 months", pts: 4 },
      { t: "1–2 years", pts: 2 },
      { t: "Over 2 years", pts: 0 },
    ],
  },
  {
    id: "policy", cat: "Policy Command",
    q: "Do you have your complete policy — declarations, forms, and endorsements — and have you read it?",
    opts: [
      { t: "Have it all and read it", pts: 20 },
      { t: "Have it, haven't really read it", pts: 10 },
      { t: "Don't have the full policy", pts: 2 },
    ],
  },
  {
    id: "estimate", cat: "Leverage",
    q: "Has the carrier's estimate been checked against real contractor pricing?",
    opts: [
      { t: "Yes — independent contractor estimate in hand", pts: 20 },
      { t: "Rough comparison only", pts: 10 },
      { t: "No — only the carrier's numbers", pts: 2 },
    ],
  },
];

const GRADE_BANDS = [
  { min: 88, g: "A", tone: "green", line: "Exhibit-ready. You're running this claim like a case file." },
  { min: 75, g: "B", tone: "green", line: "Strong file with a few gaps a carrier could exploit." },
  { min: 60, g: "C", tone: "amber", line: "Average — which is exactly what carriers price for." },
  { min: 45, g: "D", tone: "red", line: "The carrier knows more about your claim than your file does." },
  { min: 0, g: "F", tone: "red", line: "Right now this claim runs on memory and trust. Fixable — fast." },
];

/* ------------------------------------------------------------------ */
/*  Knowledge injection — mini version of the Claim Binder library.     */
/*  Production: pulled from the maintained statute/code/price library.  */
/* ------------------------------------------------------------------ */
const KNOWLEDGE = {
  GA: `JURISDICTION KNOWLEDGE (GEORGIA — verified library entries):
- O.C.G.A. 33-4-6: bad-faith refusal to pay remedy. Requires a proper written demand and a 60-day window before suit; penalty can reach 50 percent of the loss or 5,000 dollars, whichever is greater, plus attorney's fees.
- O.C.G.A. 33-24-46: governs notice and permissible grounds for cancellation and non-renewal of covered property policies. A policyholder can demand the specific statutory and factual basis for non-renewal in writing, including an itemized list of counted loss occurrences.
- Regulator: Office of Commissioner of Insurance and Safety Fire. Accepts consumer complaints online; a documented complaint file strengthens every later step.
- Occurrence counting: a supplemental payment on an existing loss is not a new occurrence. Miscounting supplements as separate losses is a known non-renewal driver worth auditing.`,
  DEFAULT: `JURISDICTION KNOWLEDGE (GENERAL — verify for the user's state):
- Most property policies contain a suit limitation clause (often 1 to 2 years from the date of loss) that can bar recovery entirely if missed.
- Most states set claims-handling time standards for acknowledgment and decision, enforced by the state insurance department, which accepts consumer complaints.
- A supplemental payment on an existing loss is generally not a new occurrence; occurrence counting drives non-renewal decisions and is worth auditing.`,
};

async function callClaude(prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error("Analysis service error — your grade below still stands. Tap retry for the full breakdown.");
  const data = await res.json();
  return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
}

/* ------------------------------------------------------------------ */
export default function ClaimGrade() {
  const [phase, setPhase] = useState("intro"); // intro → quiz → gate → results
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [lead, setLead] = useState({ name: "", email: "", usState: "", consent: false });
  const [aiOut, setAiOut] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiErr, setAiErr] = useState("");

  /* ---------- scoring ---------- */
  const scores = () => {
    const s = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
    QUESTIONS.forEach((q) => {
      if (q.cat && answers[q.id] !== undefined) s[q.cat] += q.opts[answers[q.id]].pts;
    });
    return s;
  };
  const total = () => Object.values(scores()).reduce((a, b) => a + b, 0);
  const band = () => GRADE_BANDS.find((b) => total() >= b.min);

  /* ---------- flow ---------- */
  const pick = (i) => {
    const q = QUESTIONS[step];
    setAnswers((a) => ({ ...a, [q.id]: i }));
    if (step < QUESTIONS.length - 1) setStep(step + 1);
    else setPhase("gate");
  };

  const saveLead = async () => {
    try {
      let arr = [];
      try {
        const r = await window.storage.get(LEADS_KEY);
        if (r && r.value) arr = JSON.parse(r.value);
      } catch (e) { /* first lead */ }
      arr.push({
        name: lead.name, email: lead.email, usState: lead.usState,
        grade: band().g, score: total(), at: new Date().toISOString(),
      });
      await window.storage.set(LEADS_KEY, JSON.stringify(arr));
    } catch (e) {
      console.error("Lead save failed", e);
    }
  };

  const runBreakdown = async () => {
    setAiLoading(true);
    setAiErr("");
    const s = scores();
    const answerLines = QUESTIONS.map((q) => {
      const a = answers[q.id];
      return `${q.q} -> ${a !== undefined ? q.opts[a].t : "—"}`;
    }).join("\n");
    const kb = lead.usState.trim().toUpperCase().startsWith("GA") ? KNOWLEDGE.GA : KNOWLEDGE.DEFAULT;
    const prompt = `You are the results engine for "Claim Grade," a free self-assessment for homeowners with property insurance claims. The grade and category scores are already computed deterministically — do not change them. Your job is the personalized breakdown.

${kb}

ASSESSMENT ANSWERS:
${answerLines}

COMPUTED RESULTS:
Overall grade: ${band().g} (${total()}/100)
Category scores (of 20): ${CATEGORIES.map((c) => `${c} ${s[c]}`).join(", ")}
First name: ${lead.name || "there"}
State: ${lead.usState || "not given"}

Write the breakdown under these headings, plain text only, ALL-CAPS headings, no markdown symbols: WHERE YOUR CLAIM STANDS / YOUR THREE FIXES THIS WEEK / THE BIGGEST RISK ON YOUR FILE / DEADLINE NOTE. Address the person by first name once. Be concrete and specific to their answers; each fix must be doable in under an hour. Use the jurisdiction knowledge only where it genuinely applies, and tell them to verify statute details for their situation. This is an educational assessment, not legal advice — say so in one closing line.`;
    try {
      const out = await callClaude(prompt);
      setAiOut(out);
    } catch (e) {
      setAiErr(e.message);
    }
    setAiLoading(false);
  };

  const submitGate = async () => {
    await saveLead();
    setPhase("results");
    runBreakdown();
  };

  const restart = () => {
    setPhase("intro"); setStep(0); setAnswers({});
    setAiOut(""); setAiErr("");
  };

  const gateValid = lead.name.trim() && lead.email.includes("@") && lead.consent;

  /* ---------- ui pieces ---------- */
  const toneColor = { green: C.green, amber: C.amber, red: C.red };
  const toneSoft = { green: C.greenSoft, amber: C.amberSoft, red: C.redSoft };

  const Shell = ({ children }) => (
    <div className="min-h-screen" style={{ background: C.paper, color: C.ink, fontFamily: "'Public Sans', system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=Public+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');`}</style>
      <div className="max-w-xl mx-auto px-4 pt-8 pb-12">
        <div className="mb-6">
          <div className="text-xl font-extrabold uppercase" style={{ ...DISPLAY, letterSpacing: "0.06em" }}>
            Claim<span style={{ color: C.green }}> Grade</span>
          </div>
          <div className="text-xs uppercase tracking-widest mt-0.5" style={{ color: C.muted }}>
            by the Claim Binder Method
          </div>
        </div>
        <div className="border rounded-sm p-5 sm:p-6" style={{ borderColor: C.rule, background: C.surface }}>
          {children}
        </div>
        <p className="text-xs mt-4 leading-relaxed" style={{ color: C.muted }}>
          Claim Grade is an educational self-assessment, not legal, insurance, or financial advice. Your answers
          generate your results; your contact details are used to send your grade and claim documentation tips.
        </p>
      </div>
    </div>
  );

  /* ---------- phases ---------- */
  if (phase === "intro") {
    return (
      <Shell>
        <div className="inline-block px-2 py-1 border-2 rounded-sm text-xs font-bold uppercase tracking-widest mb-4"
          style={{ ...MONO, borderColor: C.red, color: C.red, transform: "rotate(-3deg)" }}>
          Free · 2 minutes
        </div>
        <h1 className="text-3xl font-extrabold leading-tight uppercase mb-3" style={DISPLAY}>
          What grade is your insurance claim?
        </h1>
        <p className="text-sm leading-relaxed mb-2" style={{ color: C.ink }}>
          Your carrier already graded you. They know how organized you are, whether you track deadlines,
          and whether anyone has checked their numbers. Eight questions tell you what they see — and the
          three fixes that change it this week.
        </p>
        <p className="text-sm leading-relaxed mb-5" style={{ color: C.muted }}>
          Built by a contractor who audited his own carrier's math and found a $1,235 rating error.
        </p>
        <button onClick={() => setPhase("quiz")}
          className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold uppercase tracking-wide rounded-sm"
          style={{ background: C.green, color: "#F5F4EC" }}>
          Grade my claim <ArrowRight size={16} />
        </button>
      </Shell>
    );
  }

  if (phase === "quiz") {
    const q = QUESTIONS[step];
    return (
      <Shell>
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => (step === 0 ? setPhase("intro") : setStep(step - 1))}
            className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide"
            style={{ color: C.muted }}>
            <ArrowLeft size={14} /> Back
          </button>
          <span className="text-xs" style={{ ...MONO, color: C.muted }}>
            {step + 1} / {QUESTIONS.length}
          </span>
        </div>
        <div className="h-1 rounded-sm mb-5" style={{ background: C.rule }}>
          <div className="h-1 rounded-sm" style={{ background: C.green, width: `${((step + 1) / QUESTIONS.length) * 100}%` }} />
        </div>
        <h2 className="text-lg font-bold mb-4" style={{ ...DISPLAY }}>{q.q}</h2>
        <div className="space-y-2">
          {q.opts.map((o, i) => (
            <button key={i} onClick={() => pick(i)}
              className="w-full text-left border rounded-sm px-4 py-3 text-sm font-medium"
              style={{
                borderColor: answers[q.id] === i ? C.green : C.rule,
                background: answers[q.id] === i ? C.greenSoft : "#FFFFFF",
                color: C.ink,
              }}>
              {o.t}
            </button>
          ))}
        </div>
      </Shell>
    );
  }

  if (phase === "gate") {
    return (
      <Shell>
        <div className="inline-block px-2 py-1 border rounded-sm text-xs font-bold uppercase tracking-widest mb-4"
          style={{ ...MONO, borderColor: C.green, color: C.green, background: C.greenSoft }}>
          Assessment complete
        </div>
        <h2 className="text-2xl font-extrabold uppercase mb-2" style={DISPLAY}>Your grade is stamped.</h2>
        <p className="text-sm mb-5" style={{ color: C.muted }}>
          Tell us where to send it and the full breakdown — your three fixes for this week included.
        </p>
        <div className="space-y-3">
          <input className="w-full text-sm px-3 py-2.5 rounded-sm border bg-white focus:outline-none focus:ring-2"
            style={{ borderColor: C.rule }} placeholder="First name"
            value={lead.name} onChange={(e) => setLead({ ...lead, name: e.target.value })} />
          <input className="w-full text-sm px-3 py-2.5 rounded-sm border bg-white focus:outline-none focus:ring-2"
            style={{ borderColor: C.rule }} placeholder="Email" inputMode="email"
            value={lead.email} onChange={(e) => setLead({ ...lead, email: e.target.value })} />
          <input className="w-full text-sm px-3 py-2.5 rounded-sm border bg-white focus:outline-none focus:ring-2"
            style={{ borderColor: C.rule }} placeholder="State (e.g. GA)" maxLength={20}
            value={lead.usState} onChange={(e) => setLead({ ...lead, usState: e.target.value })} />
          <button onClick={() => setLead({ ...lead, consent: !lead.consent })}
            className="w-full flex items-start gap-2 text-left text-xs leading-relaxed"
            style={{ color: C.muted }}>
            <span className="mt-0.5 inline-flex items-center justify-center w-4 h-4 border rounded-sm shrink-0"
              style={{ borderColor: lead.consent ? C.green : C.rule, background: lead.consent ? C.green : "#FFFFFF" }}>
              {lead.consent && <Check size={12} color="#F5F4EC" />}
            </span>
            <span>Send my results and occasional claim documentation tips by email. Unsubscribe anytime.</span>
          </button>
        </div>
        <button onClick={submitGate} disabled={!gateValid}
          className="mt-4 inline-flex items-center gap-2 px-5 py-3 text-sm font-bold uppercase tracking-wide rounded-sm disabled:opacity-40"
          style={{ background: C.green, color: "#F5F4EC" }}>
          Show my grade <ArrowRight size={16} />
        </button>
      </Shell>
    );
  }

  /* results */
  const b = band();
  const s = scores();
  return (
    <Shell>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <div className="text-xs uppercase tracking-widest mb-1" style={{ color: C.muted }}>
            {lead.name ? `${lead.name}, your` : "Your"} claim grade
          </div>
          <div className="text-sm font-semibold" style={{ color: C.ink }}>{b.line}</div>
          <div className="text-xs mt-1" style={{ ...MONO, color: C.muted }}>{total()} / 100</div>
        </div>
        <div className="shrink-0 w-20 h-20 border-4 rounded-sm flex items-center justify-center text-5xl font-extrabold"
          style={{ ...DISPLAY, borderColor: toneColor[b.tone], color: toneColor[b.tone], background: toneSoft[b.tone], transform: "rotate(-6deg)", borderStyle: "double" }}
          aria-label={`Grade ${b.g}`}>
          {b.g}
        </div>
      </div>

      <div className="space-y-2 mb-6">
        {CATEGORIES.map((c) => (
          <div key={c}>
            <div className="flex justify-between text-xs mb-0.5">
              <span className="font-semibold uppercase tracking-wide" style={{ color: C.ink }}>{c}</span>
              <span style={{ ...MONO, color: C.muted }}>{s[c]}/20</span>
            </div>
            <div className="h-1.5 rounded-sm" style={{ background: C.rule }}>
              <div className="h-1.5 rounded-sm"
                style={{ width: `${(s[c] / 20) * 100}%`, background: s[c] >= 14 ? C.green : s[c] >= 8 ? C.amber : C.red }} />
            </div>
          </div>
        ))}
      </div>

      {aiLoading && (
        <div className="flex items-center gap-2 text-sm mb-4" style={{ color: C.muted }}>
          <Loader2 size={16} className="animate-spin" /> Writing your breakdown...
        </div>
      )}
      {aiErr && (
        <div className="mb-4">
          <div className="flex items-start gap-2 text-sm mb-2" style={{ color: C.red }}>
            <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {aiErr}
          </div>
          <button onClick={runBreakdown} className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide"
            style={{ color: C.green }}>
            <RefreshCw size={14} /> Retry breakdown
          </button>
        </div>
      )}
      {aiOut && (
        <div className="border rounded-sm p-4 text-sm whitespace-pre-wrap leading-relaxed mb-6"
          style={{ borderColor: C.rule, background: "#FFFFFF", color: C.ink }}>
          {aiOut}
        </div>
      )}

      <div className="border-2 rounded-sm p-4" style={{ borderColor: C.green, background: C.greenSoft }}>
        <div className="text-sm font-bold uppercase tracking-wide mb-1" style={{ ...DISPLAY, color: C.green }}>
          Raise the grade
        </div>
        <p className="text-sm mb-3" style={{ color: C.ink }}>
          Every point you're missing is a system you don't have yet. The Claim Binder Method is that system —
          the same documentation playbook used to audit a carrier's own math.
        </p>
        <a href="#" className="inline-block px-4 py-2.5 text-sm font-bold uppercase tracking-wide rounded-sm"
          style={{ background: C.green, color: "#F5F4EC" }}>
          Get the Claim Binder system
        </a>
        <div className="text-xs mt-2" style={{ ...MONO, color: C.muted }}>[wire button to your Gumroad link]</div>
      </div>

      <button onClick={restart} className="mt-4 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide"
        style={{ color: C.muted }}>
        <RefreshCw size={14} /> Retake the assessment
      </button>
    </Shell>
  );
}
