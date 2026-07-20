import Anthropic from "@anthropic-ai/sdk";

// Model locked to claude-sonnet-4-6 per Decision Log #7 — this exact model
// passed Golden Test Run 01 (6/6). Do not swap models without a new golden run.
const MODEL = "claude-sonnet-4-6";

export function isAnthropicConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

// 3000, not the Build Brief's original 1500-2000 range: verified live that
// GA's prompt (5 detailed headings) genuinely truncates mid-sentence at
// 2000 output tokens. Claude only uses what a response needs, so this is a
// headroom increase for the few tools that run long, not a cost floor.
export async function callClaude(prompt: string, maxTokens = 3000) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  return { text, usage: response.usage };
}
