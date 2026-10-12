import { describe, it, expect } from "vitest";
import { validateWaitlistInput, WAITLIST_PLANS } from "./waitlist";

describe("validateWaitlistInput", () => {
  it("accepts a plan without units and lowercases the email", () => {
    expect(validateWaitlistInput({ email: " Owner@Example.COM ", plan: "property_vault" })).toEqual({
      ok: true,
      email: "owner@example.com",
      plan: "property_vault",
      unitCount: null,
    });
  });

  it("requires a whole number of units for Portfolio", () => {
    expect(validateWaitlistInput({ email: "pm@example.com", plan: "portfolio", units: "120" })).toEqual({
      ok: true,
      email: "pm@example.com",
      plan: "portfolio",
      unitCount: 120,
    });
    for (const units of ["", "0", "-3", "12.5", "abc", "100001"]) {
      expect(validateWaitlistInput({ email: "pm@example.com", plan: "portfolio", units }).ok).toBe(false);
    }
  });

  it("ignores units for plans that don't ask for them", () => {
    const result = validateWaitlistInput({ email: "c@example.com", plan: "contractor_pro", units: "40" });
    expect(result.ok && result.unitCount).toBeNull();
  });

  it("rejects bad emails and unknown plans", () => {
    expect(validateWaitlistInput({ email: "not-an-email", plan: "property_vault" }).ok).toBe(false);
    expect(validateWaitlistInput({ email: "a@example.com", plan: "pro_lifetime" }).ok).toBe(false);
  });

  it("lists exactly the four approved coming-soon plans, Portfolio first", () => {
    expect(WAITLIST_PLANS.map((p) => p.id)).toEqual([
      "portfolio",
      "property_record_plus",
      "property_vault",
      "contractor_pro",
    ]);
  });
});
