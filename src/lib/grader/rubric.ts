// Claim Grade — deterministic scoring rubric, ported verbatim from
// 04_Engineering/Prototype-Grader.jsx (tested IP, same as the AI prompt
// templates ported in M2). Decision #9 / Product Bible: the grade is always
// deterministic; scoring must never run client-side (Product Bible, "Claim
// Grade (public)" — "Never scores client-side").

export type GraderOption = { t: string; v?: string; pts?: number };
export type GraderQuestion = {
  id: string;
  cat: string | null;
  context?: boolean;
  q: string;
  opts: GraderOption[];
};

export const CATEGORIES = [
  "Evidence",
  "Paper Trail",
  "Deadlines",
  "Policy Command",
  "Leverage",
] as const;

export const QUESTIONS: GraderQuestion[] = [
  {
    id: "status",
    cat: null,
    context: true,
    q: "Where does your claim stand right now?",
    opts: [
      { t: "Filed — waiting on the carrier", v: "open" },
      { t: "Offer or partial payment received", v: "offer" },
      { t: "Denied", v: "denied" },
      { t: "Non-renewal notice received", v: "nonrenewal" },
    ],
  },
  {
    id: "damage",
    cat: null,
    context: true,
    q: "What kind of damage is it?",
    opts: [
      { t: "Water / plumbing", v: "water" },
      { t: "Roof / storm / wind / hail", v: "roof" },
      { t: "Fire / smoke", v: "fire" },
      { t: "Other property damage", v: "other" },
    ],
  },
  {
    id: "photos",
    cat: "Evidence",
    q: "Did you photograph or video the damage before anything was repaired or cleaned up?",
    opts: [
      { t: "Yes — thorough, every room and angle", pts: 20 },
      { t: "Some photos, not systematic", pts: 10 },
      { t: "No — repairs started first", pts: 2 },
    ],
  },
  {
    id: "log",
    cat: "Paper Trail",
    q: "Do you keep a written log of every call and email with the carrier?",
    opts: [
      { t: "Every contact — date, name, what was said", pts: 10 },
      { t: "Some of it, scattered", pts: 5 },
      { t: "No — it's mostly in my head", pts: 1 },
    ],
  },
  {
    id: "writing",
    cat: "Paper Trail",
    q: "After phone calls, do you confirm what was said in writing?",
    opts: [
      { t: "Always — follow-up email every time", pts: 10 },
      { t: "Sometimes", pts: 5 },
      { t: "Never thought to", pts: 1 },
    ],
  },
  {
    id: "suit",
    cat: "Deadlines",
    q: "Do you know your policy's deadline to file suit (the suit limitation clause)?",
    opts: [
      { t: "Yes — I have the exact date tracked", pts: 14 },
      { t: "I've heard of it, haven't found mine", pts: 6 },
      { t: "Never heard of it", pts: 0 },
    ],
  },
  {
    id: "age",
    cat: "Deadlines",
    q: "How long ago was the loss?",
    opts: [
      { t: "Under 6 months", pts: 6 },
      { t: "6–12 months", pts: 4 },
      { t: "1–2 years", pts: 2 },
      { t: "Over 2 years", pts: 0 },
    ],
  },
  {
    id: "policy",
    cat: "Policy Command",
    q: "Do you have your complete policy — declarations, forms, and endorsements — and have you read it?",
    opts: [
      { t: "Have it all and read it", pts: 20 },
      { t: "Have it, haven't really read it", pts: 10 },
      { t: "Don't have the full policy", pts: 2 },
    ],
  },
  {
    id: "estimate",
    cat: "Leverage",
    q: "Has the carrier's estimate been checked against real contractor pricing?",
    opts: [
      { t: "Yes — independent contractor estimate in hand", pts: 20 },
      { t: "Rough comparison only", pts: 10 },
      { t: "No — only the carrier's numbers", pts: 2 },
    ],
  },
];

export const GRADE_BANDS = [
  { min: 88, g: "A", tone: "green", line: "Exhibit-ready. You're running this claim like a case file." },
  { min: 75, g: "B", tone: "green", line: "Strong file with a few gaps a carrier could exploit." },
  { min: 60, g: "C", tone: "amber", line: "Average — which is exactly what carriers price for." },
  { min: 45, g: "D", tone: "red", line: "The carrier knows more about your claim than your file does." },
  { min: 0, g: "F", tone: "red", line: "Right now this claim runs on memory and trust. Fixable — fast." },
] as const;

export type GraderAnswers = Record<string, number>;

export type GraderResult = {
  scores: Record<string, number>;
  total: number;
  band: (typeof GRADE_BANDS)[number];
};

export function scoreGrader(answers: GraderAnswers): GraderResult {
  const scores = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<
    string,
    number
  >;

  for (const question of QUESTIONS) {
    if (!question.cat) continue;
    const chosen = answers[question.id];
    if (chosen === undefined) continue;
    const opt = question.opts[chosen];
    if (opt?.pts) scores[question.cat] += opt.pts;
  }

  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const band = GRADE_BANDS.find((b) => total >= b.min) ?? GRADE_BANDS[GRADE_BANDS.length - 1];

  return { scores, total, band };
}

export function answerValue(questionId: string, answers: GraderAnswers): string | undefined {
  const question = QUESTIONS.find((q) => q.id === questionId);
  const chosen = answers[questionId];
  if (!question || chosen === undefined) return undefined;
  return question.opts[chosen]?.v;
}
