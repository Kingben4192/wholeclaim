import { Phone, Mail, Camera, DollarSign, HardHat, StickyNote, FileText, Check, Plus, Search, ArrowRight, Trash2, Copy } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  WholeClaim Design System v1.0 — Phase 1.2                          */
/*  Living reference: tokens, measured contrast, type, components.     */
/* ------------------------------------------------------------------ */
const C = {
  paper: "#F2F1EC", surface: "#FBFAF7", ink: "#1B1F1D", rule: "#D7D4CA",
  muted: "#63665F",           // Muted Text — darkened from #6E7069 to pass AA
  green: "#1E4B3C", greenSoft: "#E4EBE6",
  red: "#A32C1C", redSoft: "#F4E3DF",
  amber: "#8A6D2F", amberText: "#6E5A24", amberSoft: "#F0E9D8",
};
const DISPLAY = { fontFamily: "'Archivo', system-ui, sans-serif" };
const MONO = { fontFamily: "'IBM Plex Mono', ui-monospace, monospace" };

const SWATCHES = [
  { name: "Ledger Green", hex: C.green, role: "Brand · primary actions · active" },
  { name: "Green Soft", hex: C.greenSoft, role: "Positive / selected fills" },
  { name: "Ink", hex: C.ink, role: "Primary text · wordmark" },
  { name: "Paper", hex: C.paper, role: "Background canvas" },
  { name: "Surface", hex: C.surface, role: "Cards · panels" },
  { name: "Rule", hex: C.rule, role: "1px borders everywhere" },
  { name: "Muted Text", hex: C.muted, role: "Secondary text (AA-corrected)" },
  { name: "Stamp Red", hex: C.red, role: "Urgent · destructive ONLY" },
  { name: "Red Soft", hex: C.redSoft, role: "Urgent fills" },
  { name: "Brass Amber", hex: C.amber, role: "Amber borders · icons" },
  { name: "Amber Text", hex: C.amberText, role: "Amber text incl. stamps (AA)" },
  { name: "Amber Soft", hex: C.amberSoft, role: "Pending fills" },
];

const CONTRAST = [
  ["Ink on Paper", "14.73:1", "AAA"],
  ["Ink on Surface", "15.96:1", "AAA"],
  ["Green on Paper", "8.73:1", "AAA"],
  ["Button text on Green", "8.95:1", "AAA"],
  ["Green on Green Soft", "8.15:1", "AAA"],
  ["Ink on Green Soft", "13.75:1", "AAA"],
  ["Red on Paper", "6.33:1", "AA"],
  ["Red on Red Soft", "5.76:1", "AA"],
  ["Amber Text on Paper", "5.89:1", "AA"],
  ["Amber Text on Amber Soft", "5.51:1", "AA"],
  ["Muted Text on Paper", "5.16:1", "AA"],
  ["Muted Text on Surface", "5.59:1", "AA"],
];

const TYPE_SCALE = [
  { label: "Display XL — Archivo 800", sample: "CLAIM HEALTH", style: { ...DISPLAY, fontSize: 28, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" } },
  { label: "Display L — Archivo 700", sample: "Binder Log", style: { ...DISPLAY, fontSize: 20, fontWeight: 700 } },
  { label: "Section — Archivo 700 caps", sample: "EVIDENCE CHECKLIST", style: { ...DISPLAY, fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" } },
  { label: "Body — Public Sans 400", sample: "The chronology is the case. Log every contact the day it happens.", style: { fontSize: 14 } },
  { label: "Small — Public Sans 500", sample: "Verify each deadline against your policy — timelines vary.", style: { fontSize: 12, fontWeight: 500 } },
  { label: "Caption — Muted", sample: "Saves privately to your account.", style: { fontSize: 11, color: C.muted } },
  { label: "Data — IBM Plex Mono", sample: "HM 4702132 · $3,168.68 · Nov 12, 2024", style: { ...MONO, fontSize: 14 } },
];

const ENTRY_META = [
  { label: "Phone call", tag: "CALL", Icon: Phone },
  { label: "Email", tag: "EMAIL", Icon: Mail },
  { label: "Adjuster visit", tag: "VISIT", Icon: HardHat },
  { label: "Photos taken", tag: "PHOTO", Icon: Camera },
  { label: "Letter sent", tag: "LETTER", Icon: FileText },
  { label: "Payment received", tag: "PAYMENT", Icon: DollarSign },
  { label: "Other", tag: "NOTE", Icon: StickyNote },
];

/* ---------- primitives ---------- */
const TabSeal = ({ size = 40, bg = C.green, fg = C.paper, radius = 0.22 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" aria-label="WholeClaim Tab Seal">
    <rect width="200" height="200" rx={200 * radius} fill={bg} />
    <path d="M46 80 v-16 a8 8 0 0 1 8 -8 h30 l14 14 h48 a8 8 0 0 1 8 8 v52 a10 10 0 0 1 -10 10 h-88 a10 10 0 0 1 -10 -10 z"
      fill="none" stroke={fg} strokeWidth="9" strokeLinejoin="round" />
    <circle cx="100" cy="106" r="17" fill={fg} />
  </svg>
);

const Stamp = ({ children, tone = "ink" }) => {
  const tones = {
    ink: { color: C.ink, borderColor: C.ink, background: "transparent" },
    green: { color: C.green, borderColor: C.green, background: C.greenSoft },
    red: { color: C.red, borderColor: C.red, background: C.redSoft },
    amber: { color: C.amberText, borderColor: C.amber, background: C.amberSoft },
  };
  return (
    <span className="inline-block px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide border rounded-sm"
      style={{ ...MONO, ...tones[tone] }}>
      {children}
    </span>
  );
};

const Section = ({ title, note, children }) => (
  <section className="mb-10">
    <div className="flex items-baseline justify-between border-b pb-2 mb-4" style={{ borderColor: C.rule }}>
      <h2 className="text-base font-bold uppercase tracking-wider" style={{ ...DISPLAY, color: C.ink }}>{title}</h2>
      {note && <span className="text-xs" style={{ ...MONO, color: C.muted }}>{note}</span>}
    </div>
    {children}
  </section>
);

const inputCls = "w-full text-sm px-3 py-2 rounded-sm border bg-white focus:outline-none focus:ring-2";
const inputStyle = { borderColor: C.rule, color: C.ink };

/* ================================================================== */
export default function WholeClaimDesignSystem() {
  return (
    <div className="min-h-screen" style={{ background: C.paper, color: C.ink, fontFamily: "'Public Sans', system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=Public+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');`}</style>

      <div className="max-w-3xl mx-auto px-4 pt-8 pb-12">
        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap mb-2">
          <TabSeal size={44} />
          <div className="text-2xl font-extrabold uppercase" style={{ ...DISPLAY, letterSpacing: "0.06em" }}>
            Whole<span style={{ color: C.green }}>Claim</span>
          </div>
          <span className="ml-auto"><Stamp tone="amber">Pending name clearance</Stamp></span>
        </div>
        <p className="text-sm mb-1" style={{ color: C.ink }}>Design System v1.0 — Phase 1.2 visual identity, component library, and website style reference.</p>
        <p className="text-xs mb-8" style={{ color: C.muted }}>Every document. Every deadline. Every detail.</p>

        {/* 1 · Identity */}
        <Section title="01 · Identity" note="the Tab Seal">
          <div className="flex items-center gap-4 flex-wrap mb-4">
            <TabSeal size={72} />
            <TabSeal size={48} bg={C.surface} fg={C.green} />
            <TabSeal size={48} bg={C.ink} fg={C.paper} />
            <div className="text-3xl font-extrabold uppercase" style={{ ...DISPLAY, letterSpacing: "0.05em" }}>
              Whole<span style={{ color: C.green }}>Claim</span>
            </div>
          </div>
          <p className="text-sm" style={{ color: C.muted }}>
            The folder is the file. The full circle is the whole. Clearspace = tab height. Min icon 24px.
            Never rotated, never gradiented, never on Stamp Red. The circle stays a circle — never a checkmark.
          </p>
        </Section>

        {/* 2 · Color */}
        <Section title="02 · Color" note="12 tokens">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
            {SWATCHES.map((s) => (
              <div key={s.name} className="border rounded-sm overflow-hidden" style={{ borderColor: C.rule, background: "#FFFFFF" }}>
                <div style={{ background: s.hex, height: 44, borderBottom: `1px solid ${C.rule}` }} />
                <div className="p-2">
                  <div className="text-xs font-bold" style={{ color: C.ink }}>{s.name}</div>
                  <div className="text-xs" style={{ ...MONO, color: C.muted }}>{s.hex}</div>
                  <div className="text-xs mt-0.5" style={{ color: C.muted }}>{s.role}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="border rounded-sm" style={{ borderColor: C.rule, background: "#FFFFFF" }}>
            <div className="px-3 py-2 border-b flex items-center justify-between" style={{ borderColor: C.rule }}>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ ...DISPLAY }}>Measured contrast — WCAG 2.1</span>
              <Stamp tone="green">All text pairs ≥ AA</Stamp>
            </div>
            {CONTRAST.map(([pair, ratio, grade], i) => (
              <div key={pair} className="flex items-center px-3 py-1.5 text-sm" style={{ borderTop: i ? `1px solid ${C.rule}` : "none" }}>
                <span className="flex-1" style={{ color: C.ink }}>{pair}</span>
                <span className="w-20 text-right" style={{ ...MONO, color: C.muted }}>{ratio}</span>
                <span className="w-14 text-right">
                  <Stamp tone={grade === "AAA" ? "green" : "amber"}>{grade}</Stamp>
                </span>
              </div>
            ))}
            <div className="px-3 py-2 text-xs border-t" style={{ borderColor: C.rule, color: C.muted }}>
              Retired from text duty: #6E7069 (4.44:1) and #8A6D2F-as-text (4.31:1). Rule: red carries meaning, never decoration.
            </div>
          </div>
        </Section>

        {/* 3 · Typography */}
        <Section title="03 · Typography" note="Archivo · Public Sans · IBM Plex Mono">
          <div className="border rounded-sm" style={{ borderColor: C.rule, background: "#FFFFFF" }}>
            {TYPE_SCALE.map((t, i) => (
              <div key={t.label} className="px-3 py-3" style={{ borderTop: i ? `1px solid ${C.rule}` : "none" }}>
                <div className="text-xs mb-1" style={{ ...MONO, color: C.muted }}>{t.label}</div>
                <div style={{ color: C.ink, ...t.style }}>{t.sample}</div>
              </div>
            ))}
          </div>
          <p className="text-xs mt-2" style={{ color: C.muted }}>
            Mono is mandatory for claim numbers, policy numbers, dates, dollars, scores, and countdowns. No serifs anywhere in the system.
          </p>
        </Section>

        {/* 4 · Iconography */}
        <Section title="04 · Iconography" note="Lucide · evidence chips">
          <div className="flex flex-wrap gap-3">
            {ENTRY_META.map(({ label, tag, Icon }) => (
              <div key={tag} className="flex items-center gap-2 border rounded-sm px-2 py-1.5" style={{ borderColor: C.rule, background: "#FFFFFF" }}>
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-sm border"
                  style={{ background: C.greenSoft, borderColor: C.green, color: C.green }}>
                  <Icon size={14} />
                </span>
                <div>
                  <div className="text-xs font-semibold" style={{ color: C.ink }}>{label}</div>
                  <div className="text-xs" style={{ ...MONO, color: C.muted }}>{tag}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs mt-2" style={{ color: C.muted }}>One fixed icon per entry type. Emoji never appear in product.</p>
        </Section>

        {/* 5 · Buttons & stamps */}
        <Section title="05 · Buttons & Stamps">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-sm" style={{ background: C.green, color: "#F5F4EC" }}>
              <Check size={16} /> Primary action
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-sm border" style={{ borderColor: C.green, color: C.green, background: "transparent" }}>
              <Plus size={16} /> Secondary
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-sm" style={{ background: C.red, color: "#F5F4EC" }}>
              <Trash2 size={16} /> Destructive
            </button>
            <button disabled className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-sm opacity-40" style={{ background: C.green, color: "#F5F4EC" }}>
              Disabled
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Stamp tone="green">Analysis on file</Stamp>
            <Stamp tone="amber">63d left</Stamp>
            <Stamp tone="red">12d left</Stamp>
            <Stamp tone="red">4d past</Stamp>
            <Stamp>PAYMENT</Stamp>
            <Stamp tone="green">Verified Jul 12, 2026</Stamp>
          </div>
        </Section>

        {/* 6 · Forms */}
        <Section title="06 · Forms">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: C.muted }}>Claim number</span>
              <input className={inputCls} style={{ ...inputStyle, ...MONO }} placeholder="ZHM0012345" readOnly />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: C.muted }}>Damage category</span>
              <select className={inputCls} style={inputStyle} defaultValue="Water / plumbing">
                <option>Water / plumbing</option><option>Roof / storm</option>
              </select>
            </label>
          </div>
          <p className="text-xs mt-2" style={{ color: C.muted }}>Labels: 11px caps, muted. Fields: white on Surface, Rule borders, 2px radius. Record data renders mono.</p>
        </Section>

        {/* 7 · Exhibit tabs */}
        <Section title="07 · Exhibit Tabs" note="signature pattern">
          <div className="flex -mb-px">
            {[{ l: "A", t: "Dashboard", a: false }, { l: "B", t: "Binder Log", a: true }, { l: "C", t: "Analyze", a: false }].map((tab) => (
              <div key={tab.l} className="px-3 py-2 border rounded-t-sm mr-1 text-xs font-semibold uppercase tracking-wide inline-flex items-center gap-2"
                style={{
                  borderColor: tab.a ? C.rule : "transparent",
                  borderBottomColor: tab.a ? C.surface : "transparent",
                  borderTop: tab.a ? `3px solid ${C.green}` : "3px solid transparent",
                  background: tab.a ? C.surface : "transparent",
                  color: tab.a ? C.ink : C.muted,
                }}>
                <span className="inline-flex items-center justify-center w-4 h-4 border rounded-sm"
                  style={{ ...MONO, borderColor: tab.a ? C.green : C.muted, color: tab.a ? C.green : C.muted }}>{tab.l}</span>
                {tab.t}
              </div>
            ))}
          </div>
          <div className="border rounded-b-sm rounded-tr-sm p-4 text-sm" style={{ borderColor: C.rule, background: C.surface, color: C.muted }}>
            Active tab: green top bar, lettered like a court exhibit. Content card joins the tab.
          </div>
        </Section>

        {/* 8 · Dashboard modules */}
        <Section title="08 · Dashboard Modules">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="text-xs uppercase tracking-widest mb-1" style={{ color: C.muted }}>Claim health</div>
              {[["Evidence", 33, 40], ["Paper trail", 16, 20], ["Deadlines", 20, 20], ["Freshness", 20, 20]].map(([k, p, m]) => (
                <div key={k} className="flex items-center gap-2 mb-1">
                  <span className="text-xs w-20 shrink-0 uppercase tracking-wide" style={{ color: C.muted }}>{k}</span>
                  <div className="h-1.5 flex-1 rounded-sm" style={{ background: C.rule }}>
                    <div className="h-1.5 rounded-sm" style={{ width: `${(p / m) * 100}%`, background: p / m >= 0.7 ? C.green : C.amber }} />
                  </div>
                  <span className="text-xs w-10 text-right" style={{ ...MONO, color: C.muted }}>{p}/{m}</span>
                </div>
              ))}
            </div>
            <div className="shrink-0 w-16 h-16 border-4 rounded-sm flex flex-col items-center justify-center"
              style={{ ...DISPLAY, borderColor: C.green, color: C.green, background: C.greenSoft, transform: "rotate(-5deg)", borderStyle: "double" }}>
              <span className="text-2xl font-extrabold leading-none">89</span>
              <span className="text-xs" style={MONO}>/100</span>
            </div>
          </div>
          <div className="w-full flex items-start gap-3 rounded-sm px-3 py-3 mb-4" style={{ background: C.greenSoft, borderLeft: `3px solid ${C.green}` }}>
            <ArrowRight size={16} className="mt-0.5 shrink-0" style={{ color: C.green }} />
            <div>
              <div className="text-xs font-bold uppercase tracking-widest" style={{ ...DISPLAY, color: C.green }}>Next recommended action</div>
              <div className="text-sm mt-0.5" style={{ color: C.ink }}>Collect and check off: Moisture readings / drying logs</div>
            </div>
          </div>
          <div className="border rounded-sm" style={{ borderColor: C.rule, background: "#FFFFFF" }}>
            {[["Before photos (pre-repair)", true], ["Mitigation invoice", true], ["Moisture readings / drying logs", false]].map(([item, done], i) => (
              <div key={item} className="flex items-center gap-3 px-3 py-2.5 text-sm" style={{ borderTop: i ? `1px solid ${C.rule}` : "none", color: done ? C.ink : C.muted }}>
                <span className="inline-flex items-center justify-center w-4 h-4 border rounded-sm shrink-0"
                  style={{ borderColor: done ? C.green : C.rule, background: done ? C.green : "#FFFFFF" }}>
                  {done && <Check size={12} color="#F5F4EC" />}
                </span>
                {item}
              </div>
            ))}
          </div>
        </Section>

        {/* 9 · Records */}
        <Section title="09 · Records" note="entry card · deadline row · output">
          <div className="border rounded-sm p-3 mb-3" style={{ borderColor: C.rule, background: "#FFFFFF" }}>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-sm border shrink-0" style={{ background: C.greenSoft, borderColor: C.green, color: C.green }}>
                <Phone size={14} />
              </span>
              <Stamp>CALL</Stamp>
              <span className="text-xs" style={{ color: C.muted }}>Field adjuster</span>
              <span className="ml-auto text-xs" style={{ ...MONO, color: C.muted }}>Jul 10, 2026</span>
            </div>
            <p className="text-sm mt-2" style={{ color: C.ink }}>"We'll review the supplement." Confirmed in writing same day. Attachments noted in vault.</p>
          </div>
          <div className="flex items-center gap-3 border rounded-sm px-3 py-2 mb-3" style={{ borderColor: C.rule, background: "#FFFFFF" }}>
            <Stamp tone="red">22d left</Stamp>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium" style={{ color: C.ink }}>Bad-faith demand window closes</div>
              <div className="text-xs" style={{ ...MONO, color: C.muted }}>Aug 3, 2026</div>
            </div>
            <Trash2 size={16} style={{ color: C.muted }} />
          </div>
          <div className="border rounded-sm" style={{ borderColor: C.rule, background: "#FFFFFF" }}>
            <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: C.rule }}>
              <Stamp tone="green">Analysis on file</Stamp>
              <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide" style={{ color: C.green }}>
                <Copy size={14} /> Copy
              </span>
            </div>
            <div className="p-3 text-sm leading-relaxed" style={{ color: C.ink }}>
              OCCURRENCE ANALYSIS{"\n"}A supplemental payment on an existing loss is not a new occurrence...
            </div>
          </div>
        </Section>

        {/* 10 · Social templates */}
        <Section title="10 · Social Templates" note="feed register">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Prompt post */}
            <div className="border rounded-sm p-4 aspect-square flex flex-col" style={{ borderColor: C.rule, background: C.paper }}>
              <div className="flex items-center gap-2 mb-3">
                <TabSeal size={20} radius={0.24} />
                <span className="text-xs font-bold" style={{ ...MONO, color: C.ink }}>@wholeclaim</span>
                <span className="ml-auto text-xs px-1.5 border rounded-sm" style={{ ...MONO, borderColor: C.rule, color: C.muted }}>5/12</span>
              </div>
              <div className="text-lg font-extrabold leading-tight mb-2" style={{ ...DISPLAY, color: C.ink }}>3. The Policy Decoder</div>
              <p className="text-xs leading-relaxed flex-1" style={{ color: C.ink }}>
                Act as a homeowners policy translation specialist. I'm staring at my policy and can't tell what's covered for [my situation]. Decode it: the sections that apply, the exclusions my insurer will try to use, and the deadlines that quietly kill claims.
              </p>
              <div className="text-xs pt-2 border-t" style={{ borderColor: C.rule, color: C.muted }}>
                Build the claim file your insurance company wishes you didn't have.
              </div>
            </div>
            {/* Receipt post */}
            <div className="border rounded-sm p-4 aspect-square flex flex-col" style={{ borderColor: C.rule, background: C.paper }}>
              <div className="flex items-center gap-2 mb-3">
                <TabSeal size={20} radius={0.24} />
                <span className="text-xs font-bold" style={{ ...MONO, color: C.ink }}>@wholeclaim</span>
                <span className="ml-auto"><Stamp tone="red">Receipt</Stamp></span>
              </div>
              <div className="flex-1 border rounded-sm p-3" style={{ borderColor: C.rule, background: "#FFFFFF" }}>
                <div className="text-xs mb-2" style={{ ...MONO, color: C.ink }}>RATING WORKSHEET — EXCERPT</div>
                <div className="h-2.5 rounded-sm mb-2" style={{ background: C.ink, width: "62%" }} />
                <div className="text-xs mb-1" style={{ ...MONO, color: C.ink }}>ROOF YEAR (RATED): 2005</div>
                <div className="text-xs mb-2" style={{ ...MONO, color: C.ink }}>ROOF YEAR (ACTUAL): 2021</div>
                <div className="h-2.5 rounded-sm mb-3" style={{ background: C.ink, width: "44%" }} />
                <span className="inline-block px-2 py-1 border-2 rounded-sm text-xs font-bold uppercase"
                  style={{ ...MONO, borderColor: C.red, color: C.red, transform: "rotate(-4deg)" }}>
                  Corrected: $1,235
                </span>
              </div>
              <div className="text-xs pt-2 mt-2 border-t" style={{ borderColor: C.rule, color: C.muted }}>
                Their math. Our correction. Check yours.
              </div>
            </div>
          </div>
          <p className="text-xs mt-2" style={{ color: C.muted }}>
            Redaction bars are a brand device: ink-black, square-cornered, always over real documents. Never fake a document.
          </p>
        </Section>

        {/* Rules */}
        <div className="border-2 rounded-sm p-4" style={{ borderColor: C.green, background: C.greenSoft }}>
          <div className="text-sm font-bold uppercase tracking-wide mb-2" style={{ ...DISPLAY, color: C.green }}>System rules</div>
          <p className="text-sm leading-relaxed" style={{ color: C.ink }}>
            Red carries meaning, never decoration. Mono for anything that belongs in a record. Muted Text is #63665F — never lighter.
            2px radius, 1px Rule borders, structure over shadow. Paper is the canvas; content lives on Surface.
            Every screen answers "what should I do next?"
          </p>
        </div>

        <p className="text-xs mt-6" style={{ ...MONO, color: C.muted }}>
          WHOLECLAIM DESIGN SYSTEM v1.0 · PHASE 1.2 · CONTRAST MEASURED PER WCAG 2.1 · STATUS: PENDING NAME CLEARANCE
        </p>
      </div>
    </div>
  );
}
