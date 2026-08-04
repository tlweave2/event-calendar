import { describe, expect, it } from "vitest";
import { getPlanConfig, hasFeature, isPlanKey, PLANS } from "@/lib/stripe";

describe("plan configuration", () => {
  it("sells exactly two tiers", () => {
    // The pricing page advertises Free and Pro. Anything else here would be a
    // tier with no price, no pricing card, and no checkout path.
    expect(Object.keys(PLANS).sort()).toEqual(["FREE", "PRO"]);
  });

  it("limits Free to one seat and one calendar's worth of events", () => {
    expect(PLANS.FREE.seats).toBe(1);
    expect(PLANS.FREE.monthlyEvents).toBe(5);
  });

  it("gives Pro unlimited events and seats", () => {
    // Pro previously shipped with the same single seat as Free, which made
    // the invite flow unusable for paying customers.
    expect(PLANS.PRO.seats).toBe(Number.POSITIVE_INFINITY);
    expect(PLANS.PRO.monthlyEvents).toBe(Number.POSITIVE_INFINITY);
  });

  it("treats a manually granted Enterprise plan as Pro, never as Free", () => {
    // Enterprise is not sold self-serve, but a tenant granted it through the
    // superadmin endpoint must not silently drop to free-tier limits.
    const enterprise = getPlanConfig("ENTERPRISE");
    expect(enterprise.monthlyEvents).toBe(Number.POSITIVE_INFINITY);
    expect(enterprise.seats).toBe(Number.POSITIVE_INFINITY);
    expect(enterprise.aiFlyer).toBe(true);
  });

  it("falls back to Free for an unknown plan", () => {
    expect(getPlanConfig("PLATINUM").name).toBe("Free");
    expect(isPlanKey("PLATINUM")).toBe(false);
  });

  it("gates paid features", () => {
    expect(hasFeature("FREE", "aiFlyer")).toBe(false);
    expect(hasFeature("FREE", "analytics")).toBe(false);
    expect(hasFeature("FREE", "removeBadge")).toBe(false);

    expect(hasFeature("PRO", "aiFlyer")).toBe(true);
    expect(hasFeature("PRO", "analytics")).toBe(true);
    expect(hasFeature("PRO", "removeBadge")).toBe(true);
  });
});
