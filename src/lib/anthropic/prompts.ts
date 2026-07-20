// Ported verbatim from 04_Engineering/Prototype-App-v2.jsx (ANALYZE_TOOLS,
// letterPrompt, decidePrompt, ingestPrompt) — tested IP, Golden Test Run 01 (6/6 pass).
// Do not edit prompt wording without a new PROMPT_VERSION and a rerun of the golden set.
//
// v2-golden-02: LC (loss) and DA (decide) extended per AI-Prompt-Library.md
// A.6 change log — richer CLAIM CONTEXT (real entries/evidence/deadlines,
// not just a count) and a deterministic ESCALATION PATTERN CHECK block.
// Requires Test Run 02 regression (G1, G5-adjacent) before Production status
// per A.6 — not yet run against the deployed app as of this change.
//
// v2-golden-03: added MC (mold), the Mold Coverage Timeline tool (Roadmap
// Phase 1, Pro). New tool, not an edit to an existing template — bumped per
// A.6 rule 1 regardless. Not yet Production; requires Test Run 02.
//
// v2-golden-04: added SU (supplement), the Supplement Assistant (Roadmap
// Phase 1, Pro). New tool. Not yet Production; requires Test Run 02.
export const PROMPT_VERSION = "claim-binder-v2-golden-04";

const FORMAT_RULES =
  "Respond in plain text only. Use ALL-CAPS section headings on their own lines. No markdown symbols, no asterisks, no numbered markdown lists. Be specific and concrete. This is educational self-help documentation support, not legal advice.";

export type AnalyzeTool = "policy" | "gap" | "loss" | "mold";

const ANALYZE_PROMPTS: Record<
  AnalyzeTool,
  (input: string, ctx: string, lib: string, signals: string) => string
> = {
  policy: (input, ctx, lib) =>
    `You are a homeowners-insurance policy analysis assistant inside a self-help claim documentation app. The user is a policyholder reviewing their own policy.\n\n${ctx}\n\n${lib}\n\nPOLICY LANGUAGE AND SITUATION FROM USER:\n${input}\n\nAnalyze under these headings: COVERAGE THAT LIKELY APPLIES / EXCLUSIONS AND LIMITATIONS TO WATCH / DEADLINES AND CONDITIONS FOUND / QUESTIONS TO PUT TO THE CARRIER IN WRITING. Where the excerpt is silent, name the standard HO-3 section to go check. ${FORMAT_RULES}`,
  gap: (input, ctx, lib) =>
    `You are a repair-scope audit assistant inside a self-help claim documentation app, with general-contractor-level knowledge of trades and building code.\n\n${ctx}\n\n${lib}\n\nCARRIER ESTIMATE AND ACTUAL DAMAGE FROM USER:\n${input}\n\nAnalyze under these headings: LIKELY MISSING TRADES AND LINE ITEMS / CODE-REQUIRED ITEMS TO VERIFY / COMMONLY UNDERPAID ITEMS FOR THIS DAMAGE TYPE / HOW TO DOCUMENT THE GAP / QUESTIONS FOR THE ADJUSTER. ${FORMAT_RULES}`,
  loss: (input, ctx, lib, signals) =>
    `You are an occurrence-counting analysis assistant inside a self-help claim documentation app. Carriers sometimes count a supplemental payment as a separate loss occurrence, inflating the loss count used to justify non-renewal.\n\n${ctx}\n\n${lib}\n\n${signals}\n\nCLAIM AND PAYMENT HISTORY FROM USER:\n${input}\n\nAnalyze under these headings: OCCURRENCE ANALYSIS / WHICH ENTRIES LOOK LIKE SUPPLEMENTS TO A PRIOR LOSS / RECORDS TO REQUEST FROM THE CARRIER / WHY THE COUNT MATTERS FOR NON-RENEWAL / ESCALATION CONSIDERATIONS / WHAT COULD NOT BE DETERMINED / NEXT DOCUMENTATION STEPS. Under ESCALATION CONSIDERATIONS: if the escalation pattern check found anything, name the pattern category and briefly explain why that category is typically worth attention (e.g. "this pattern typically warrants attorney review" or "this looks like a contractor documentation gap") — a decision aid the user applies themselves, never a directive, and never a conclusion about their specific case. If the pattern check found nothing, say so plainly. Under WHAT COULD NOT BE DETERMINED: name anything the provided documentation and claim data cannot support, and which document or entry would resolve it — or state plainly that nothing material is missing. ${FORMAT_RULES}`,
  mold: (_input, ctx, lib, signals) =>
    `You are a mold-risk documentation assistant inside a self-help claim documentation app. Prolonged moisture exposure raises mold risk over time; prompt mitigation and thorough documentation are what typically protect coverage and health, not any specific universal deadline — reporting windows and mold sublimits vary by policy and state and must never be stated as fact unless sourced from the owner-approved library below.\n\n${ctx}\n\n${lib}\n\n${signals}\n\nAnalyze under these headings: TIMELINE SUMMARY / WHY TIMING MATTERS FOR MOLD RISK / MITIGATION DOCUMENTATION TO GATHER NOW / POLICY AND STATE SPECIFICS TO VERIFY / WHAT COULD NOT BE DETERMINED. Under TIMELINE SUMMARY: restate the water/mold timeline data already computed above in plain language — do not invent dates or events not present in it. Under WHY TIMING MATTERS: general, well-established mold-risk education only (moisture plus time grows risk; this is not a claim-specific prediction). Under POLICY AND STATE SPECIFICS TO VERIFY: if the knowledge library above has an entry for this claim's state or policy type, reference it directly; otherwise say plainly that reporting windows and mold sublimits vary and must be checked in the user's own policy or state resources, and suggest logging a deadline once they confirm one. Under WHAT COULD NOT BE DETERMINED: name anything the tracked data cannot support (e.g. no date of loss on file, no related entries logged) and what would resolve it. Never assert a specific number of days as a real deadline unless it is directly sourced from the library entries above. ${FORMAT_RULES}`,
};

export function analyzePrompt(
  tool: AnalyzeTool,
  input: string,
  ctx: string,
  lib: string,
  signals: string = "",
) {
  return ANALYZE_PROMPTS[tool](input, ctx, lib, signals);
}

export type LetterType = "supplement" | "delay" | "doi" | "nonrenewal";

const LETTER_BODY: Record<LetterType, string> = {
  supplement:
    "LETTER TYPE: Supplement request. The carrier's payment did not cover the full covered damage. Request a supplemental payment tied to the same loss occurrence, state that this is a supplement to the existing claim and NOT a new claim or new occurrence, and request written confirmation of how it will be recorded.",
  delay:
    "LETTER TYPE: Claim status and delay demand. The claim has been pending too long. Request a written status, a decision date, and the specific information still needed, and note that state claims-handling regulations set time standards for acknowledgment and decision.",
  doi:
    "LETTER TYPE: Complaint to the state insurance regulator (for Georgia, the Office of Commissioner of Insurance and Safety Fire; otherwise the user's state department of insurance). Summarize the carrier conduct factually with dates, state what resolution is requested, and list the documents attached as exhibits.",
  nonrenewal:
    "LETTER TYPE: Non-renewal challenge to the carrier. Request the specific statutory and factual basis for non-renewal in writing, an itemized list of the loss occurrences counted with dates and amounts, and correction if any supplemental payment was counted as a separate occurrence.",
};

export function letterPrompt(
  type: LetterType,
  facts: string,
  ctx: string,
  lib: string,
) {
  const base = `You are drafting a professional letter for a policyholder to review and send themselves. Write in first person as the policyholder. Firm, factual, professional. No threats. No legal conclusions asserted as fact.\n\n${ctx}\n\n${lib}\n\nKEY FACTS FROM THE POLICYHOLDER:\n${facts || "None provided — work from the claim context."}\n\n`;
  const shape =
    "Output only the letter text. Structure: [DATE] on the first line, recipient block placeholder, a RE: line with the claim and policy numbers, a short opening stating the purpose, numbered factual points, a specific request with a 14-day written-response deadline, and a signature block with [NAME] and contact placeholders. Close with the line: Prepared by the policyholder as self-help documentation. Plain text only, no markdown symbols.";
  return base + LETTER_BODY[type] + "\n\n" + shape;
}

export function decidePrompt(
  offer: string,
  estimate: string,
  months: string,
  disputed: string,
  ctx: string,
  lib: string,
  signals: string = "",
) {
  return `You are a settlement decision framework assistant inside a self-help claim documentation app.\n\n${ctx}\n\n${lib}\n\n${signals}\n\nNUMBERS FROM THE POLICYHOLDER:\nCarrier offer on the table: $${offer || "unknown"}\nPolicyholder's estimate of full covered cost: $${estimate || "unknown"}\nMonths the claim has been open: ${months || "unknown"}\nWhat is disputed: ${disputed || "not specified"}\n\nAnalyze under these headings: THE GAP / WHAT SIGNING A RELEASE TYPICALLY ENDS / THE REALISTIC COST OF CONTINUING / LEVERAGE SIGNALS TO WATCH FOR / ESCALATION CONSIDERATIONS / DECISION FRAMEWORK / BOTTOM LINE. Under ESCALATION CONSIDERATIONS: if the escalation pattern check found anything, name the pattern category and briefly explain why that category is typically worth attention (e.g. "this pattern typically warrants attorney review") — a decision aid, never a directive, never a conclusion about this specific case. If it found nothing, say so plainly. Present the whole framework as something the person applies themselves, not a directive. Note this is educational, not legal or financial advice. ${FORMAT_RULES}`;
}

export function supplementPrompt(
  carrierEstimate: string,
  contractorEstimate: string,
  ctx: string,
  lib: string,
) {
  return `You are a supplement request assistant inside a self-help claim documentation app. A supplement is an additional payment request for covered damage the carrier's estimate missed or underpaid — it is a continuation of the same claim, not a new claim or new loss occurrence.\n\n${ctx}\n\n${lib}\n\nCARRIER ESTIMATE:\n${carrierEstimate || "Not provided — work from the claim context above."}\n\nCONTRACTOR ESTIMATE (or the policyholder's own scope of damage):\n${contractorEstimate || "Not provided — work from the claim context above."}\n\nAnalyze under these headings: WHAT A SUPPLEMENT IS / GAP ANALYSIS / WHAT COULD NOT BE DETERMINED / DRAFT SUPPLEMENT REQUEST. Under WHAT A SUPPLEMENT IS: two or three plain sentences explaining the concept generally, not specific to this claim. Under GAP ANALYSIS: list each item or scope element present in the contractor estimate or claim context but missing, underpriced, or under-scoped in the carrier estimate — be specific and concrete, one item per line. Under WHAT COULD NOT BE DETERMINED: name anything neither estimate nor the claim context can support, and which document would resolve it — or state plainly that nothing material is missing. Under DRAFT SUPPLEMENT REQUEST: output a ready-to-send letter, first person as the policyholder, firm and factual, no threats, no legal conclusions asserted as fact. Structure: [DATE] on the first line, recipient block placeholder, a RE: line with the claim and policy numbers, a short opening stating this is a supplement to the existing claim and not a new claim or occurrence, the itemized gaps from GAP ANALYSIS above as numbered points, a specific request with a 14-day written-response deadline, and a signature block with [NAME] and contact placeholders. Close the letter with the line: Prepared by the policyholder as self-help documentation. ${FORMAT_RULES}`;
}

export function ingestPrompt(raw: string) {
  return `You are the intake engine for a user-controlled knowledge library inside a claim documentation app. The library owner pastes raw material; you structure it into draft entries THE OWNER must approve before anything enters the library.\n\nConvert the raw material below into 1 to 4 draft entries. Respond with ONLY a JSON array — no markdown fences, no commentary, no text before or after. Each entry is an object with exactly these keys:\n"type": one of "statute", "code", "price", "procedure"\n"jurisdiction": e.g. "GA", "Fulton County", "national"\n"cite": a short citation or label taken from the material\n"summary": 2-3 plain-English sentences focused on how a policyholder uses this\n"confidence": "high", "medium", or "low"\n"verify_note": one sentence on what the owner should verify before approving\n\nRules: never invent citation numbers, prices, or dates that are not present in the material. If the material lacks a citation, use a descriptive label and set confidence to "low".\n\nRAW MATERIAL:\n${raw}`;
}
