// =============================================================================
// Fixtures for the governance filter. Run with:  node lib/topstory/governance.fixtures.mjs
//
// No test framework — 13_PollSite has none, and adding one for this is scope
// the ticket didn't ask for. This exits non-zero on failure, so it works as a
// pre-deploy check either way.
//
// The Flock Safety cases are the point. They encode the distinction the whole
// filter turns on: the SOURCE STORY includes camera vandalism, but four
// legitimate policy questions come off the same story. A filter that judged the
// source would lose all four. These fixtures fail loudly if anyone ever
// "simplifies" it that way.
// =============================================================================

import { checkCandidate } from "./governance.js";

const FLOCK_SOURCE =
  "Flock Safety adds safeguards after misuse reports; vandalism of cameras reported nationwide as cities cancel contracts";

const CASES = [
  // --- The four supplied Flock candidates. All four MUST pass. ---------------
  {
    name: "Flock: safety vs privacy",
    expect: true,
    c: {
      question: "Do license-plate cameras do more to protect public safety or violate personal privacy?",
      choices: ["Protect public safety", "Violate privacy", "Both equally", "Not sure"],
      sourceHeadline: FLOCK_SOURCE,
    },
  },
  {
    name: "Flock: warrant requirement",
    expect: true,
    c: {
      question: "Should police be required to get a warrant before searching license-plate camera data?",
      choices: ["Yes, always", "Only for some searches", "No", "Not sure"],
      sourceHeadline: FLOCK_SOURCE,
    },
  },
  {
    name: "Flock: contract cancellations (prediction-framed)",
    expect: true,
    c: {
      question: "Will more cities cancel their license-plate camera contracts this year?",
      choices: ["Yes, many more", "A few", "No, adoption will grow", "Too close to call"],
      sourceHeadline: FLOCK_SOURCE,
    },
  },
  {
    name: "Flock: federal access",
    expect: true,
    c: {
      question: "Should federal agencies be allowed to access local license-plate camera data?",
      choices: ["Yes", "Only with a warrant", "No", "Not sure"],
      sourceHeadline: FLOCK_SOURCE,
    },
  },

  // --- The one angle from the same story that MUST be rejected --------------
  {
    name: "Flock: vandalism angle — rule 2",
    expect: false,
    mustFailOn: "copycat",
    c: {
      question: "Is it justified to vandalize license-plate cameras in your neighborhood?",
      choices: ["Yes", "No", "Depends", "Not sure"],
      sourceHeadline: FLOCK_SOURCE,
    },
  },

  // --- Framing ---------------------------------------------------------------
  {
    name: "endorsement framing rejected",
    expect: false,
    mustFailOn: "endorsement",
    c: {
      question: "Do you support ending police surveillance?",
      choices: ["Yes", "No", "Not sure"],
      sourceHeadline: FLOCK_SOURCE,
    },
  },
  {
    name: "loaded 'why is' framing rejected",
    expect: false,
    mustFailOn: "endorsement",
    c: {
      question: "Why do police departments keep wasting money on surveillance?",
      choices: ["Incompetence", "Corruption", "Not sure"],
      sourceHeadline: FLOCK_SOURCE,
    },
  },

  // --- Rules 1 and 3 ---------------------------------------------------------
  {
    name: "minors + anchoring rejected",
    expect: false,
    mustFailOn: "minors",
    c: {
      question: "Should the teenager accused in the case be charged as an adult?",
      choices: ["Yes", "No", "Not sure"],
      sourceHeadline: "Teen arrested after incident",
    },
  },
  {
    // Rule 1 targets polls ANCHORED to real minors, not every mention of them.
    // "children" appears with no victim/arrest/abuse context, so this is a
    // legitimate policy question: pass, but surface a flag for the human.
    name: "minors in neutral policy context allowed, flagged",
    expect: true,
    mustFlag: "minors",
    c: {
      question: "Should children be required to be 16 before opening a social media account?",
      choices: ["Yes", "No", "Depends on the platform", "Not sure"],
      sourceHeadline: "Lawmakers debate age limits for social platforms",
    },
  },
  {
    name: "tragedy specifics rejected",
    expect: false,
    mustFailOn: "tragedy",
    c: {
      question: "Was the response to the shooting handled well?",
      choices: ["Yes", "No", "Not sure"],
      sourceHeadline: "Officials review response",
    },
  },
  {
    name: "active proceedings rejected",
    expect: false,
    mustFailOn: "proceedings",
    c: {
      question: "Should the executive charged with fraud go to prison?",
      choices: ["Yes", "No", "Not sure"],
      sourceHeadline: "Executive indicted",
    },
  },

  // --- Structural ------------------------------------------------------------
  {
    name: "too many choices rejected",
    expect: false,
    mustFailOn: "2-4 choices",
    c: {
      question: "Which policy matters most to you?",
      choices: ["A", "B", "C", "D", "E"],
      sourceHeadline: "Policy debate",
    },
  },
  {
    name: "missing opt-out passes but is flagged",
    expect: true,
    mustFlag: "opt-out",
    c: {
      question: "Will electricity prices rise next year?",
      choices: ["Yes", "No"],
      sourceHeadline: "Utilities file rate requests",
    },
  },
];

let failed = 0;
for (const t of CASES) {
  const r = checkCandidate(t.c);
  const ok = r.pass === t.expect;
  const reasons = [...r.hardFails, ...r.softFlags].join(" | ");

  let detailOk = true;
  if (t.mustFailOn && !r.hardFails.some((f) => f.toLowerCase().includes(t.mustFailOn.toLowerCase()))) {
    detailOk = false;
  }
  if (t.mustFlag && !r.softFlags.some((f) => f.toLowerCase().includes(t.mustFlag.toLowerCase()))) {
    detailOk = false;
  }

  if (ok && detailOk) {
    console.log(`  PASS  ${t.name}${reasons ? "  [" + reasons + "]" : ""}`);
  } else {
    failed++;
    console.log(`  FAIL  ${t.name}`);
    console.log(`        expected pass=${t.expect}, got pass=${r.pass}`);
    if (t.mustFailOn) console.log(`        expected hard fail containing "${t.mustFailOn}"`);
    if (t.mustFlag) console.log(`        expected soft flag containing "${t.mustFlag}"`);
    console.log(`        hardFails: ${JSON.stringify(r.hardFails)}`);
    console.log(`        softFlags: ${JSON.stringify(r.softFlags)}`);
  }
}

console.log(`\n${CASES.length - failed}/${CASES.length} passed`);
process.exit(failed ? 1 : 0);
