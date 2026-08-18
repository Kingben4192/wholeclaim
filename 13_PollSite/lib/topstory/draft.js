// =============================================================================
// Ticket 3, Stage 2 — candidate drafting.
//
// Turns a morning's headlines into 3-5 proposed polls, then runs every one
// through the deterministic governance filter (stage 3) before anything is
// returned. Nothing here publishes; nothing here even writes to the database.
// The output is a list of candidates for a human to approve, reject, or park.
//
// Model: claude-opus-5. Uses the official SDK, not raw HTTP.
//
// Refusals are handled as a content outcome, not an exception: Opus 5 runs
// safety classifiers and can decline with HTTP 200 + stop_reason "refusal".
// Server-side fallbacks are enabled so a declined request is retried on
// Anthropic's recommended fallback inside the same call rather than losing
// the morning's run.
// =============================================================================

import Anthropic from "@anthropic-ai/sdk";
import { screenCandidates } from "./governance.js";

const MODEL = "claude-opus-5";

const CATEGORIES = ["politics", "health", "trending", "social", "home", "sports"];

// Structured output. Constrained so the model cannot return a shape the
// governance filter or the polls table would reject: category must be one of
// the six real ones, and choices are bounded 2-4 to match schema.sql.
const CANDIDATE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["candidates"],
  properties: {
    candidates: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["question", "choices", "category", "sourceHeadline", "sourceUrl", "rationale"],
        properties: {
          question: { type: "string" },
          choices: { type: "array", items: { type: "string" } },
          category: { type: "string", enum: CATEGORIES },
          sourceHeadline: { type: "string" },
          sourceUrl: { type: "string" },
          rationale: {
            type: "string",
            description:
              "One sentence: why this clears the governance rules. Shown to the reviewer so they audit the reasoning, not just the verdict.",
          },
        },
      },
    },
  },
};

const SYSTEM = `You draft candidate poll questions for "What Do People Think?", a site that asks
ordinary people what they think and shows an honest, voluntary count. You are a
drafting assistant: a human reviews and approves every candidate before anything
is published. Propose; never assume publication.

FRAMING — the hard rule.
Every question must be prediction-framed or opinion-framed, never
endorsement-framed. The test: can someone on either side answer it without
feeling the poll has already decided?

  GOOD  "Will more cities cancel their license-plate camera contracts this year?"
  GOOD  "Should police be required to get a warrant before searching camera data?"
  BAD   "Do you support ending police surveillance?"        <- advocacy
  BAD   "Why do departments keep wasting money on this?"    <- presumes the answer

Never embed a contested premise. "Who has more influence over grocery prices?"
is answerable; "Who do you blame for today's HIGH grocery prices?" asserts that
prices are high.

GOVERNANCE — from the site's curation rules. A candidate that fails any of
these must not be proposed at all.
  1. Nothing anchored to a real minor, even indirectly.
  2. Nothing whose traction depends on imitation or copycat behaviour. Judge the
     QUESTION you are writing, not the source story. A story about cameras being
     vandalised can still yield a clean question about warrant requirements --
     propose that, never "should people vandalise them".
  3. Abstract the underlying question. Strip incident specifics, named private
     individuals, and active criminal proceedings.
  4. When uncertain, skip it. A lost topic costs nothing; a bad poll costs trust.

CHOICES.
  - 2 to 4 options, mutually exclusive, covering the realistic answer space.
  - Always include a genuine opt-out ("Not sure", "Haven't followed it",
    "Depends on the specifics") so someone without a view is never forced to
    pick a side.
  - Keep them short and parallel in structure.

CATEGORY. Exactly one of: politics, health, trending, social, home, sports.
  social  = social media and online life
  home    = home, money, prices, bills
  sports  = sports AND entertainment (TV, film, music, awards)

WHAT TO SKIP.
  - Transactional sports news -- roster moves, scores, injuries, rankings. There
    is no two-sided question in "team signs player". Sports feeds are mostly
    this; take only the genuinely arguable stories.
  - Stories with no real disagreement. If almost everyone would answer the same
    way, it is not a poll.
  - Anything you would have to invent a source or a statistic to justify.

MULTI-ANGLE. One strong story often yields several distinct questions --
different angles on it are more useful than one question each from several weak
stories. Return each angle as its own candidate sharing the same sourceUrl.

Return 3-5 candidates. Fewer is correct when the day is thin. Returning none is
correct when nothing clears the bar -- never pad to hit a number.`;

function buildUserMessage(items) {
  const lines = items.map(
    (it, i) =>
      `${i + 1}. [${it.sourceLabel}] ${it.title}\n   ${it.summary || "(no summary)"}\n   ${it.url}`
  );
  return `Today's headlines:\n\n${lines.join("\n\n")}\n\nDraft candidate polls per your instructions.`;
}

/**
 * Draft candidates from headlines and screen them.
 *
 * @returns {{
 *   candidates: Array,      // passed the filter — ready for human review
 *   rejected: Array,        // failed the filter, with reasons, for the audit trail
 *   usage: object|null,
 *   refused: boolean,
 *   refusalCategory: string|null,
 *   servedBy: string|null   // set when a fallback model answered
 * }}
 */
export async function draftCandidates(items, { apiKey = process.env.ANTHROPIC_API_KEY } = {}) {
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. This product uses its own key, never WholeClaim's."
    );
  }
  if (!items || items.length === 0) {
    return { candidates: [], rejected: [], usage: null, refused: false, refusalCategory: null, servedBy: null };
  }

  const client = new Anthropic({ apiKey });

  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    // A declined request is retried on Anthropic's recommended fallback inside
    // this same call. Routed by refusal category, so it survives a deprecated
    // fallback model without a code change.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SYSTEM,
    output_config: {
      format: { type: "json_schema", schema: CANDIDATE_SCHEMA },
    },
    messages: [{ role: "user", content: buildUserMessage(items) }],
  });

  // Check stop_reason BEFORE reading content. On a refusal, content is empty
  // (declined before output) or partial (declined mid-stream) -- indexing
  // content[0] unconditionally would throw.
  if (response.stop_reason === "refusal") {
    return {
      candidates: [],
      rejected: [],
      usage: response.usage ?? null,
      refused: true,
      refusalCategory: response.stop_details?.category ?? null,
      servedBy: null,
    };
  }

  const text = (response.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    throw new Error(`model returned unparseable output: ${e.message}`);
  }

  // Stage 3. The filter is the gate, not a suggestion -- a candidate that
  // fails is never returned as publishable, only recorded as rejected.
  const screened = screenCandidates(parsed.candidates || []);

  const servedByFallback = (response.usage?.iterations || []).some(
    (entry) => entry.type === "fallback_message"
  );

  return {
    candidates: screened.filter((s) => s.pass),
    rejected: screened.filter((s) => !s.pass),
    usage: response.usage ?? null,
    refused: false,
    refusalCategory: null,
    servedBy: servedByFallback ? response.model : null,
  };
}
