import { useState, useEffect } from "react";
import {
  LayoutDashboard, BookOpen, Search, PenLine, Scale, Settings, Library,
  Plus, Trash2, Copy, Check, Loader2, AlertTriangle, ArrowRight, Sparkles,
  Eye, EyeOff, Phone, Mail, Camera, DollarSign, HardHat, StickyNote, FileText,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Claim Binder v2 — case-file design language                         */
/*  New in v2: Knowledge Library (owner-approved, AI-assisted intake),  */
/*  library injection into every AI tool, Claim Health Score,           */
/*  Next Recommended Action, Evidence Checklist, iconized timeline.     */
/* ------------------------------------------------------------------ */
const C = {
  paper: "#F2F1EC", surface: "#FBFAF7", ink: "#1B1F1D", rule: "#D7D4CA",
  muted: "#6E7069", green: "#1E4B3C", greenSoft: "#E4EBE6",
  red: "#A32C1C", redSoft: "#F4E3DF", amber: "#8A6D2F", amberSoft: "#F0E9D8",
};
const DISPLAY = { fontFamily: "'Archivo', system-ui, sans-serif" };
const MONO = { fontFamily: "'IBM Plex Mono', ui-monospace, monospace" };

const STORAGE_KEY = "claim-binder-v2";
const LEGACY_KEY = "claim-binder-v1";
const LIB_KEY = "claim-binder-library-v1";

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const today = () => new Date().toISOString().slice(0, 10);
const daysBetween = (from, to) =>
  Math.round((new Date(to + "T12:00:00") - new Date(from + "T12:00:00")) / 864e5);
const daysLeft = (date) => daysBetween(today(), date);
const addDays = (date, n) => {
  const d = new Date(date + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
const fmt = (date) => {
  if (!date) return "—";
  const d = new Date(date + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

/* ------------------------------------------------------------------ */
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
  if (!res.ok) throw new Error("The analysis service returned an error. Try again.");
  const data = await res.json();
  return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
}

/* ------------------------------------------------------------------ */
const TABS = [
  { id: "dashboard", letter: "A", label: "Dashboard", icon: LayoutDashboard },
  { id: "binder", letter: "B", label: "Binder Log", icon: BookOpen },
  { id: "analyze", letter: "C", label: "Analyze", icon: Search },
  { id: "letters", letter: "D", label: "Letters", icon: PenLine },
  { id: "decide", letter: "E", label: "Decide", icon: Scale },
  { id: "library", letter: "F", label: "Library", icon: Library },
  { id: "setup", letter: "G", label: "Claim File", icon: Settings },
];

const ENTRY_META = {
  "Phone call": { tag: "CALL", Icon: Phone },
  "Email": { tag: "EMAIL", Icon: Mail },
  "Adjuster visit": { tag: "VISIT", Icon: HardHat },
  "Photos taken": { tag: "PHOTO", Icon: Camera },
  "Letter sent": { tag: "LETTER", Icon: FileText },
  "Payment received": { tag: "PAYMENT", Icon: DollarSign },
  "Other": { tag: "NOTE", Icon: StickyNote },
};
const ENTRY_TYPES = Object.keys(ENTRY_META);

const DAMAGE_CATEGORIES = [
  { id: "water", label: "Water / plumbing" },
  { id: "roof", label: "Roof / storm" },
  { id: "fire", label: "Fire / smoke" },
  { id: "other", label: "Other" },
];

const EVIDENCE = {
  water: [
    "Before photos (pre-repair)",
    "Cause-of-loss report (plumber / leak detection)",
    "Mitigation invoice",
    "Moisture readings / drying logs",
    "Independent repair estimate",
    "Every carrier letter and email saved",
  ],
  roof: [
    "Before photos (pre-repair)",
    "Storm-date documentation (weather report)",
    "Roofer inspection report",
    "Independent repair estimate",
    "Roof age proof (permit / invoice)",
    "Every carrier letter and email saved",
  ],
  fire: [
    "Before photos / video walkthrough",
    "Fire department report",
    "Contents inventory with values",
    "ALE receipts (hotel, meals)",
    "Independent repair estimate",
    "Every carrier letter and email saved",
  ],
  other: [
    "Before photos (pre-repair)",
    "Cause-of-loss documentation",
    "Contractor inspection report",
    "Independent repair estimate",
    "Receipts for out-of-pocket costs",
    "Every carrier letter and email saved",
  ],
};

const GA_SEED = [
  { type: "statute", jurisdiction: "GA", cite: "O.C.G.A. § 33-4-6", summary: "Bad-faith refusal remedy. Requires a proper written demand and a 60-day window before filing suit; penalty can reach 50% of the loss or $5,000, whichever is greater, plus attorney's fees." },
  { type: "statute", jurisdiction: "GA", cite: "O.C.G.A. § 33-24-46", summary: "Governs notice and permissible grounds for cancellation and non-renewal of covered property policies. The policyholder can demand the specific statutory and factual basis in writing, including an itemized list of counted loss occurrences." },
  { type: "procedure", jurisdiction: "GA", cite: "State regulator complaint", summary: "The Office of Commissioner of Insurance and Safety Fire accepts consumer complaints online. A documented complaint file strengthens every later step." },
  { type: "procedure", jurisdiction: "national", cite: "Occurrence counting", summary: "A supplemental payment on an existing loss is not a new occurrence. Verify how the carrier coded each payment; miscounting supplements as separate losses is a known non-renewal driver." },
];

const FORMAT_RULES =
  "Respond in plain text only. Use ALL-CAPS section headings on their own lines. No markdown symbols, no asterisks, no numbered markdown lists. Be specific and concrete. This is educational self-help documentation support, not legal advice.";

const ANALYZE_TOOLS = [
  {
    id: "policy",
    name: "Policy Decoder",
    desc: "Paste policy language. Get coverage that applies, exclusions to watch, and buried deadlines.",
    placeholder: "Paste the policy sections you're unsure about, and briefly describe your damage situation...",
    prompt: (input, ctx, lib) =>
      `You are a homeowners-insurance policy analysis assistant inside a self-help claim documentation app. The user is a policyholder reviewing their own policy.\n\n${ctx}\n\n${lib}\n\nPOLICY LANGUAGE AND SITUATION FROM USER:\n${input}\n\nAnalyze under these headings: COVERAGE THAT LIKELY APPLIES / EXCLUSIONS AND LIMITATIONS TO WATCH / DEADLINES AND CONDITIONS FOUND / QUESTIONS TO PUT TO THE CARRIER IN WRITING. Where the excerpt is silent, name the standard HO-3 section to go check. ${FORMAT_RULES}`,
  },
  {
    id: "gap",
    name: "Estimate Gap Analyzer",
    desc: "Compare the carrier's estimate against the actual damage. Find what the scope missed.",
    placeholder: "Paste or summarize the carrier's estimate line items, then describe the actual damage and repairs needed...",
    prompt: (input, ctx, lib) =>
      `You are a repair-scope audit assistant inside a self-help claim documentation app, with general-contractor-level knowledge of trades and building code.\n\n${ctx}\n\n${lib}\n\nCARRIER ESTIMATE AND ACTUAL DAMAGE FROM USER:\n${input}\n\nAnalyze under these headings: LIKELY MISSING TRADES AND LINE ITEMS / CODE-REQUIRED ITEMS TO VERIFY / COMMONLY UNDERPAID ITEMS FOR THIS DAMAGE TYPE / HOW TO DOCUMENT THE GAP / QUESTIONS FOR THE ADJUSTER. ${FORMAT_RULES}`,
  },
  {
    id: "loss",
    name: "Loss-Count Auditor",
    desc: "Were your payments supplements to one loss, or separate occurrences? The count decides non-renewals.",
    placeholder: "List each claim or payment: date, amount, what it covered, and whether it related to an earlier loss...",
    prompt: (input, ctx, lib) =>
      `You are an occurrence-counting analysis assistant inside a self-help claim documentation app. Carriers sometimes count a supplemental payment as a separate loss occurrence, inflating the loss count used to justify non-renewal.\n\n${ctx}\n\n${lib}\n\nCLAIM AND PAYMENT HISTORY FROM USER:\n${input}\n\nAnalyze under these headings: OCCURRENCE ANALYSIS / WHICH ENTRIES LOOK LIKE SUPPLEMENTS TO A PRIOR LOSS / RECORDS TO REQUEST FROM THE CARRIER / WHY THE COUNT MATTERS FOR NON-RENEWAL / NEXT DOCUMENTATION STEPS. ${FORMAT_RULES}`,
  },
];

const LETTER_TYPES = [
  { id: "supplement", name: "Supplement Request", desc: "The payment didn't cover the real damage." },
  { id: "delay", name: "Status / Delay Demand", desc: "The claim is stalling. Start the paper trail." },
  { id: "doi", name: "DOI Complaint Draft", desc: "Escalate to your state insurance regulator." },
  { id: "nonrenewal", name: "Non-Renewal Challenge", desc: "Demand the specific legal basis for dropping you." },
];

const letterPrompt = (type, facts, ctx, lib) => {
  const base = `You are drafting a professional letter for a policyholder to review and send themselves. Write in first person as the policyholder. Firm, factual, professional. No threats. No legal conclusions asserted as fact.\n\n${ctx}\n\n${lib}\n\nKEY FACTS FROM THE POLICYHOLDER:\n${facts || "None provided — work from the claim context."}\n\n`;
  const shape =
    `Output only the letter text. Structure: [DATE] on the first line, recipient block placeholder, a RE: line with the claim and policy numbers, a short opening stating the purpose, numbered factual points, a specific request with a 14-day written-response deadline, and a signature block with [NAME] and contact placeholders. Close with the line: Prepared by the policyholder as self-help documentation. Plain text only, no markdown symbols.`;
  const byType = {
    supplement:
      "LETTER TYPE: Supplement request. The carrier's payment did not cover the full covered damage. Request a supplemental payment tied to the same loss occurrence, state that this is a supplement to the existing claim and NOT a new claim or new occurrence, and request written confirmation of how it will be recorded.",
    delay:
      "LETTER TYPE: Claim status and delay demand. The claim has been pending too long. Request a written status, a decision date, and the specific information still needed, and note that state claims-handling regulations set time standards for acknowledgment and decision.",
    doi:
      "LETTER TYPE: Complaint to the state insurance regulator (for Georgia, the Office of Commissioner of Insurance and Safety Fire; otherwise the user's state department of insurance). Summarize the carrier conduct factually with dates, state what resolution is requested, and list the documents attached as exhibits.",
    nonrenewal:
      "LETTER TYPE: Non-renewal challenge to the carrier. Request the specific statutory and factual basis for non-renewal in writing, an itemized list of the loss occurrences counted with dates and amounts, and correction if any supplemental payment was counted as a separate occurrence.",
  };
  return base + byType[type] + "\n\n" + shape;
};

const decidePrompt = (offer, estimate, months, disputed, ctx, lib) =>
  `You are a settlement decision framework assistant inside a self-help claim documentation app.\n\n${ctx}\n\n${lib}\n\nNUMBERS FROM THE POLICYHOLDER:\nCarrier offer on the table: $${offer || "unknown"}\nPolicyholder's estimate of full covered cost: $${estimate || "unknown"}\nMonths the claim has been open: ${months || "unknown"}\nWhat is disputed: ${disputed || "not specified"}\n\nAnalyze under these headings: THE GAP / WHAT SIGNING A RELEASE TYPICALLY ENDS / THE REALISTIC COST OF CONTINUING / LEVERAGE SIGNALS TO WATCH FOR / DECISION FRAMEWORK / BOTTOM LINE. Present a framework the person applies themselves, not a directive. Note this is educational, not legal or financial advice. ${FORMAT_RULES}`;

const ingestPrompt = (raw) =>
  `You are the intake engine for a user-controlled knowledge library inside a claim documentation app. The library owner pastes raw material; you structure it into draft entries THE OWNER must approve before anything enters the library.\n\nConvert the raw material below into 1 to 4 draft entries. Respond with ONLY a JSON array — no markdown fences, no commentary, no text before or after. Each entry is an object with exactly these keys:\n"type": one of "statute", "code", "price", "procedure"\n"jurisdiction": e.g. "GA", "Fulton County", "national"\n"cite": a short citation or label taken from the material\n"summary": 2-3 plain-English sentences focused on how a policyholder uses this\n"confidence": "high", "medium", or "low"\n"verify_note": one sentence on what the owner should verify before approving\n\nRules: never invent citation numbers, prices, or dates that are not present in the material. If the material lacks a citation, use a descriptive label and set confidence to "low".\n\nRAW MATERIAL:\n${raw}`;

/* ------------------------------------------------------------------ */
const Stamp = ({ children, tone = "ink" }) => {
  const tones = {
    ink: { color: C.ink, borderColor: C.ink, background: "transparent" },
    green: { color: C.green, borderColor: C.green, background: C.greenSoft },
    red: { color: C.red, borderColor: C.red, background: C.redSoft },
    amber: { color: C.amber, borderColor: C.amber, background: C.amberSoft },
  };
  return (
    <span className="inline-block px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide border rounded-sm"
      style={{ ...MONO, ...tones[tone] }}>
      {children}
    </span>
  );
};

const SectionTitle = ({ children }) => (
  <h2 className="text-lg font-bold uppercase tracking-wide mb-1" style={{ ...DISPLAY, color: C.ink }}>{children}</h2>
);
const Sub = ({ children }) => <p className="text-sm mb-4" style={{ color: C.muted }}>{children}</p>;
const Field = ({ label, children }) => (
  <label className="block">
    <span className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: C.muted }}>{label}</span>
    {children}
  </label>
);
const inputCls = "w-full text-sm px-3 py-2 rounded-sm border bg-white focus:outline-none focus:ring-2";
const inputStyle = { borderColor: C.rule, color: C.ink };

const PrimaryBtn = ({ onClick, disabled, children }) => (
  <button onClick={onClick} disabled={disabled}
    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-sm disabled:opacity-40"
    style={{ background: C.green, color: "#F5F4EC" }}>
    {children}
  </button>
);

const OutputPanel = ({ text, onCopy, copied }) => (
  <div className="mt-4 border rounded-sm" style={{ borderColor: C.rule, background: "#FFFFFF" }}>
    <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: C.rule }}>
      <Stamp tone="green">Analysis on file</Stamp>
      <button onClick={onCopy} className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide" style={{ color: C.green }}>
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
    <div className="p-3 text-sm whitespace-pre-wrap leading-relaxed" style={{ color: C.ink }}>{text}</div>
  </div>
);

const ErrorNote = ({ msg }) => (
  <div className="mt-3 flex items-start gap-2 text-sm" style={{ color: C.red }}>
    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
    <span>{msg}</span>
  </div>
);

/* ================================================================== */
export default function ClaimBinder() {
  const emptyClaim = {
    carrier: "", claimNumber: "", policyNumber: "", dateOfLoss: "",
    damageType: "", damageCategory: "water", usState: "GA", offerAmount: "",
  };

  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState("setup");
  const [claim, setClaim] = useState(emptyClaim);
  const [entries, setEntries] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [evidence, setEvidence] = useState({});
  const [library, setLibrary] = useState([]);

  const [entryForm, setEntryForm] = useState({ date: today(), type: "Phone call", contact: "", summary: "" });
  const [dlForm, setDlForm] = useState({ title: "", date: "" });

  const [tool, setTool] = useState("policy");
  const [toolInputs, setToolInputs] = useState({ policy: "", gap: "", loss: "" });
  const [toolOutputs, setToolOutputs] = useState({});
  const [toolLoading, setToolLoading] = useState(false);
  const [toolErr, setToolErr] = useState("");

  const [letterType, setLetterType] = useState("supplement");
  const [letterFacts, setLetterFacts] = useState("");
  const [letterOut, setLetterOut] = useState("");
  const [letterLoading, setLetterLoading] = useState(false);
  const [letterErr, setLetterErr] = useState("");

  const [decide, setDecide] = useState({ offer: "", estimate: "", months: "", disputed: "" });
  const [decideOut, setDecideOut] = useState("");
  const [decideLoading, setDecideLoading] = useState(false);
  const [decideErr, setDecideErr] = useState("");

  const [libForm, setLibForm] = useState({ type: "statute", jurisdiction: "GA", cite: "", summary: "" });
  const [rawMat, setRawMat] = useState("");
  const [drafts, setDrafts] = useState([]);
  const [ingestLoading, setIngestLoading] = useState(false);
  const [ingestErr, setIngestErr] = useState("");

  const [copied, setCopied] = useState("");

  /* ---------- persistence ---------- */
  useEffect(() => {
    (async () => {
      let main = null;
      try {
        const r = await window.storage.get(STORAGE_KEY);
        if (r && r.value) main = JSON.parse(r.value);
      } catch (e) { /* no v2 yet */ }
      if (!main) {
        try {
          const r = await window.storage.get(LEGACY_KEY);
          if (r && r.value) main = JSON.parse(r.value);
        } catch (e) { /* no legacy either */ }
      }
      if (main) {
        setClaim({ ...emptyClaim, ...(main.claim || {}) });
        setEntries(main.entries || []);
        setDeadlines(main.deadlines || []);
        setEvidence(main.evidence || {});
        if (main.claim && main.claim.carrier) setView("dashboard");
      }
      try {
        const r = await window.storage.get(LIB_KEY);
        if (r && r.value) setLibrary(JSON.parse(r.value));
      } catch (e) { /* empty library */ }
      setLoaded(true);
    })();
  }, []);

  const persist = async (next) => {
    try {
      await window.storage.set(STORAGE_KEY, JSON.stringify({
        claim: next.claim ?? claim,
        entries: next.entries ?? entries,
        deadlines: next.deadlines ?? deadlines,
        evidence: next.evidence ?? evidence,
      }));
    } catch (e) { console.error("Save failed", e); }
  };
  const persistLib = async (nextLib) => {
    try { await window.storage.set(LIB_KEY, JSON.stringify(nextLib)); }
    catch (e) { console.error("Library save failed", e); }
  };

  /* ---------- contexts ---------- */
  const claimContext = () =>
    `CLAIM CONTEXT\nCarrier: ${claim.carrier || "—"}\nClaim number: ${claim.claimNumber || "—"}\nPolicy number: ${claim.policyNumber || "—"}\nDate of loss: ${claim.dateOfLoss || "—"}\nDamage: ${claim.damageType || "—"} (${claim.damageCategory})\nState: ${claim.usState || "—"}\nCarrier offer or paid to date: ${claim.offerAmount || "—"}\nChronology entries on file: ${entries.length}`;

  const libraryContext = () => {
    const act = library.filter((e) => e.active).slice(0, 12);
    if (!act.length)
      return "KNOWLEDGE LIBRARY: no approved entries yet. Rely on general knowledge and tell the user to verify specifics for their state.";
    return "OWNER-APPROVED KNOWLEDGE LIBRARY (verified entries; prefer these over general knowledge and reference them where they apply; still tell the user to verify final details):\n" +
      act.map((e) => `[${(e.type || "").toUpperCase()} | ${e.jurisdiction} | verified ${e.verified}] ${e.cite}: ${e.summary}`).join("\n");
  };

  const doCopy = async (id, text) => {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
    }
    setCopied(id); setTimeout(() => setCopied(""), 1600);
  };

  /* ---------- mutations ---------- */
  const saveClaim = () => { persist({ claim }); setView("dashboard"); };

  const addEntry = () => {
    if (!entryForm.summary.trim()) return;
    const next = [{ id: uid(), ...entryForm }, ...entries];
    setEntries(next); persist({ entries: next });
    setEntryForm({ date: today(), type: "Phone call", contact: "", summary: "" });
  };
  const deleteEntry = (id) => {
    const next = entries.filter((e) => e.id !== id);
    setEntries(next); persist({ entries: next });
  };

  const addDeadline = (title, date) => {
    if (!title.trim() || !date) return;
    const next = [...deadlines, { id: uid(), title: title.trim(), date }].sort((a, b) => a.date.localeCompare(b.date));
    setDeadlines(next); persist({ deadlines: next });
    setDlForm({ title: "", date: "" });
  };
  const deleteDeadline = (id) => {
    const next = deadlines.filter((d) => d.id !== id);
    setDeadlines(next); persist({ deadlines: next });
  };

  const toggleEvidence = (item) => {
    const cat = claim.damageCategory || "water";
    const catState = { ...(evidence[cat] || {}) };
    catState[item] = !catState[item];
    const next = { ...evidence, [cat]: catState };
    setEvidence(next); persist({ evidence: next });
  };

  const addLibEntry = () => {
    if (!libForm.cite.trim() || !libForm.summary.trim()) return;
    const next = [...library, { id: uid(), ...libForm, cite: libForm.cite.trim(), summary: libForm.summary.trim(), verified: today(), active: true }];
    setLibrary(next); persistLib(next);
    setLibForm({ type: "statute", jurisdiction: "GA", cite: "", summary: "" });
  };
  const seedLibrary = () => {
    const next = [...library, ...GA_SEED.map((e) => ({ id: uid(), ...e, verified: today(), active: true }))];
    setLibrary(next); persistLib(next);
  };
  const toggleLib = (id) => {
    const next = library.map((e) => (e.id === id ? { ...e, active: !e.active } : e));
    setLibrary(next); persistLib(next);
  };
  const deleteLib = (id) => {
    const next = library.filter((e) => e.id !== id);
    setLibrary(next); persistLib(next);
  };

  const runIngest = async () => {
    if (!rawMat.trim()) return;
    setIngestLoading(true); setIngestErr("");
    try {
      const out = await callClaude(ingestPrompt(rawMat.trim()));
      const clean = out.replace(/```json|```/g, "").trim();
      const arr = JSON.parse(clean);
      if (!Array.isArray(arr) || !arr.length) throw new Error("empty");
      setDrafts(arr.slice(0, 4).map((d) => ({ ...d, id: uid() })));
      setRawMat("");
    } catch (e) {
      setIngestErr("Couldn't structure that material into entries. Try a smaller or cleaner excerpt.");
    }
    setIngestLoading(false);
  };
  const approveDraft = (d) => {
    const next = [...library, {
      id: d.id,
      type: ["statute", "code", "price", "procedure"].includes(d.type) ? d.type : "procedure",
      jurisdiction: d.jurisdiction || "—",
      cite: d.cite || "Untitled entry",
      summary: d.summary || "",
      verified: today(),
      active: true,
    }];
    setLibrary(next); persistLib(next);
    setDrafts(drafts.filter((x) => x.id !== d.id));
  };
  const discardDraft = (id) => setDrafts(drafts.filter((x) => x.id !== id));

  const resetBinder = async () => {
    if (!window.confirm("Delete this claim file, every entry, and the library? This can't be undone.")) return;
    try { await window.storage.delete(STORAGE_KEY); } catch (e) {}
    try { await window.storage.delete(LEGACY_KEY); } catch (e) {}
    try { await window.storage.delete(LIB_KEY); } catch (e) {}
    setClaim(emptyClaim); setEntries([]); setDeadlines([]); setEvidence({}); setLibrary([]);
    setView("setup");
  };

  /* ---------- AI runs ---------- */
  const runTool = async () => {
    const t = ANALYZE_TOOLS.find((x) => x.id === tool);
    const input = toolInputs[tool].trim();
    if (!input) return;
    setToolLoading(true); setToolErr("");
    try {
      const out = await callClaude(t.prompt(input, claimContext(), libraryContext()));
      setToolOutputs((o) => ({ ...o, [tool]: out }));
    } catch (e) { setToolErr(e.message); }
    setToolLoading(false);
  };
  const runLetter = async () => {
    setLetterLoading(true); setLetterErr("");
    try {
      const out = await callClaude(letterPrompt(letterType, letterFacts.trim(), claimContext(), libraryContext()));
      setLetterOut(out);
    } catch (e) { setLetterErr(e.message); }
    setLetterLoading(false);
  };
  const runDecide = async () => {
    setDecideLoading(true); setDecideErr("");
    try {
      const out = await callClaude(decidePrompt(decide.offer, decide.estimate, decide.months, decide.disputed.trim(), claimContext(), libraryContext()));
      setDecideOut(out);
    } catch (e) { setDecideErr(e.message); }
    setDecideLoading(false);
  };

  /* ---------- derived ---------- */
  const cat = claim.damageCategory || "water";
  const evItems = EVIDENCE[cat] || EVIDENCE.other;
  const evState = evidence[cat] || {};
  const evChecked = evItems.filter((i) => evState[i]).length;
  const evPct = evItems.length ? evChecked / evItems.length : 0;

  const latestEntryDate = entries.length ? entries.reduce((m, e) => (e.date > m ? e.date : m), entries[0].date) : null;
  const freshDays = latestEntryDate ? daysBetween(latestEntryDate, today()) : null;
  const freshPts = freshDays === null ? 0 : freshDays <= 14 ? 20 : freshDays <= 30 ? 10 : 0;

  const healthParts = {
    Evidence: { pts: Math.round(evPct * 40), max: 40 },
    "Paper trail": { pts: Math.min(entries.length, 10) * 2, max: 20 },
    Deadlines: { pts: Math.min(deadlines.length, 2) * 10, max: 20 },
    Freshness: { pts: freshPts, max: 20 },
  };
  const health = Object.values(healthParts).reduce((a, b) => a + b.pts, 0);
  const healthTone = health >= 80 ? "green" : health >= 60 ? "amber" : "red";
  const toneColor = { green: C.green, amber: C.amber, red: C.red };
  const toneSoft = { green: C.greenSoft, amber: C.amberSoft, red: C.redSoft };

  const missingEvidence = evItems.filter((i) => !evState[i]);
  const nextAction = deadlines.length === 0
    ? { text: "Add your suit-limitation deadline. It's the one date that can end the claim by itself.", go: "dashboard" }
    : missingEvidence.length > 0
      ? { text: `Collect and check off: ${missingEvidence[0]}`, go: "dashboard" }
      : freshDays === null || freshDays > 14
        ? { text: "Log your latest carrier contact. A fresh chronology is leverage.", go: "binder" }
        : library.filter((e) => e.active).length === 0
          ? { text: "Approve your first library entries so every analysis runs on your verified knowledge.", go: "library" }
          : { text: "File is current. Run the Gap Analyzer on the latest carrier estimate.", go: "analyze" };

  const dlTone = (n) => (n <= 30 ? "red" : n <= 90 ? "amber" : "green");

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.paper }}>
        <Loader2 className="animate-spin" style={{ color: C.green }} />
      </div>
    );
  }

  /* =============================== views ============================ */
  const Dashboard = (
    <div>
      {/* Health score */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="text-xs uppercase tracking-widest mb-1" style={{ color: C.muted }}>Claim health</div>
          <div className="text-sm font-semibold mb-2" style={{ color: C.ink }}>
            {health >= 80 ? "Exhibit-ready. Keep the log warm." : health >= 60 ? "Solid base — close the gaps below." : "The carrier's file is stronger than yours. Fix that this week."}
          </div>
          <div className="space-y-1">
            {Object.entries(healthParts).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2">
                <span className="text-xs w-24 shrink-0 uppercase tracking-wide" style={{ color: C.muted }}>{k}</span>
                <div className="h-1.5 flex-1 rounded-sm" style={{ background: C.rule }}>
                  <div className="h-1.5 rounded-sm" style={{ width: `${(v.pts / v.max) * 100}%`, background: v.pts / v.max >= 0.7 ? C.green : v.pts / v.max >= 0.4 ? C.amber : C.red }} />
                </div>
                <span className="text-xs w-12 text-right" style={{ ...MONO, color: C.muted }}>{v.pts}/{v.max}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="shrink-0 w-20 h-20 border-4 rounded-sm flex flex-col items-center justify-center"
          style={{ ...DISPLAY, borderColor: toneColor[healthTone], color: toneColor[healthTone], background: toneSoft[healthTone], transform: "rotate(-5deg)", borderStyle: "double" }}>
          <span className="text-3xl font-extrabold leading-none">{health}</span>
          <span className="text-xs" style={MONO}>/100</span>
        </div>
      </div>

      {/* Next action */}
      <button onClick={() => setView(nextAction.go)}
        className="w-full text-left flex items-start gap-3 rounded-sm px-3 py-3 mb-6"
        style={{ background: C.greenSoft, borderLeft: `3px solid ${C.green}` }}>
        <ArrowRight size={16} className="mt-0.5 shrink-0" style={{ color: C.green }} />
        <div>
          <div className="text-xs font-bold uppercase tracking-widest" style={{ ...DISPLAY, color: C.green }}>Next recommended action</div>
          <div className="text-sm mt-0.5" style={{ color: C.ink }}>{nextAction.text}</div>
        </div>
      </button>

      {/* Evidence checklist */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold uppercase tracking-wide" style={{ ...DISPLAY, color: C.ink }}>
          Evidence checklist — {DAMAGE_CATEGORIES.find((d) => d.id === cat)?.label}
        </h3>
        <Stamp tone={evPct >= 0.8 ? "green" : evPct >= 0.5 ? "amber" : "red"}>{Math.round(evPct * 100)}%</Stamp>
      </div>
      <div className="border rounded-sm mb-6" style={{ borderColor: C.rule, background: "#FFFFFF" }}>
        {evItems.map((item, i) => (
          <button key={item} onClick={() => toggleEvidence(item)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm"
            style={{ borderTop: i === 0 ? "none" : `1px solid ${C.rule}`, color: evState[item] ? C.ink : C.muted }}>
            <span className="inline-flex items-center justify-center w-4 h-4 border rounded-sm shrink-0"
              style={{ borderColor: evState[item] ? C.green : C.rule, background: evState[item] ? C.green : "#FFFFFF" }}>
              {evState[item] && <Check size={12} color="#F5F4EC" />}
            </span>
            {item}
          </button>
        ))}
      </div>

      {/* Deadlines */}
      <h3 className="text-sm font-bold uppercase tracking-wide mb-2" style={{ ...DISPLAY, color: C.ink }}>Deadlines</h3>
      {deadlines.length === 0 && (
        <p className="text-sm mb-3" style={{ color: C.muted }}>No deadlines tracked yet. Add the ones below, then verify each against your policy — timelines vary.</p>
      )}
      <div className="space-y-2 mb-3">
        {deadlines.map((d) => {
          const n = daysLeft(d.date);
          return (
            <div key={d.id} className="flex items-center gap-3 border rounded-sm px-3 py-2" style={{ borderColor: C.rule, background: "#FFFFFF" }}>
              <Stamp tone={n < 0 ? "red" : dlTone(n)}>{n < 0 ? `${Math.abs(n)}d past` : `${n}d left`}</Stamp>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: C.ink }}>{d.title}</div>
                <div className="text-xs" style={{ ...MONO, color: C.muted }}>{fmt(d.date)}</div>
              </div>
              <button onClick={() => deleteDeadline(d.id)} aria-label="Delete deadline" style={{ color: C.muted }}>
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}
      </div>
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <input className={inputCls} style={inputStyle} placeholder="Deadline name"
          value={dlForm.title} onChange={(e) => setDlForm({ ...dlForm, title: e.target.value })} />
        <input type="date" className={inputCls + " sm:w-44"} style={inputStyle}
          value={dlForm.date} onChange={(e) => setDlForm({ ...dlForm, date: e.target.value })} />
        <PrimaryBtn onClick={() => addDeadline(dlForm.title, dlForm.date)} disabled={!dlForm.title.trim() || !dlForm.date}>
          <Plus size={16} /> Add
        </PrimaryBtn>
      </div>
      {claim.dateOfLoss && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => addDeadline("Suit limitation — verify in policy", addDays(claim.dateOfLoss, 730))}
            className="text-xs font-semibold px-2 py-1 border rounded-sm" style={{ borderColor: C.green, color: C.green }}>
            + Suit limitation (2 yrs from loss)
          </button>
          <button onClick={() => addDeadline("1-year suit clause — verify in policy", addDays(claim.dateOfLoss, 365))}
            className="text-xs font-semibold px-2 py-1 border rounded-sm" style={{ borderColor: C.green, color: C.green }}>
            + 1-yr suit clause
          </button>
          <button onClick={() => addDeadline("Follow up with carrier", addDays(today(), 14))}
            className="text-xs font-semibold px-2 py-1 border rounded-sm" style={{ borderColor: C.green, color: C.green }}>
            + 14-day follow-up
          </button>
        </div>
      )}

      {/* Timeline */}
      <h3 className="text-sm font-bold uppercase tracking-wide mb-2" style={{ ...DISPLAY, color: C.ink }}>Claim timeline</h3>
      {entries.length === 0 ? (
        <p className="text-sm" style={{ color: C.muted }}>Nothing logged yet. Open Binder Log — Tab B — and record your first call, email, or adjuster visit.</p>
      ) : (
        <div className="pl-3 space-y-4" style={{ borderLeft: `2px solid ${C.rule}` }}>
          {entries.slice(0, 6).map((e) => {
            const M = ENTRY_META[e.type] || ENTRY_META.Other;
            return (
              <div key={e.id} className="flex items-start gap-3">
                <span className="text-xs mt-1 w-16 shrink-0" style={{ ...MONO, color: C.muted }}>{fmt(e.date).replace(", " + new Date().getFullYear(), "")}</span>
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-sm shrink-0 border"
                  style={{ background: C.greenSoft, borderColor: C.green, color: C.green }}>
                  <M.Icon size={14} />
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold uppercase tracking-wide" style={{ ...DISPLAY, color: C.ink }}>{e.type}{e.contact ? ` — ${e.contact}` : ""}</div>
                  <p className="text-sm truncate" style={{ color: C.muted }}>{e.summary}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const Binder = (
    <div>
      <SectionTitle>Binder log</SectionTitle>
      <Sub>The chronology is the case. Log every contact the day it happens — who, when, what was said.</Sub>

      <div className="border rounded-sm p-3 mb-6" style={{ borderColor: C.rule, background: "#FFFFFF" }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <Field label="Date">
            <input type="date" className={inputCls} style={inputStyle}
              value={entryForm.date} onChange={(e) => setEntryForm({ ...entryForm, date: e.target.value })} />
          </Field>
          <Field label="Type">
            <select className={inputCls} style={inputStyle}
              value={entryForm.type} onChange={(e) => setEntryForm({ ...entryForm, type: e.target.value })}>
              {ENTRY_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Who (name / role)">
            <input className={inputCls} style={inputStyle} placeholder="e.g. J. Smith, field adjuster"
              value={entryForm.contact} onChange={(e) => setEntryForm({ ...entryForm, contact: e.target.value })} />
          </Field>
        </div>
        <Field label="What happened">
          <textarea rows={3} className={inputCls} style={inputStyle}
            placeholder="Exactly what was said, promised, requested, or received..."
            value={entryForm.summary} onChange={(e) => setEntryForm({ ...entryForm, summary: e.target.value })} />
        </Field>
        <div className="mt-3">
          <PrimaryBtn onClick={addEntry} disabled={!entryForm.summary.trim()}>
            <Plus size={16} /> Add entry
          </PrimaryBtn>
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm" style={{ color: C.muted }}>No entries yet. The first one takes thirty seconds.</p>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => {
            const M = ENTRY_META[e.type] || ENTRY_META.Other;
            return (
              <div key={e.id} className="border rounded-sm p-3" style={{ borderColor: C.rule, background: "#FFFFFF" }}>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-sm border shrink-0"
                    style={{ background: C.greenSoft, borderColor: C.green, color: C.green }}>
                    <M.Icon size={14} />
                  </span>
                  <Stamp>{M.tag}</Stamp>
                  {e.contact && <span className="text-xs truncate" style={{ color: C.muted }}>{e.contact}</span>}
                  <span className="ml-auto text-xs shrink-0" style={{ ...MONO, color: C.muted }}>{fmt(e.date)}</span>
                  <button onClick={() => deleteEntry(e.id)} aria-label="Delete entry" style={{ color: C.muted }}>
                    <Trash2 size={15} />
                  </button>
                </div>
                <p className="text-sm mt-2 whitespace-pre-wrap" style={{ color: C.ink }}>{e.summary}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const activeTool = ANALYZE_TOOLS.find((t) => t.id === tool);
  const activeLibCount = library.filter((e) => e.active).length;
  const Analyze = (
    <div>
      <div className="flex items-center justify-between">
        <SectionTitle>Analyze</SectionTitle>
        <Stamp tone={activeLibCount ? "green" : "amber"}>{activeLibCount} library entries in force</Stamp>
      </div>
      <Sub>Run the carrier's paperwork through the same scrutiny they run yours through. Every run reads your approved library.</Sub>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
        {ANALYZE_TOOLS.map((t) => (
          <button key={t.id} onClick={() => { setTool(t.id); setToolErr(""); }}
            className="text-left border rounded-sm p-3"
            style={{ borderColor: tool === t.id ? C.green : C.rule, background: tool === t.id ? C.greenSoft : "#FFFFFF" }}>
            <div className="text-sm font-bold" style={{ ...DISPLAY, color: C.ink }}>{t.name}</div>
            <div className="text-xs mt-1" style={{ color: C.muted }}>{t.desc}</div>
          </button>
        ))}
      </div>

      <textarea rows={6} className={inputCls} style={inputStyle}
        placeholder={activeTool.placeholder}
        value={toolInputs[tool]}
        onChange={(e) => setToolInputs({ ...toolInputs, [tool]: e.target.value })} />
      <div className="mt-3">
        <PrimaryBtn onClick={runTool} disabled={toolLoading || !toolInputs[tool].trim()}>
          {toolLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          {toolLoading ? "Analyzing..." : "Run analysis"}
        </PrimaryBtn>
      </div>
      {toolErr && <ErrorNote msg={toolErr} />}
      {toolOutputs[tool] && (
        <OutputPanel text={toolOutputs[tool]} copied={copied === "tool-" + tool}
          onCopy={() => doCopy("tool-" + tool, toolOutputs[tool])} />
      )}
    </div>
  );

  const Letters = (
    <div>
      <SectionTitle>Letters</SectionTitle>
      <Sub>Drafts built from your claim file and library. Review every line, put it on paper, send it certified.</Sub>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
        {LETTER_TYPES.map((t) => (
          <button key={t.id} onClick={() => { setLetterType(t.id); setLetterErr(""); }}
            className="text-left border rounded-sm p-3"
            style={{ borderColor: letterType === t.id ? C.green : C.rule, background: letterType === t.id ? C.greenSoft : "#FFFFFF" }}>
            <div className="text-sm font-bold" style={{ ...DISPLAY, color: C.ink }}>{t.name}</div>
            <div className="text-xs mt-1" style={{ color: C.muted }}>{t.desc}</div>
          </button>
        ))}
      </div>

      <Field label="Key facts to include (dates, amounts, names)">
        <textarea rows={4} className={inputCls} style={inputStyle}
          placeholder="e.g. Paid $3,168 on Nov 12 for the same water loss as the prior payment. Carrier logged it as a second occurrence..."
          value={letterFacts} onChange={(e) => setLetterFacts(e.target.value)} />
      </Field>
      <div className="mt-3 flex items-center gap-3 flex-wrap">
        <PrimaryBtn onClick={runLetter} disabled={letterLoading}>
          {letterLoading ? <Loader2 size={16} className="animate-spin" /> : <PenLine size={16} />}
          {letterLoading ? "Drafting..." : "Generate draft"}
        </PrimaryBtn>
        <span className="text-xs" style={{ color: C.muted }}>In active litigation? Route every draft through your attorney before sending.</span>
      </div>
      {letterErr && <ErrorNote msg={letterErr} />}
      {letterOut && (
        <OutputPanel text={letterOut} copied={copied === "letter"} onCopy={() => doCopy("letter", letterOut)} />
      )}
    </div>
  );

  const Decide = (
    <div>
      <SectionTitle>Sign or fight</SectionTitle>
      <Sub>A release is permanent. Run the numbers before you run out of patience.</Sub>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        <Field label="Carrier offer ($)">
          <input inputMode="numeric" className={inputCls} style={inputStyle} placeholder="18500"
            value={decide.offer} onChange={(e) => setDecide({ ...decide, offer: e.target.value })} />
        </Field>
        <Field label="Your full-cost estimate ($)">
          <input inputMode="numeric" className={inputCls} style={inputStyle} placeholder="31200"
            value={decide.estimate} onChange={(e) => setDecide({ ...decide, estimate: e.target.value })} />
        </Field>
        <Field label="Months claim open">
          <input inputMode="numeric" className={inputCls} style={inputStyle} placeholder="7"
            value={decide.months} onChange={(e) => setDecide({ ...decide, months: e.target.value })} />
        </Field>
      </div>
      <Field label="What's disputed">
        <textarea rows={3} className={inputCls} style={inputStyle}
          placeholder="e.g. Carrier scoped patch repairs; code requires full replacement of..."
          value={decide.disputed} onChange={(e) => setDecide({ ...decide, disputed: e.target.value })} />
      </Field>
      <div className="mt-3">
        <PrimaryBtn onClick={runDecide} disabled={decideLoading}>
          {decideLoading ? <Loader2 size={16} className="animate-spin" /> : <Scale size={16} />}
          {decideLoading ? "Weighing..." : "Run the framework"}
        </PrimaryBtn>
      </div>
      {decideErr && <ErrorNote msg={decideErr} />}
      {decideOut && (
        <OutputPanel text={decideOut} copied={copied === "decide"} onCopy={() => doCopy("decide", decideOut)} />
      )}
    </div>
  );

  const confTone = { high: "green", medium: "amber", low: "red" };
  const LibraryView = (
    <div>
      <div className="flex items-center justify-between">
        <SectionTitle>Knowledge library</SectionTitle>
        <Stamp tone="green">{library.filter((e) => e.active).length} active / {library.length} total</Stamp>
      </div>
      <Sub>Only entries you approve exist here, and every AI tool reads the active ones on every run. The AI drafts; you decide what counts as knowledge.</Sub>

      {library.length === 0 && (
        <div className="border-2 rounded-sm p-4 mb-6" style={{ borderColor: C.green, background: C.greenSoft }}>
          <div className="text-sm font-bold uppercase tracking-wide mb-1" style={{ ...DISPLAY, color: C.green }}>Start with the Georgia pack</div>
          <p className="text-sm mb-3" style={{ color: C.ink }}>Four verified starter entries: the bad-faith demand statute, the non-renewal statute, the state regulator route, and the occurrence-counting principle.</p>
          <PrimaryBtn onClick={seedLibrary}><Plus size={16} /> Load Georgia starter entries</PrimaryBtn>
        </div>
      )}

      {/* AI intake */}
      <div className="border rounded-sm p-3 mb-6" style={{ borderColor: C.rule, background: "#FFFFFF" }}>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} style={{ color: C.amber }} />
          <span className="text-sm font-bold uppercase tracking-wide" style={{ ...DISPLAY, color: C.ink }}>Process new material</span>
        </div>
        <p className="text-xs mb-2" style={{ color: C.muted }}>
          Paste a statute, a code section, a completed-job invoice, or price data. The AI structures it into draft entries — nothing goes live until you approve it.
        </p>
        <textarea rows={5} className={inputCls} style={inputStyle}
          placeholder="Paste raw material here — e.g. the text of a statute, or line items and totals from a finished A&K job..."
          value={rawMat} onChange={(e) => setRawMat(e.target.value)} />
        <div className="mt-2">
          <PrimaryBtn onClick={runIngest} disabled={ingestLoading || !rawMat.trim()}>
            {ingestLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {ingestLoading ? "Structuring..." : "Process into draft entries"}
          </PrimaryBtn>
        </div>
        {ingestErr && <ErrorNote msg={ingestErr} />}

        {drafts.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="text-xs font-bold uppercase tracking-widest" style={{ ...DISPLAY, color: C.amber }}>Drafts awaiting your approval</div>
            {drafts.map((d) => (
              <div key={d.id} className="border-2 rounded-sm p-3" style={{ borderColor: C.amber, background: C.amberSoft }}>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Stamp tone="amber">{(d.type || "entry").toUpperCase()}</Stamp>
                  <span className="text-sm font-bold" style={{ color: C.ink }}>{d.cite || "Untitled entry"}</span>
                  <span className="text-xs" style={{ ...MONO, color: C.muted }}>{d.jurisdiction || "—"}</span>
                  <Stamp tone={confTone[d.confidence] || "amber"}>{d.confidence || "medium"} confidence</Stamp>
                </div>
                <p className="text-sm mb-1" style={{ color: C.ink }}>{d.summary}</p>
                {d.verify_note && <p className="text-xs italic mb-2" style={{ color: C.muted }}>Verify before approving: {d.verify_note}</p>}
                <div className="flex gap-2">
                  <button onClick={() => approveDraft(d)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase tracking-wide rounded-sm"
                    style={{ background: C.green, color: "#F5F4EC" }}>
                    <Check size={14} /> Approve
                  </button>
                  <button onClick={() => discardDraft(d.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase tracking-wide rounded-sm border"
                    style={{ borderColor: C.rule, color: C.muted }}>
                    <Trash2 size={14} /> Discard
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual add */}
      <div className="border rounded-sm p-3 mb-6" style={{ borderColor: C.rule, background: "#FFFFFF" }}>
        <div className="text-sm font-bold uppercase tracking-wide mb-2" style={{ ...DISPLAY, color: C.ink }}>Add an entry by hand</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <Field label="Type">
            <select className={inputCls} style={inputStyle}
              value={libForm.type} onChange={(e) => setLibForm({ ...libForm, type: e.target.value })}>
              <option value="statute">Statute</option>
              <option value="code">Building code</option>
              <option value="price">Price benchmark</option>
              <option value="procedure">Procedure</option>
            </select>
          </Field>
          <Field label="Jurisdiction">
            <input className={inputCls} style={inputStyle} placeholder="GA / Fulton County / national"
              value={libForm.jurisdiction} onChange={(e) => setLibForm({ ...libForm, jurisdiction: e.target.value })} />
          </Field>
          <Field label="Citation / label">
            <input className={inputCls} style={{ ...inputStyle, ...MONO }} placeholder="O.C.G.A. § ..."
              value={libForm.cite} onChange={(e) => setLibForm({ ...libForm, cite: e.target.value })} />
          </Field>
        </div>
        <Field label="Summary (how a policyholder uses it)">
          <textarea rows={2} className={inputCls} style={inputStyle}
            value={libForm.summary} onChange={(e) => setLibForm({ ...libForm, summary: e.target.value })} />
        </Field>
        <div className="mt-3">
          <PrimaryBtn onClick={addLibEntry} disabled={!libForm.cite.trim() || !libForm.summary.trim()}>
            <Plus size={16} /> Add to library
          </PrimaryBtn>
        </div>
      </div>

      {/* Entries */}
      {library.length > 0 && (
        <div className="space-y-2">
          {library.map((e) => (
            <div key={e.id} className="border rounded-sm p-3" style={{ borderColor: C.rule, background: "#FFFFFF", opacity: e.active ? 1 : 0.55 }}>
              <div className="flex items-center gap-2 flex-wrap">
                <Stamp tone={e.type === "statute" ? "green" : e.type === "code" ? "amber" : "ink"}>{e.type}</Stamp>
                <span className="text-sm font-bold" style={{ color: C.ink }}>{e.cite}</span>
                <span className="text-xs" style={{ ...MONO, color: C.muted }}>{e.jurisdiction} · verified {e.verified}</span>
                <span className="ml-auto flex items-center gap-2">
                  <button onClick={() => toggleLib(e.id)} aria-label={e.active ? "Deactivate entry" : "Activate entry"} style={{ color: e.active ? C.green : C.muted }}>
                    {e.active ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button onClick={() => deleteLib(e.id)} aria-label="Delete entry" style={{ color: C.muted }}>
                    <Trash2 size={16} />
                  </button>
                </span>
              </div>
              <p className="text-sm mt-1" style={{ color: C.ink }}>{e.summary}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const Setup = (
    <div>
      <SectionTitle>Claim file</SectionTitle>
      <Sub>Everything else is built from this page. Saves privately to your account.</Sub>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Insurance carrier">
          <input className={inputCls} style={inputStyle} placeholder="e.g. Nationwide"
            value={claim.carrier} onChange={(e) => setClaim({ ...claim, carrier: e.target.value })} />
        </Field>
        <Field label="Claim number">
          <input className={inputCls} style={{ ...inputStyle, ...MONO }} placeholder="e.g. ZHM0012345"
            value={claim.claimNumber} onChange={(e) => setClaim({ ...claim, claimNumber: e.target.value })} />
        </Field>
        <Field label="Policy number">
          <input className={inputCls} style={{ ...inputStyle, ...MONO }} placeholder="e.g. HM 1234567"
            value={claim.policyNumber} onChange={(e) => setClaim({ ...claim, policyNumber: e.target.value })} />
        </Field>
        <Field label="Date of loss">
          <input type="date" className={inputCls} style={inputStyle}
            value={claim.dateOfLoss} onChange={(e) => setClaim({ ...claim, dateOfLoss: e.target.value })} />
        </Field>
        <Field label="Damage category (drives the evidence checklist)">
          <select className={inputCls} style={inputStyle}
            value={claim.damageCategory} onChange={(e) => setClaim({ ...claim, damageCategory: e.target.value })}>
            {DAMAGE_CATEGORIES.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
        </Field>
        <Field label="Damage description">
          <input className={inputCls} style={inputStyle} placeholder="e.g. Under-slab plumbing failure"
            value={claim.damageType} onChange={(e) => setClaim({ ...claim, damageType: e.target.value })} />
        </Field>
        <Field label="State">
          <input className={inputCls} style={inputStyle} placeholder="GA"
            value={claim.usState} onChange={(e) => setClaim({ ...claim, usState: e.target.value })} />
        </Field>
        <Field label="Offered / paid to date ($)">
          <input inputMode="numeric" className={inputCls} style={inputStyle} placeholder="0"
            value={claim.offerAmount} onChange={(e) => setClaim({ ...claim, offerAmount: e.target.value })} />
        </Field>
      </div>

      <div className="mt-4 flex items-center gap-3 flex-wrap">
        <PrimaryBtn onClick={saveClaim} disabled={!claim.carrier.trim()}>
          <Check size={16} /> Save claim file
        </PrimaryBtn>
        <button onClick={resetBinder} className="text-sm font-semibold" style={{ color: C.red }}>
          Delete binder
        </button>
      </div>
    </div>
  );

  const VIEWS = { dashboard: Dashboard, binder: Binder, analyze: Analyze, letters: Letters, decide: Decide, library: LibraryView, setup: Setup };

  /* ---------------------------- shell ------------------------------ */
  return (
    <div className="min-h-screen" style={{ background: C.paper, color: C.ink, fontFamily: "'Public Sans', system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=Public+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');`}</style>

      <div className="max-w-3xl mx-auto px-3 pt-6 pb-10">
        <div className="flex items-end justify-between gap-3 mb-5 flex-wrap">
          <div>
            <div className="text-2xl font-extrabold uppercase" style={{ ...DISPLAY, letterSpacing: "0.06em", color: C.ink }}>
              Claim<span style={{ color: C.green }}> Binder</span>
            </div>
            <div className="text-xs mt-0.5" style={{ color: C.muted }}>
              Build the claim file your insurance company wishes you didn't have.
            </div>
          </div>
          {claim.carrier && (
            <div className="text-xs px-2 py-1 border rounded-sm" style={{ ...MONO, borderColor: C.rule, background: "#FFFFFF", color: C.ink }}>
              {claim.carrier}{claim.claimNumber ? " · " + claim.claimNumber : ""}
            </div>
          )}
        </div>

        <div className="flex overflow-x-auto -mb-px" role="tablist" aria-label="Binder sections">
          {TABS.map((t) => {
            const active = view === t.id;
            return (
              <button key={t.id} role="tab" aria-selected={active} onClick={() => setView(t.id)}
                className="shrink-0 px-3 py-2 border rounded-t-sm mr-1 text-xs font-semibold uppercase tracking-wide inline-flex items-center gap-2"
                style={{
                  borderColor: active ? C.rule : "transparent",
                  borderBottomColor: active ? C.surface : "transparent",
                  borderTop: active ? `3px solid ${C.green}` : "3px solid transparent",
                  background: active ? C.surface : "transparent",
                  color: active ? C.ink : C.muted,
                }}>
                <span className="inline-flex items-center justify-center w-4 h-4 border rounded-sm text-xs"
                  style={{ ...MONO, borderColor: active ? C.green : C.muted, color: active ? C.green : C.muted }}>
                  {t.letter}
                </span>
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="border rounded-b-sm rounded-tr-sm p-4 sm:p-6" style={{ borderColor: C.rule, background: C.surface }}>
          {VIEWS[view]}
        </div>

        <p className="text-xs mt-4 leading-relaxed" style={{ color: C.muted }}>
          Claim Binder is a self-help documentation tool. It is not an insurance adjuster, law firm, or financial
          advisor; it does not negotiate claims or provide legal advice. You review, verify, and send everything yourself.
        </p>
      </div>
    </div>
  );
}
