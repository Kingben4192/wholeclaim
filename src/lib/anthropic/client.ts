import Anthropic from "@anthropic-ai/sdk";

// Model locked to claude-sonnet-4-6 per Decision Log #7 — this exact model
// passed Golden Test Run 01 (6/6). Do not swap models without a new golden run.
const MODEL = "claude-sonnet-4-6";

export function isAnthropicConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function callClaude(prompt: string, maxTokens = 2000) {
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
