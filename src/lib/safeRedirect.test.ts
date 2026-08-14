import { describe, it, expect } from "vitest";
import { isSafeNext, safeNext, DEFAULT_NEXT } from "./safeRedirect";

describe("safeRedirect — open redirect guard", () => {
  it("REGRESSION: rejects an absolute external URL", () => {
    // The actual bug: /auth/callback?next=https://evil.com redirected
    // off-site after the session was established.
    expect(isSafeNext("https://evil.com")).toBe(false);
    expect(safeNext("https://evil.com")).toBe(DEFAULT_NEXT);
  });

  it("rejects protocol-relative and backslash-normalised externals", () => {
    for (const bad of ["//evil.com", "///evil.com", "/\\evil.com", "/\\/evil.com"]) {
      expect(isSafeNext(bad), bad).toBe(false);
      expect(safeNext(bad), bad).toBe(DEFAULT_NEXT);
    }
  });

  it("rejects other schemes", () => {
    for (const bad of ["http://evil.com", "javascript:alert(1)", "data:text/html,x", "mailto:a@b.c"]) {
      expect(isSafeNext(bad), bad).toBe(false);
    }
  });

  it("rejects relative paths that are not origin-absolute", () => {
    for (const bad of ["account", "../account", ""]) {
      expect(isSafeNext(bad), bad).toBe(false);
    }
  });

  it("rejects control characters", () => {
    expect(isSafeNext("/account\nSet-Cookie: x=1")).toBe(false);
    expect(isSafeNext("/account\tx")).toBe(false);
  });

  it("rejects null/undefined and falls back", () => {
    expect(isSafeNext(null)).toBe(false);
    expect(isSafeNext(undefined)).toBe(false);
    expect(safeNext(null)).toBe(DEFAULT_NEXT);
  });

  it("ACCEPTS the legitimate destinations this app actually uses", () => {
    for (const good of [
      "/account",
      "/claim",
      "/claim/8b1f2c3d-0000-4444-8888-abcdefabcdef",
      "/claim/new",
      "/grade",
      "/library",
      "/account?exported=1",
      "/claim/123#evidence",
    ]) {
      expect(isSafeNext(good), good).toBe(true);
      expect(safeNext(good), good).toBe(good);
    }
  });
});
