import { describe, it, expect } from "vitest";
import { applyOutputFilter, UNIVERSAL_DISCLAIMER } from "./outputFilter";

describe("applyOutputFilter", () => {
  it("passes through clean text unchanged", () => {
    const text = "Here is a factual summary of your claim status.";
    const result = applyOutputFilter(text, "decide");
    expect(result.text).toBe(text);
    expect(result.blocked).toBe(false);
    expect(result.softened).toBe(false);
  });

  it("blocks and replaces text asserting an outcome", () => {
    const text = "Your claim will be approved once you submit this.";
    const result = applyOutputFilter(text, "decide");
    expect(result.blocked).toBe(true);
    expect(result.text).not.toContain("will be approved");
    expect(result.text).toContain(UNIVERSAL_DISCLAIMER);
  });

  it("blocks text asserting a guaranteed payment amount", () => {
    const result = applyOutputFilter("You are owed $12,000 for this loss.", "letter:delay");
    expect(result.blocked).toBe(true);
  });

  it("blocks text naming bad faith or fraud conclusions", () => {
    const result = applyOutputFilter("This is fraud on the carrier's part.", "decide");
    expect(result.blocked).toBe(true);
  });

  it("softens a sue/lawyer suggestion in place, without blocking the whole response", () => {
    const text = "Document everything. You should sue if this continues.";
    const result = applyOutputFilter(text, "decide");
    expect(result.blocked).toBe(false);
    expect(result.softened).toBe(true);
    expect(result.text).toContain("Document everything.");
    expect(result.text).not.toMatch(/you should sue/i);
    expect(result.text).toContain("you may want to consult an attorney about this");
  });

  it("softens 'get a lawyer' the same way", () => {
    const result = applyOutputFilter("At this point you should get a lawyer.", "letter:doi");
    expect(result.softened).toBe(true);
    expect(result.blocked).toBe(false);
    expect(result.text).not.toMatch(/get a lawyer/i);
  });

  it("block patterns take priority over soften patterns in the same response", () => {
    const text = "You should sue them. Your claim will be approved regardless.";
    const result = applyOutputFilter(text, "decide");
    expect(result.blocked).toBe(true);
    expect(result.text).toContain(UNIVERSAL_DISCLAIMER);
  });

  it("is case-insensitive", () => {
    expect(applyOutputFilter("This Is Fraud.", "decide").blocked).toBe(true);
    expect(applyOutputFilter("GUARANTEED TO win.", "decide").blocked).toBe(true);
  });

  it("does not false-positive on an on-topic, non-proactive attorney mention already in neutral form", () => {
    const text = "If litigation ever becomes a consideration, you may want to consult an attorney about this.";
    const result = applyOutputFilter(text, "decide");
    expect(result.blocked).toBe(false);
    expect(result.softened).toBe(false);
    expect(result.text).toBe(text);
  });
});
