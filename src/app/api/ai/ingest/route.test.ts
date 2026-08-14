import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocked so the test exercises the real route handler's auth path without
// touching Supabase or Anthropic.
//
// vi.hoisted() is required: vi.mock factories are hoisted above ordinary
// const declarations, so a factory closing over a plain `const fn = vi.fn()`
// hits the temporal dead zone and throws — which this route would then
// swallow as a 502, masking the real behaviour under test.
const { getUser, callClaude, checkUsageGate, logAiRun } = vi.hoisted(() => ({
  getUser: vi.fn(),
  callClaude: vi.fn(),
  checkUsageGate: vi.fn(),
  logAiRun: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser } }),
}));
vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: () => true }));
vi.mock("@/lib/anthropic/client", () => ({
  isAnthropicConfigured: () => true,
  callClaude,
}));
vi.mock("@/lib/anthropic/rateLimit", () => ({ checkUsageGate, logAiRun }));
vi.mock("@/lib/anthropic/prompts", () => ({
  ingestPrompt: (raw: string) => `prompt:${raw}`,
  PROMPT_VERSION: "test-v1",
}));

import { POST } from "./route";

function req(body: unknown) {
  return new Request("http://localhost/api/ai/ingest", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;
}

describe("POST /api/ai/ingest — admin gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_EMAIL = "owner@example.com";
    checkUsageGate.mockResolvedValue({ allowed: true });
    // Full shape the route consumes: usage.* for logAiRun, and `text` must
    // be valid JSON because the route JSON.parses it into `drafts`.
    callClaude.mockResolvedValue({
      text: JSON.stringify([{ title: "draft entry" }]),
      usage: { input_tokens: 10, output_tokens: 20 },
    });
    logAiRun.mockResolvedValue(undefined);
  });

  it("REGRESSION: rejects a signed-in NON-admin with 403", async () => {
    // The actual bug: the route checked only getUser(), so any signed-in
    // user could reach Anthropic despite Decision #10's admin-only rule.
    getUser.mockResolvedValue({ data: { user: { id: "u1", email: "someone@else.com" } } });

    const res = await POST(req({ raw: "some material" }));

    expect(res.status).toBe(403);
    expect(callClaude).not.toHaveBeenCalled();
    expect(checkUsageGate).not.toHaveBeenCalled();
  });

  it("still rejects an unauthenticated caller with 401", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const res = await POST(req({ raw: "some material" }));

    expect(res.status).toBe(401);
    expect(callClaude).not.toHaveBeenCalled();
  });

  it("ALLOWS the admin through — legitimate caller still works", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "admin", email: "OWNER@example.com" } } });

    const res = await POST(req({ raw: "some material" }));

    expect(res.status).toBe(200);
    expect(callClaude).toHaveBeenCalledOnce();
  });

  it("admin match is case-insensitive on both sides", async () => {
    process.env.ADMIN_EMAIL = "Owner@Example.COM";
    getUser.mockResolvedValue({ data: { user: { id: "admin", email: "owner@example.com" } } });

    const res = await POST(req({ raw: "some material" }));

    expect(res.status).toBe(200);
  });

  it("admin gate runs before body validation is rewarded — bad body still 400 for admin", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "admin", email: "owner@example.com" } } });

    const res = await POST(req({ raw: "   " }));

    expect(res.status).toBe(400);
    expect(callClaude).not.toHaveBeenCalled();
  });
});
