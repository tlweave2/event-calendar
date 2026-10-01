import { test } from "node:test";
import assert from "node:assert/strict";
import { FLYER_SCANS_PER_MONTH, getPlanConfig, getStoredPlanConfig, hasFeature, isPaidPlan } from "./plans";

test("while everything is free, every plan gets everything", () => {
  for (const plan of ["FREE", "PRO", "ENTERPRISE", "SOMETHING_ELSE", ""]) {
    const config = getPlanConfig(plan, true);
    assert.equal(config.monthlyEvents, Infinity, plan);
    assert.equal(config.adminUsers, 25, plan);
    assert.equal(hasFeature(plan, "aiFlyer", true), true, plan);
    assert.equal(hasFeature(plan, "removeBadge", true), true, plan);
  }
  assert.ok(FLYER_SCANS_PER_MONTH > 0);
});

// The paid plans are kept so they can be switched back on.
test("with paid plans on, paid plans get the paid features", () => {
  for (const plan of ["PRO", "ENTERPRISE"]) {
    assert.equal(hasFeature(plan, "aiFlyer", false), true, plan);
    assert.equal(hasFeature(plan, "removeBadge", false), true, plan);
    assert.equal(isPaidPlan(plan), true, plan);
  }
});

test("with paid plans on, free and unknown plans fall back to Free limits", () => {
  for (const plan of ["FREE", "SOMETHING_ELSE", ""]) {
    assert.equal(hasFeature(plan, "aiFlyer", false), false, plan);
    assert.equal(getPlanConfig(plan, false).monthlyEvents, 5, plan);
    assert.equal(isPaidPlan(plan), false, plan);
  }
});

test("stored plan limits are unchanged", () => {
  assert.equal(getStoredPlanConfig("FREE").adminUsers, 1);
  assert.equal(getStoredPlanConfig("PRO").adminUsers, 1);
  assert.equal(getStoredPlanConfig("ENTERPRISE").adminUsers, 25);
  assert.equal(getStoredPlanConfig("ENTERPRISE").monthlyEvents, Infinity);
});
