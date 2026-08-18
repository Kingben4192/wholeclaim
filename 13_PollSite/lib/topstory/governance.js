// =============================================================================
// Ticket 3, Stage 3 — the governance filter.
//
// Built FIRST, before the approval UI, deliberately: no approve button should
// exist until the thing protecting it does.
//
// This is the deterministic half of a two-part control. It cannot be talked
// out of a decision, which is exactly why it runs before the LLM's own
// justification rather than instead of it:
//
//   1. THIS FILE   — pattern rules. Mechanical, auditable, no judgment.
//   2. LLM         — states WHY a surviving candidate passes; that sentence is
//                    shown in the review UI so the founder audits reasoning,
//                    not just a verdict.
//   3. HUMAN       — approves. Nothing publishes without it.
//
// Sources: the curation rules in the artifact's governance comment.
//   1. No polls anchored to real minors, even indirectly.
//   2. Do not amplify an event whose traction depends on participation,
//      imitation, or copycat behaviour.
//   3. Abstract the underlying question; strip identifying incident detail.
//   4. When uncertain, skip. Lost traffic from a skipped topic is trivial;
//      the downside of platforming something copycat-prone is not.
//
// -----------------------------------------------------------------------------
// THE CENTRAL DESIGN RULE — read before changing anything here.
//
// The filter judges the PROPOSED QUESTION, not the source story.
//
// This is not a detail. Worked against the Flock Safety example: the coverage
// includes nationwide camera vandalism. Filtering on the source would reject
// the entire topic — losing four legitimate policy questions about warrants,
// contracts and federal data access. Filtering on the question keeps those and
// rejects only "should people tear the cameras down", which is the one that
// actually trips rule 2.
//
// Source text is still scanned, but only to RAISE a soft flag for the human,
// never to auto-reject. See checkCandidate().
// =============================================================================

// --- Rule 1: minors -----------------------------------------------------------
const MINOR_TERMS = [
  "child", "children", "kid", "kids", "toddler", "infant", "baby", "babies",
  "minor", "minors", "teen", "teens", "teenager", "teenagers", "juvenile",
  "schoolgirl", "schoolboy", "underage", "student athlete", "schoolchild",
];

// Rule 1 is about polls ANCHORED to real minors. Generic policy language that
// happens to mention children ("should schools start later?") is legitimate.
// These contexts flip a mention into an anchoring.
const MINOR_ANCHORING_CONTEXT = [
  "victim", "abuse", "abused", "assault", "missing", "killed", "died", "death",
  "arrested", "charged", "accused", "custody", "predator", "trafficking",
];

// --- Rule 2: copycat-prone ----------------------------------------------------
// Behaviours whose spread depends on imitation. A poll asking whether people
// should do these amplifies them regardless of how the answers are worded.
const COPYCAT_TERMS = [
  "challenge", "trend of", "viral stunt", "prank", "dare",
  "vandalism", "vandalize", "vandalise", "destroy", "sabotage", "tear down",
  "smash", "burn down", "deface", "graffiti",
  "self-harm", "suicide", "overdose", "starve", "purge",
  "hack into", "break into", "steal", "shoplift", "loot", "looting",
  "swat", "swatting", "bomb threat",
];

// --- Rule 3: incident specifics ----------------------------------------------
const TRAGEDY_TERMS = [
  "shooting", "shooter", "massacre", "murder", "murdered", "homicide",
  "stabbing", "stabbed", "terror attack", "terrorist attack", "bombing",
  "crash victims", "fatal crash", "died in", "dead in", "killed in",
  "hostage", "kidnapping", "abduction", "rape", "sexual assault",
  "manhunt", "standoff",
];

const ACTIVE_PROCEEDINGS_TERMS = [
  "on trial", "indicted", "indictment", "arraigned", "pleaded guilty",
  "found guilty", "convicted of", "acquitted", "lawsuit against",
  "suing", "charged with", "sentencing", "verdict",
];

// --- Framing: prediction/opinion, never endorsement ---------------------------
// Advocacy framings invite agreement rather than an answer.
const ENDORSEMENT_PATTERNS = [
  /\bdo you (?:support|oppose|condemn|denounce|stand with|back)\b/i,
  /\bare you (?:for|against) \b/i,
  /\bshould we (?:stop|end|ban|abolish|defund)\b/i,
  /\bdon'?t you (?:think|agree)\b/i,
  /\bisn'?t it (?:time|obvious|clear)\b/i,
  /\bwhy (?:do|does|is|are)\b/i, // "why is X failing" presumes X is failing
];

const OPT_OUT_PATTERNS = [
  /not sure/i, /don'?t know/i, /no opinion/i, /haven'?t (?:thought|noticed|followed)/i,
  /not following/i, /never thought/i, /depends/i, /too close to call/i,
  /neither/i, /don'?t (?:watch|follow|care)/i,
];

function norm(s) {
  return String(s || "").toLowerCase();
}

function hits(text, terms) {
  const t = norm(text);
  return terms.filter((term) => t.includes(term));
}

/**
 * Screen one drafted candidate.
 *
 * @param {object} c
 * @param {string} c.question       the proposed poll question — THE thing judged
 * @param {string[]} c.choices      proposed answer options
 * @param {string} [c.sourceHeadline] originating headline — soft flags only
 * @returns {{ pass:boolean, hardFails:string[], softFlags:string[] }}
 */
export function checkCandidate(c) {
  const question = String(c?.question || "");
  const choices = Array.isArray(c?.choices) ? c.choices : [];
  const source = String(c?.sourceHeadline || "");
  const hardFails = [];
  const softFlags = [];

  // Rule 4, applied structurally: nothing malformed gets a pass by default.
  if (!question.trim()) hardFails.push("empty question");
  if (choices.length < 2 || choices.length > 4) {
    hardFails.push(`needs 2-4 choices, got ${choices.length}`);
  }
  if (choices.some((x) => !String(x || "").trim())) hardFails.push("blank choice");

  // The question, and the choices, are what get judged.
  const surface = `${question} ${choices.join(" ")}`;

  const copycat = hits(surface, COPYCAT_TERMS);
  if (copycat.length) hardFails.push(`copycat-prone (rule 2): ${copycat.join(", ")}`);

  const tragedy = hits(surface, TRAGEDY_TERMS);
  if (tragedy.length) hardFails.push(`tragedy/incident specifics (rule 3): ${tragedy.join(", ")}`);

  const proceedings = hits(surface, ACTIVE_PROCEEDINGS_TERMS);
  if (proceedings.length) hardFails.push(`active proceedings (rule 3): ${proceedings.join(", ")}`);

  const minors = hits(surface, MINOR_TERMS);
  if (minors.length) {
    const anchoring = hits(surface, MINOR_ANCHORING_CONTEXT);
    if (anchoring.length) {
      hardFails.push(`anchored to minors (rule 1): ${minors.join(", ")} + ${anchoring.join(", ")}`);
    } else {
      // "Should schools start later?" is legitimate. Flag, don't reject.
      softFlags.push(`mentions minors in a policy context: ${minors.join(", ")}`);
    }
  }

  const endorsement = ENDORSEMENT_PATTERNS.filter((re) => re.test(question));
  if (endorsement.length) {
    hardFails.push("endorsement-framed, not prediction/opinion-framed");
  }

  if (!choices.some((x) => OPT_OUT_PATTERNS.some((re) => re.test(String(x))))) {
    softFlags.push("no opt-out choice — a visitor with no view is forced to pick a side");
  }

  // Source scanned for CONTEXT ONLY. Never a hard fail: see the design rule at
  // the top. A story about camera vandalism can still yield a clean question
  // about warrant requirements.
  const sourceCopycat = hits(source, COPYCAT_TERMS);
  const sourceTragedy = hits(source, TRAGEDY_TERMS);
  if (sourceCopycat.length || sourceTragedy.length) {
    softFlags.push(
      `source story contains sensitive material (${[...sourceCopycat, ...sourceTragedy].join(", ")}) — ` +
        `confirm the question abstracts away from it`
    );
  }

  return { pass: hardFails.length === 0, hardFails, softFlags };
}

/**
 * Screen a batch. Anything that throws is treated as a rejection, not a pass —
 * rule 4: when uncertain, skip.
 */
export function screenCandidates(candidates) {
  return (candidates || []).map((c) => {
    try {
      return { candidate: c, ...checkCandidate(c) };
    } catch (e) {
      return {
        candidate: c,
        pass: false,
        hardFails: [`filter error, defaulting to reject: ${e.message}`],
        softFlags: [],
      };
    }
  });
}
