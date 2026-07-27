// Tier 1 output-side guardrail (BRAND_VOICE.md addendum, Section B) --
// scans AI output from the two highest-risk tools (Decision Assistant,
// Letter Builder) for phrasing that crosses from self-help documentation
// into implied legal/insurance-outcome advice. This is a second layer
// behind the system-prompt NEVER_LIST (prompts.ts) -- a prompt asks the
// model not to do something; this catches it if it does anyway.
//
// Two response types, deliberately different:
//   - SOFTEN: a narrow, targeted phrase substitution for language that's
//     usually just a wording problem (a sue/lawyer suggestion), rewritten
//     to the neutral form in place. Explicitly carved out from "don't
//     silently edit" below -- discarding an otherwise-fine multi-paragraph
//     letter over one fixable phrase is worse than a precise, logged
//     substitution of just that phrase.
//   - BLOCK: the full response is replaced with a generic safe fallback
//     plus the universal disclaimer. Never a partial edit here -- a
//     quietly removed sentence can leave the rest of the response making
//     a claim it no longer supports.
//
// Starter pattern list only, per the addendum -- expand once real beta
// output shows what actually slips through both this and the prompt.

export const UNIVERSAL_DISCLAIMER =
  "WholeClaim helps organize documentation. It does not provide insurance advice, guarantee claim approval, or determine claim outcomes.";

const SAFE_FALLBACK =
  "This response couldn't be shown because it may have crossed into advice WholeClaim doesn't give -- predicting an outcome, a payment amount, or a carrier decision. Try rephrasing your input, or review your file directly.";

const SOFTEN_PATTERNS: { pattern: RegExp; replacement: string }[] = [
  { pattern: /\byou should sue\b/gi, replacement: "you may want to consult an attorney about this" },
  { pattern: /\bget a lawyer\b/gi, replacement: "consult an attorney about this" },
];

// No `g` flag -- only ever used with .test(), and a global regex's
// stateful lastIndex makes repeated .test() calls on the same instance
// unreliable across invocations.
const BLOCK_PATTERNS: RegExp[] = [
  /\bwill be approved\b/i,
  /\bwill approve\b/i,
  /\bguaranteed to\b/i,
  /\byou will receive \$/i,
  /\byou are owed \$/i,
  /\byou'?re entitled to \$/i,
  /\byour claim will\b/i,
  /\bthis proves\b/i,
  /\bthis is fraud\b/i,
  /\bbad faith\b/i,
];

export type OutputFilterResult = {
  text: string;
  blocked: boolean;
  softened: boolean;
};

export function applyOutputFilter(text: string, tool: string): OutputFilterResult {
  let softenedText = text;
  let softened = false;
  for (const { pattern, replacement } of SOFTEN_PATTERNS) {
    const next = softenedText.replace(pattern, replacement);
    if (next !== softenedText) softened = true;
    softenedText = next;
  }

  const blocked = BLOCK_PATTERNS.some((p) => p.test(softenedText));
  if (blocked) {
    console.error(`applyOutputFilter: BLOCKED output from tool "${tool}" -- flagged for review. Original:`, text);
    return { text: `${SAFE_FALLBACK}\n\n${UNIVERSAL_DISCLAIMER}`, blocked: true, softened };
  }

  if (softened) {
    console.error(`applyOutputFilter: SOFTENED output from tool "${tool}" -- flagged for review. Original:`, text);
  }

  return { text: softenedText, blocked: false, softened };
}
