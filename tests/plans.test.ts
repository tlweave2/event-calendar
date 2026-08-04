import { describe, expect, it } from "vitest";
import { getPlanConfig, hasFeature, isPlanKey, PLANS } from "@/lib/stripe";

describe("plan configuration", () => {
  it("gives Pro more seats than Free", () => {
    // Pro previously shipped with the same single seat as Free, which made
    // the invite flow unusable for paying customers.
    expect(PLANS.PRO.seats).toBeGreaterThan(PLANS.FREE.seats);
  });

  it("does not fall back to Free limits for Enterprise", () => {
    const enterprise = getPlanConfig("ENTERPRISE");
    expect(enterprise.name).toBe("Enterprise");
    expect(enterprise.monthlyEvents).toBe(Number.POSITIVE_INFINITY);
    expect(enterprise.seats).toBe(Number.POSITIVE_INFINITY);
  });

  it("falls back to Free for an unknown plan", () => {
    expect(getPlanConfig("PLATINUM").name).toBe("Free");
    expect(isPlanKey("PLATINUM")).toBe(false);
  });

  it("gates paid features", () => {
    expect(hasFeature("FREE", "aiFlyer")).toBe(false);
    expect(hasFeature("FREE", "webhooks")).toBe(false);
    expect(hasFeature("PRO", "aiFlyer")).toBe(true);
    expect(hasFeature("ENTERPRISE", "aiFlyer")).toBe(true);
  });
});
