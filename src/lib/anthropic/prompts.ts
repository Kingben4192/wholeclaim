// Ported verbatim from 04_Engineering/Prototype-App-v2.jsx (ANALYZE_TOOLS,
// letterPrompt, decidePrompt, ingestPrompt) — tested IP, Golden Test Run 01 (6/6 pass).
// Do not edit prompt wording without a new PROMPT_VERSION and a rerun of the golden set.

export const PROMPT_VERSION = "claim-binder-v2-golden-01";

const FORMAT_RULES =
  "Respond in plain text only. Use ALL-CAPS section headings on their own lines. No markdown symbols, no asterisks, no numbered markdown lists. Be specific and concrete. This is educational self-help documentation support, not legal advice.";

export type AnalyzeTool = "policy" | "gap" | "loss";

const ANALYZE_PROMPTS: Record<
  AnalyzeTool,
  (input: string, ctx: string, lib: string) => string
> = {
  policy: (input, ctx, lib) =>
    `You are a homeowners-insurance policy analysis assistant inside a self-help claim documentation app. The user is a policyholder reviewing their own policy.\n\n${ctx}\n\n${lib}\n\nPOLICY LANGUAGE AND SITUATION FROM USER:\n${input}\n\nAnalyze under these headings: COVERAGE THAT LIKELY APPLIES / EXCLUSIONS AND LIMITATIONS TO WATCH / DEADLINES AND CONDITIONS FOUND / QUESTIONS TO PUT TO THE CARRIER IN WRITING. Where the excerpt is silent, name the standard HO-3 section to go check. ${FORMAT_RULES}`,
  gap: (input, ctx, lib) =>
    `You are a repair-scope audit assistant inside a self-help claim documentation app, with general-contractor-level knowledge of trades and building code.\n\n${ctx}\n\n${lib}\n\nCARRIER ESTIMATE AND ACTUAL DAMAGE FROM USER:\n${input}\n\nAnalyze under these headings: LIKELY MISSING TRADES AND LINE ITEMS / CODE-REQUIRED ITEMS TO VERIFY / COMMONLY UNDERPAID ITEMS FOR THIS DAMAGE TYPE / HOW TO DOCUMENT THE GAP / QUESTIONS FOR THE ADJUSTER. ${FORMAT_RULES}`,
  loss: (input, ctx, lib) =>
    `You are an occurrence-counting analysis assistant inside a self-help claim documentation app. Carriers sometimes count a supplemental payment as a separate loss occurrence, inflating the loss count used to justify non-renewal.\n\n${ctx}\n\n${lib}\n\nCLAIM AND PAYMENT HISTORY FROM USER:\n${input}\n\nAnalyze under these headings: OCCURRENCE ANALYSIS / WHICH ENTRIES LOOK LIKE SUPPLEMENTS TO A PRIOR LOSS / RECORDS TO REQUEST FROM THE CARRIER / WHY THE COUNT MATTERS FOR NON-RENEWAL / NEXT DOCUMENTATION STEPS. ${FORMAT_RULES}`,
};

export function analyzePrompt(
  tool: AnalyzeTool,
  input: string,
  ctx: string,
  lib: string,
) {
  return ANALYZE_PROMPTS[tool](input, ctx, lib);
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
) {
  return `You are a settlement decision framework assistant inside a self-help claim documentation app.\n\n${ctx}\n\n${lib}\n\nNUMBERS FROM THE POLICYHOLDER:\nCarrier offer on the table: $${offer || "unknown"}\nPolicyholder's estimate of full covered cost: $${estimate || "unknown"}\nMonths the claim has been open: ${months || "unknown"}\nWhat is disputed: ${disputed || "not specified"}\n\nAnalyze under these headings: THE GAP / WHAT SIGNING A RELEASE TYPICALLY ENDS / THE REALISTIC COST OF CONTINUING / LEVERAGE SIGNALS TO WATCH FOR / DECISION FRAMEWORK / BOTTOM LINE. Present a framework the person applies themselves, not a directive. Note this is educational, not legal or financial advice. ${FORMAT_RULES}`;
}

export function ingestPrompt(raw: string) {
  return `You are the intake engine for a user-controlled knowledge library inside a claim documentation app. The library owner pastes raw material; you structure it into draft entries THE OWNER must approve before anything enters the library.\n\nConvert the raw material below into 1 to 4 draft entries. Respond with ONLY a JSON array — no markdown fences, no commentary, no text before or after. Each entry is an object with exactly these keys:\n"type": one of "statute", "code", "price", "procedure"\n"jurisdiction": e.g. "GA", "Fulton County", "national"\n"cite": a short citation or label taken from the material\n"summary": 2-3 plain-English sentences focused on how a policyholder uses this\n"confidence": "high", "medium", or "low"\n"verify_note": one sentence on what the owner should verify before approving\n\nRules: never invent citation numbers, prices, or dates that are not present in the material. If the material lacks a citation, use a descriptive label and set confidence to "low".\n\nRAW MATERIAL:\n${raw}`;
}
